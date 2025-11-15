import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Payment as MySqlPayment } from '../entity/entities/Payment';
import { Customer as MySqlCustomer } from '../entity/entities/Customer';
import { Staff as MySqlStaff } from '../entity/entities/Staff';
import { Store as MySqlStore } from '../entity/entities/Store';
import { FactPayment as SqliteFactPayment } from '../entity-sqlite/fact_payment';

// 日期转date_key（YYYYMMDD格式）
function dateToDateKey(date: Date): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}

export async function fullLoadFactPayment() {
  try {
    // 1. initialized
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("initialization");

    const mysqlPaymentRepo = AppDataSourceMySQL.getRepository(MySqlPayment);
    const sqliteFactPaymentRepo = AppDataSourceSQLite.getRepository(SqliteFactPayment);

    const allMySqlPayments = await mysqlPaymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.customer', 'customer')
      .leftJoinAndSelect('payment.staff', 'staff')
      .leftJoinAndSelect('staff.store', 'store')
      .getMany();

    const sqliteFactPayments = allMySqlPayments.map(mysqlPayment => {
      const factPayment = new SqliteFactPayment();
      factPayment.fact_payment_key = mysqlPayment.paymentId * 100 + 1;
      factPayment.payment_id = mysqlPayment.paymentId;
      factPayment.date_key_paid = dateToDateKey(mysqlPayment.paymentDate);
      factPayment.customer_key = mysqlPayment.customer.customerId * 100 + 1;
      factPayment.store_key = mysqlPayment.staff.store.storeId * 100 + 1;
      factPayment.staff_id = mysqlPayment.staff.staffId;
      factPayment.amount = mysqlPayment.amount;
      return factPayment;
    });

    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM fact_payment`);
      await transactionManager.save(sqliteFactPayments);
    });

    console.log(`fact_payment ${sqliteFactPayments.length} data input`);

  } catch (error) {
    console.error("fact_payment failed", error);
  } finally {
    // deconnection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadFactPayment();