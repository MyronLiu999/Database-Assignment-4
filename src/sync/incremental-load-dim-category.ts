import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Category } from '../entity/entities/Category';
import { DimCategory } from '../entity-sqlite/dim_category';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadDimCategory() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlCategoryRepo = AppDataSourceMySQL.getRepository(Category);
    const sqliteDimCategoryRepo = AppDataSourceSQLite.getRepository(DimCategory);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'category' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newCategories = await mysqlCategoryRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newCategories.length === 0) {
      return;
    }

    const dimCategories = newCategories.map(category => {
      const dimCategory = new DimCategory();
      dimCategory.category_key = category.categoryId * 100 + 3;
      dimCategory.category_id = category.categoryId;
      dimCategory.name = category.name;
      dimCategory.last_update = category.lastUpdate;
      return dimCategory;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(dimCategories);
      await syncStateRepo.update({ table_name: 'category' }, { last_sync_time: new Date() });
    });

    console.log(`dim_category ${dimCategories.length} data input`);

  } catch (error) {
    console.error('dim_category failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}