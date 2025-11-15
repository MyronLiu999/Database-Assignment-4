#!/usr/bin/env ts-node
import { program } from 'commander';
import { initAnalyticsDB } from './sync/init';
import { fullLoadDimFilm } from './sync/full-load-dim-film';
import { fullLoadDimActor } from './sync/full-load-dim-actor';
import { fullLoadDimCategory } from './sync/full-load-dim-category';
import { fullLoadDimCustomer } from './sync/full-load-dim-customer';
import { fullLoadDimStore } from './sync/full-load-dim-store';
import { fullLoadBridgeFilmActor } from './sync/full-load-bridge-fim-actor';
import { fullLoadBridgeFilmCategory } from './sync/full-load-bridge-fim-category';
import { fullLoadFactRental } from './sync/full-load-fact-rental';
import { fullLoadFactPayment } from './sync/full-load-fact-payment';

import { incrementalLoadDimFilm } from './sync/incremental-load-dim-film';
import { incrementalLoadDimActor } from './sync/incremental-load-dim-actor';
import { incrementalLoadDimCategory } from './sync/incremental-load-dim-category';
import { incrementalLoadDimCustomer } from './sync/incremental-load-dim-customer';
import { incrementalLoadDimStore } from './sync/incremental-load-dim-store';
import { incrementalLoadBridgeFilmActor } from './sync/incremental-load-bridge-film-actor';
import { incrementalLoadBridgeFilmCategory } from './sync/incremental-load-bridge-film-category';
import { incrementalLoadFactRental } from './sync/incremental-load-fact-rental';
import { incrementalLoadFactPayment } from './sync/incremental-load-fact-payment';
import { validateDataConsistency } from './sync/validate';

import { AppDataSourceSQLite } from './data-source.sqlite';

// 1. init 
program
  .command('init')
  .description('init dim_date and sync_state')
  .action(async () => {
    await initAnalyticsDB();
  });


// 2. full-load 
program
  .command('full-load')
  .description('full load all form')
  .action(async () => {
    await fullLoadDimFilm();
    await fullLoadDimActor();
    await fullLoadDimCategory();
    await fullLoadDimCustomer();
    await fullLoadDimStore();
    await fullLoadBridgeFilmActor();
    await fullLoadBridgeFilmCategory();
    await fullLoadFactRental();
    await fullLoadFactPayment();
  });

// 3. incremental 
program
  .command('incremental')
  .description('incremental all table')
  .action(async () => {
    await incrementalLoadDimFilm();
    await incrementalLoadDimActor();
    await incrementalLoadDimCategory();
    await incrementalLoadDimCustomer();
    await incrementalLoadDimStore();
    await incrementalLoadBridgeFilmActor();
    await incrementalLoadBridgeFilmCategory();
    await incrementalLoadFactRental();
    await incrementalLoadFactPayment();
  });

// 4. validate 
program
  .command('validate')
  .description('validate data')
  .action(async () => {
    await validateDataConsistency();
  });


program.parse(process.argv);