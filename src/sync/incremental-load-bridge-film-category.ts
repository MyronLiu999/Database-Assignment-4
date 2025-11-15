import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { FilmCategory } from '../entity/entities/FilmCategory';
import { BridgeFilmCategory } from '../entity-sqlite/bridge_film_category';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadBridgeFilmCategory() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlFilmCategoryRepo = AppDataSourceMySQL.getRepository(FilmCategory);
    const sqliteBridgeFilmCategoryRepo = AppDataSourceSQLite.getRepository(BridgeFilmCategory);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'film_category' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newFilmCategories = await mysqlFilmCategoryRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newFilmCategories.length === 0) {
      console.log('bridge_film_category');
      return;
    }

    const bridgeFilmCategories = newFilmCategories.map(filmCategory => {
      const bridge = new BridgeFilmCategory();
      bridge.film_key = filmCategory.filmId * 100 + 1;
      bridge.category_key = filmCategory.categoryId * 100 + 3;
      
      return bridge;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(bridgeFilmCategories);
      await syncStateRepo.update({ table_name: 'film_category' }, { last_sync_time: new Date() });
    });

    console.log(`bridge_film_category ${bridgeFilmCategories.length} data input`);

  } catch (error) {
    console.error('bridge_film_category failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}