
import 'reflect-metadata';
// Import dual data sources
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
// Import entities for data initialization
import { DimDate } from '../entity-sqlite/dim_date';
import { SyncState } from '../entity-sqlite/sync_state';
// Import all SQLite entities (to verify table creation)
import { 
  DimFilm, DimActor, DimCategory, DimStore, DimCustomer,
  BridgeFilmActor, BridgeFilmCategory, FactRental, FactPayment
} from '../entity-sqlite';

/**
 * Initialize analytics database (create all tables + initialize base data)
 */
export async function initAnalyticsDB() {
  let isSuccess = false;
  try {
    console.log('Starting analytics DB initialization...');

    // Step 1: Initialize dual data sources (verify connections)
    console.log('1/5 Initializing MySQL + SQLite data sources...');
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log('Dual data sources initialized (MySQL and SQLite connections are valid)');


    // Step 2: Create all SQLite analytics tables
    console.log('2/5 Creating all SQLite analytics tables...');
    if (AppDataSourceSQLite.isInitialized) {
        await AppDataSourceSQLite.destroy();
    }

    await AppDataSourceSQLite.initialize();

    const sqliteTablesToCheck = [
      DimFilm, DimDate, DimActor, DimCategory, DimStore, DimCustomer,
      BridgeFilmActor, BridgeFilmCategory, FactRental, FactPayment, SyncState
    ];
    for (const entity of sqliteTablesToCheck) {
      const tableName = AppDataSourceSQLite.getMetadata(entity).tableName;
      const [result] = await AppDataSourceSQLite.query(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`
      );
      if (!result) throw new Error(`Table ${tableName} creation failed`);
    }
    console.log('All analytics tables created (dimensions, bridges, facts, sync state)');


    // Step 3: Initialize dim_date (date dimension data)
    console.log('3/5 Initializing date dimension table (dim_date)...');
    await generateFullDimDate();
    console.log('dim_date initialized successfully (2000-2030 all dates)');


    // Step 4: Initialize sync_state (sync status table)
    console.log('4/5 Initializing sync state table (sync_state)...');
    await initFullSyncState();
    console.log('sync_state initialized successfully (covers all source tables)');


    // Step 5: Verify initialization result
    console.log('5/5 Verifying initialization result...');
    const dimDateCount = await AppDataSourceSQLite.getRepository(DimDate).count();
    if (dimDateCount < 10000) throw new Error(`dim_date data abnormal (only ${dimDateCount} records)`);
    const syncStateCount = await AppDataSourceSQLite.getRepository(SyncState).count();
    if (syncStateCount !== 10) throw new Error(`sync_state data abnormal (only ${syncStateCount} records)`);

    isSuccess = true;
    console.log('\nAnalytics DB initialization completed! Run full-load to sync data.');

  } catch (error) {
    console.error(`\n Initialization failed: ${(error as Error).message}`, error);
    throw error;

  } finally {
    console.log('\n🔌 Releasing data source connections...');
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
    if (isSuccess) {
      console.log(' Connections released, initialization process ended');
    }
  }
}

/**
 * Generate full date data from 2000 to 2030
 */
async function generateFullDimDate() {
  const dimDateRepo = AppDataSourceSQLite.getRepository(DimDate);
  await dimDateRepo.query('DELETE FROM dim_date');

  const startDate = new Date('2000-01-01');
  const endDate = new Date('2030-12-31');
  const dateList: DimDate[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const dayOfWeek = currentDate.getDay();
    const quarter = Math.ceil(month / 3);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
    const dateKey = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`);
    const dateStr = currentDate.toISOString().split('T')[0];

    const dimDate = new DimDate();
    dimDate.date_key = dateKey;
    dimDate.date = new Date(dateStr);
    dimDate.year = year;
    dimDate.month = month;
    dimDate.day_of_month = day;
    dimDate.quarter = quarter;
    dimDate.day_of_week = dayOfWeek;
    dimDate.is_weekend = isWeekend;

    dateList.push(dimDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  await dimDateRepo.save(dateList);
}

/**
 * Initialize sync states for all source tables
 */
async function initFullSyncState() {
  const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);
  await syncStateRepo.query('DELETE FROM sync_state');

  const tablesToSync = [
    { table_name: 'film' },
    { table_name: 'actor' },
    { table_name: 'category' },
    { table_name: 'language' },
    { table_name: 'store' },
    { table_name: 'customer' },
    { table_name: 'rental' },
    { table_name: 'payment' },
    { table_name: 'film_actor' },
    { table_name: 'film_category' }
  ];

  const syncStateList = tablesToSync.map(table => ({
    ...table,
    last_sync_time: new Date(0)
  }));

  await syncStateRepo.save(syncStateList);
}

if (require.main === module) {
  initAnalyticsDB();
}