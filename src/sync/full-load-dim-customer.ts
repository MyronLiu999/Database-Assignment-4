import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Customer as MySqlCustomer } from '../entity/entities/Customer';
import { Address as MySqlAddress } from '../entity/entities/Address';
import { City as MySqlCity } from '../entity/entities/City';
import { Country as MySqlCountry } from '../entity/entities/Country';
import { DimCustomer as SqliteDimCustomer } from '../entity-sqlite/dim_customer';

export async function fullLoadDimCustomer() {
  try {

    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("dim_customer initialization");

    const mysqlCustomerRepo = AppDataSourceMySQL.getRepository(MySqlCustomer);
    const sqliteDimCustomerRepo = AppDataSourceSQLite.getRepository(SqliteDimCustomer);

    const allMySqlCustomers = await mysqlCustomerRepo
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.address', 'address')
      .leftJoinAndSelect('address.city', 'city')
      .leftJoinAndSelect('city.country', 'country')
      .getMany();

    const sqliteDimCustomers = allMySqlCustomers.map(mysqlCustomer => {
      const dimCustomer = new SqliteDimCustomer();
      dimCustomer.customer_key = mysqlCustomer.customerId * 100 + 1;
      dimCustomer.customer_id = mysqlCustomer.customerId;
      dimCustomer.first_name = mysqlCustomer.firstName;
      dimCustomer.last_name = mysqlCustomer.lastName;
      dimCustomer.active = mysqlCustomer.active ? 1 : 0;
      dimCustomer.city = mysqlCustomer.address.city.city;
      dimCustomer.country = mysqlCustomer.address.city.country.country;
      dimCustomer.last_update = mysqlCustomer.lastUpdate;
      return dimCustomer;
    });

    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM dim_customer`);
      await transactionManager.save(sqliteDimCustomers);
    });

    console.log(`dim_customer ${sqliteDimCustomers.length} data input`);

  } catch (error) {
    console.error("failed", error);
  } finally {
    // deconnection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadDimCustomer();