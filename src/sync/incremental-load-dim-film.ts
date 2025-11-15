import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Film } from '../entity/entities/Film';
import { DimFilm } from '../entity-sqlite/dim_film';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadDimFilm() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlFilmRepo = AppDataSourceMySQL.getRepository(Film);
    const sqliteDimFilmRepo = AppDataSourceSQLite.getRepository(DimFilm);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({
      where: { table_name: 'film' }
    });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newFilms = await mysqlFilmRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newFilms.length === 0) {
      return;
    }
    
    const dimFilms = newFilms.map(film => {
      const dimFilm = new DimFilm();
      dimFilm.film_key = film.filmId * 100 + 1;
      dimFilm.film_id = film.filmId;
      dimFilm.title = film.title;
      dimFilm.rating = film.rating;
      dimFilm.length = film.length;
      dimFilm.release_year = film.releaseYear;
      dimFilm.language = film.language.name;
      dimFilm.last_update = film.lastUpdate;
      return dimFilm;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(dimFilms); 
      await syncStateRepo.update(  
        { table_name: 'film' },
        { last_sync_time: new Date() }
      );
    });

    console.log(`dim_film  ${dimFilms.length} data input`);

  } catch (error) {
    console.error('dim_film failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}