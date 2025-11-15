
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { DimDate } from '../entity-sqlite/dim_date';
import { SyncState } from '../entity-sqlite/sync_state';

describe('Init Command Test', () => {

  it('should create database and tables successfully', async () => {

    execSync('npm run init', { stdio: 'inherit' });

    const dbPath = 'path/to/your/analytics.db'; 
    expect(existsSync(dbPath)).toBe(true);

    await AppDataSourceSQLite.initialize();

    // check dim_date
    const dimDateRepo = AppDataSourceSQLite.getRepository(DimDate);
    const dimDateTable = await dimDateRepo.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='dim_date'
    `);
    expect(dimDateTable.length).toBe(1);

    // check Sync
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);
    const syncStateTable = await syncStateRepo.query(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='sync_state'
    `);
    expect(syncStateTable.length).toBe(1);
  });
});

