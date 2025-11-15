import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Store } from '../entity/entities/Store';
import { Address } from '../entity/entities/Address';
import { City } from '../entity/entities/City';
import { Country } from '../entity/entities/Country';
import { DimStore } from '../entity-sqlite/dim_store';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadDimStore() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlStoreRepo = AppDataSourceMySQL.getRepository(Store);
    const mysqlAddressRepo = AppDataSourceMySQL.getRepository(Address);
    const mysqlCityRepo = AppDataSourceMySQL.getRepository(City);
    const mysqlCountryRepo = AppDataSourceMySQL.getRepository(Country);
    const sqliteDimStoreRepo = AppDataSourceSQLite.getRepository(DimStore);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'store' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newStores = await mysqlStoreRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newStores.length === 0) {
      return;
    }

    const dimStores = [];
    for (const store of newStores) {
      const address = await mysqlAddressRepo.findOne({ where: { addressId: store.addressId } });
      const city = await mysqlCityRepo.findOne({ where: { cityId: address?.cityId } });
      const country = await mysqlCountryRepo.findOne({ where: { countryId: city?.countryId } });

      const dimStore = new DimStore();
      dimStore.store_key = store.storeId * 100 + 5;
      dimStore.store_id = store.storeId;
      dimStore.city = city?.city || 'Unknown';
      dimStore.country = country?.country || 'Unknown';
      dimStore.last_update = store.lastUpdate;
      dimStores.push(dimStore);
    }

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(dimStores);
      await syncStateRepo.update({ table_name: 'store' }, { last_sync_time: new Date() });
    });

    console.log(`dim_store incremental successful!  ${dimStores.length} data input`);

  } catch (error) {
    console.error('dim_store failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}