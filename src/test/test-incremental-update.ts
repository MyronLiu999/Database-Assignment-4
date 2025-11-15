import { execSync } from 'child_process';
import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Film } from '../entity/entities/Film';
import { DimFilm } from '../entity-sqlite/dim_film';

describe('Incremental Command (Updates) Test', () => {
  beforeAll(async () => {
    execSync('npm run init', { stdio: 'inherit' });
    execSync('npm run full-load', { stdio: 'inherit' });
  });

  afterAll(async () => {
    if (AppDataSourceMySQL.isInitialized) await AppDataSourceMySQL.destroy();
    if (AppDataSourceSQLite.isInitialized) await AppDataSourceSQLite.destroy();
  });

  it('should update existing rows when source data changes', async () => {
    // update one record
    await AppDataSourceMySQL.initialize();
    const mysqlFilmRepo = AppDataSourceMySQL.getRepository(Film);
    const existingFilm = await mysqlFilmRepo.findOne({ 
      where: { title: 'Academy Dinosaur' } // replace a movie in Sakila
    });
    if (!existingFilm) throw new Error('No existing film found for update test');

    existingFilm.title = 'Updated Academy Dinosaur';
    await mysqlFilmRepo.save(existingFilm);

    // Incremental
    execSync('npm run incremental', { stdio: 'inherit' });

    // check records
    await AppDataSourceSQLite.initialize();
    const sqliteDimFilmRepo = AppDataSourceSQLite.getRepository(DimFilm);
    const updatedFilm = await sqliteDimFilmRepo.findOne({ 
      where: { film_id: existingFilm.filmId } 
    });

    expect(updatedFilm).toBeDefined();
    expect(updatedFilm?.title).toBe('Updated Academy Dinosaur');
  });
});
