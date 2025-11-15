import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Customer } from '../entity/entities/Customer';
import { DimCustomer } from '../entity-sqlite/dim_customer';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadDimCustomer() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlCustomerRepo = AppDataSourceMySQL.getRepository(Customer);
    const sqliteDimCustomerRepo = AppDataSourceSQLite.getRepository(DimCustomer);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'customer' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newCustomers = await mysqlCustomerRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newCustomers.length === 0) {
      return;
    }

    const dimCustomers = newCustomers.map(customer => {
      const dimCustomer = new DimCustomer();
      dimCustomer.customer_key = customer.customerId * 100 + 6;
      dimCustomer.customer_id = customer.customerId;
      dimCustomer.first_name = customer.firstName;
      dimCustomer.last_name = customer.lastName;
      dimCustomer.active = customer.active ? 1 : 0;
      dimCustomer.last_update = customer.lastUpdate;
      return dimCustomer;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(dimCustomers);
      await syncStateRepo.update({ table_name: 'customer' }, { last_sync_time: new Date() });
    });

    console.log(`dim_customer ${dimCustomers.length} data input`);

  } catch (error) {
    console.error('dim_customer failed', error);
  } finally {
// deconnection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}