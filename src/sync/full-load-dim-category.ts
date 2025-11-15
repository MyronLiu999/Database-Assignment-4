import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Category as MySqlCategory } from '../entity/entities/Category';
import { DimCategory as SqliteDimCategory } from '../entity-sqlite/dim_category';

export async function fullLoadDimCategory() {
  try {
    // 1. initialization
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("dim_category");

    // 2. get repo
    const mysqlCategoryRepo = AppDataSourceMySQL.getRepository(MySqlCategory);
    const sqliteDimCategoryRepo = AppDataSourceSQLite.getRepository(SqliteDimCategory);

    // 3. get data
    const allMySqlCategories = await mysqlCategoryRepo.find();

    // 4. data transfer
    const sqliteDimCategories = allMySqlCategories.map(mysqlCategory => {
      const dimCategory = new SqliteDimCategory();
      dimCategory.category_key = mysqlCategory.categoryId * 100 + 1;
      dimCategory.category_id = mysqlCategory.categoryId;
      dimCategory.name = mysqlCategory.name;
      dimCategory.last_update = mysqlCategory.lastUpdate;
      return dimCategory;
    });

    // 5. clean old data
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM dim_category`);
      await transactionManager.save(sqliteDimCategories);
    });

    console.log(`dim_category  ${sqliteDimCategories.length} data input`);

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

fullLoadDimCategory();