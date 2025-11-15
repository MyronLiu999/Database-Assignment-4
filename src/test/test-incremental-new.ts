import { execSync } from 'child_process';
import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Film } from '../entity/entities/Film';
import { DimFilm } from '../entity-sqlite/dim_film';

describe('Incremental Command (New Data) Test', () => {
  beforeAll(async () => {
    execSync('npm run init', { stdio: 'inherit' });
    execSync('npm run full-load', { stdio: 'inherit' });
  });

  afterAll(async () => {
    if (AppDataSourceMySQL.isInitialized) await AppDataSourceMySQL.destroy();
    if (AppDataSourceSQLite.isInitialized) await AppDataSourceSQLite.destroy();
  });

  it('should sync new records from Sakila to SQLite', async () => {
    // inser data
    await AppDataSourceMySQL.initialize();
    const mysqlFilmRepo = AppDataSourceMySQL.getRepository(Film);
    const newFilm = new Film();
    newFilm.title = 'Test New Film';
    newFilm.rating = 'G';
    newFilm.length = 120;
    newFilm.releaseYear = 2025;
    await mysqlFilmRepo.save(newFilm);

    // Incremental
    execSync('npm run incremental', { stdio: 'inherit' });

    // check the records
    await AppDataSourceSQLite.initialize();
    const sqliteDimFilmRepo = AppDataSourceSQLite.getRepository(DimFilm);
    const syncedFilm = await sqliteDimFilmRepo.findOne({ 
      where: { title: 'Test New Film' } 
    });

    expect(syncedFilm).toBeDefined();
    expect(syncedFilm?.title).toBe('Test New Film');
  });
});
