import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Payment } from '../entity/entities/Payment';
import { Customer } from '../entity/entities/Customer';
import { Store } from '../entity/entities/Store';
import { FactPayment } from '../entity-sqlite/fact_payment';
import { DimDate } from '../entity-sqlite/dim_date';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadFactPayment() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlPaymentRepo = AppDataSourceMySQL.getRepository(Payment);
    const mysqlCustomerRepo = AppDataSourceMySQL.getRepository(Customer);
    const mysqlStoreRepo = AppDataSourceMySQL.getRepository(Store);
    const sqliteFactPaymentRepo = AppDataSourceSQLite.getRepository(FactPayment);
    const sqliteDimDateRepo = AppDataSourceSQLite.getRepository(DimDate);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    // get payment_date
    const syncState = await syncStateRepo.findOne({ where: { table_name: 'payment' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    // pick payment_date compaed with latest time
    const newPayments = await mysqlPaymentRepo.find({
      where: { paymentDate: MoreThan(lastSyncTime) }
    });

    if (newPayments.length === 0) {
      return;
    }

    // find the latest payment_date 
    const maxPaymentDate = await mysqlPaymentRepo.createQueryBuilder('payment')
      .select('MAX(payment.paymentDate)', 'maxDate')
      .where('payment.paymentDate > :lastSyncTime', { lastSyncTime })
      .getRawOne();

    const factPayments = [];
    for (const payment of newPayments) {
      const customer = await mysqlCustomerRepo.findOne({ where: { customerId: payment.customerId } });
      const store = await mysqlStoreRepo.findOne({ where: { storeId: payment.customer.storeId } });

      const paymentDateKey = parseInt(payment.paymentDate.toISOString().split('T')[0].replace(/-/g, ''));
      const paymentDateEntity = await sqliteDimDateRepo.findOne({ where: { date_key: paymentDateKey } });

      const factPayment = new FactPayment();
      factPayment.fact_payment_key = payment.paymentId * 1000 + 2;
      factPayment.payment_id = payment.paymentId;
      factPayment.date_key_paid = paymentDateEntity?.date_key || 0;
      factPayment.customer_key = customer?.customerId * 100 + 6 || 0;
      factPayment.store_key = store?.storeId * 100 + 5 || 0;
      factPayment.staff_id = payment.staffId;
      factPayment.amount = payment.amount;

      factPayments.push(factPayment);
    }

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(factPayments);
      // updated to lastest payment_date
      await syncStateRepo.update(
        { table_name: 'payment' },
        { last_sync_time: maxPaymentDate.maxDate || new Date() }
      );
    });

    console.log(`fact_payment ${factPayments.length} data input`);

  } catch (error) {
    console.error('fact_payment failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}