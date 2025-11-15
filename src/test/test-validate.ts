import { execSync } from 'child_process';
import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Film } from '../entity/entities/Film';
import { DimFilm } from '../entity-sqlite/dim_film';

describe('Validate Command Test', () => {
  beforeAll(async () => {
    execSync('npm run init', { stdio: 'inherit' });
    execSync('npm run full-load', { stdio: 'inherit' });
  });

  afterAll(async () => {
    if (AppDataSourceMySQL.isInitialized) await AppDataSourceMySQL.destroy();
    if (AppDataSourceSQLite.isInitialized) await AppDataSourceSQLite.destroy();
  });

  it('should confirm data consistency between MySQL and SQLite', async () => {
    await AppDataSourceMySQL.initialize();
    await AppDataSourceSQLite.initialize();

    const mysqlFilmCount = await AppDataSourceMySQL.getRepository(Film).count();
    const sqliteDimFilmCount = await AppDataSourceSQLite.getRepository(DimFilm).count();

    expect(sqliteDimFilmCount).toBe(mysqlFilmCount);
  });
});
