import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { FilmCategory as MySqlFilmCategory } from '../entity/entities/FilmCategory';
import { Film as MySqlFilm } from '../entity/entities/Film';
import { Category as MySqlCategory } from '../entity/entities/Category';
import { BridgeFilmCategory as SqliteBridgeFilmCategory } from '../entity-sqlite/bridge_film_category';

export async function fullLoadBridgeFilmCategory() {
  try {
    // 1. initialize
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("bridge_film_category connected");

    // 2. get repo
    const mysqlFilmCategoryRepo = AppDataSourceMySQL.getRepository(MySqlFilmCategory);
    const sqliteBridgeFilmCategoryRepo = AppDataSourceSQLite.getRepository(SqliteBridgeFilmCategory);

    // 3. get data
    const allMySqlFilmCategories = await mysqlFilmCategoryRepo
      .createQueryBuilder('film_category')
      .leftJoinAndSelect('film_category.film', 'film')
      .leftJoinAndSelect('film_category.category', 'category')
      .getMany();

    // 4. data transfer
    const sqliteBridgeFilmCategories = allMySqlFilmCategories.map(mysqlFilmCategory => {
      const bridge = new SqliteBridgeFilmCategory();
      bridge.film_key = mysqlFilmCategory.film.filmId * 100 + 1;
      bridge.category_key = mysqlFilmCategory.category.categoryId * 100 + 1;
      return bridge;
    });

    // 5. clean old data
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM bridge_film_category`);
      await transactionManager.save(sqliteBridgeFilmCategories);
    });

    console.log(`bridge_film_category upload successfully ${sqliteBridgeFilmCategories.length} data input`);

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

fullLoadBridgeFilmCategory();