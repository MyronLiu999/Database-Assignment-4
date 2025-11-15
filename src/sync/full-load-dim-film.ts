// src/sync/full-load-dim-film.ts
import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql'; 
import { AppDataSourceSQLite } from '../data-source.sqlite'; 

import { Film as MySqlFilm } from '../entity/entities/Film'; 
import { Language as MySqlLanguage } from '../entity/entities/Language'; 
import { DimFilm as SqliteDimFilm } from '../entity-sqlite/dim_film'; 


export async function fullLoadDimFilm() {
  try {
    // 1. initialization
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("initialization successful");

    // 2. receive Repository：for MySQL input、SQLite output
    const mysqlFilmRepo = AppDataSourceMySQL.getRepository(MySqlFilm);
    const mysqlLanguageRepo = AppDataSourceMySQL.getRepository(MySqlLanguage);
    const sqliteDimFilmRepo = AppDataSourceSQLite.getRepository(SqliteDimFilm);

    // 3. receive all film data from MySQL
    const allMySqlFilms = await mysqlFilmRepo
      .createQueryBuilder('film')
      .leftJoinAndSelect('film.language', 'language')
      .getMany(); 

    // 4. transfer data
    const sqliteDimFilms = allMySqlFilms.map(mysqlFilm => {
      const dimFilm = new SqliteDimFilm();
      // example rule：film_id * 100 + 1
      dimFilm.film_key = mysqlFilm.filmId * 100 + 1;
      dimFilm.film_id = mysqlFilm.filmId;
      dimFilm.title = mysqlFilm.title;
      dimFilm.rating = mysqlFilm.rating;
      dimFilm.length = mysqlFilm.length;
      dimFilm.release_year = mysqlFilm.releaseYear;
      dimFilm.last_update = mysqlFilm.lastUpdate;
      dimFilm.language = mysqlFilm.language.name;
      return dimFilm;
    });

    // 5. Execute SQLite inout
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      // step 1：clean dim_film original data
    //   const allExistingFilms = await transactionManager.find(SqliteDimFilm);
    //   await transactionManager.remove(allExistingFilms);
      await transactionManager.query(`DELETE FROM dim_film`);
      // step 2：insert dim_film data
      await transactionManager.save(sqliteDimFilms);
    });

    console.log(`dim_film input successful,  ${sqliteDimFilms.length} data input successfully`);

  } catch (error) {
    console.error("dim_film input fail", error);
  } finally {
    // release all connection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

// execute input task
fullLoadDimFilm();