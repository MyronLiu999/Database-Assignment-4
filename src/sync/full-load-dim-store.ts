import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Store as MySqlStore } from '../entity/entities/Store';
import { Address as MySqlAddress } from '../entity/entities/Address';
import { City as MySqlCity } from '../entity/entities/City';
import { Country as MySqlCountry } from '../entity/entities/Country';
import { DimStore as SqliteDimStore } from '../entity-sqlite/dim_store';

export async function fullLoadDimStore() {
  try {

    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("dim_store initializtion");

    const mysqlStoreRepo = AppDataSourceMySQL.getRepository(MySqlStore);
    const sqliteDimStoreRepo = AppDataSourceSQLite.getRepository(SqliteDimStore);

    const allMySqlStores = await mysqlStoreRepo
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.address', 'address')
      .leftJoinAndSelect('address.city', 'city')
      .leftJoinAndSelect('city.country', 'country')
      .getMany();

    const sqliteDimStores = allMySqlStores.map(mysqlStore => {
      const dimStore = new SqliteDimStore();
      dimStore.store_key = mysqlStore.storeId * 100 + 1;
      dimStore.store_id = mysqlStore.storeId;
      dimStore.city = mysqlStore.address.city.city;
      dimStore.country = mysqlStore.address.city.country.country;
      dimStore.last_update = mysqlStore.lastUpdate;
      return dimStore;
    });

    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM dim_store`);
      await transactionManager.save(sqliteDimStores);
    });

    console.log(`dim_store ${sqliteDimStores.length} data input`);

  } catch (error) {
    console.error("dim_store failed", error);
  } finally {
    // deconnection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadDimStore();