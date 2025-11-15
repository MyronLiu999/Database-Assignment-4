import { DataSource } from 'typeorm';
import { DimFilm } from './entity-sqlite/dim_film';
import { DimDate } from './entity-sqlite/dim_date';
import { DimActor } from './entity-sqlite/dim_actor';
import { DimCategory } from './entity-sqlite/dim_category';
import { DimStore } from './entity-sqlite/dim_store';
import { DimCustomer } from './entity-sqlite/dim_customer';
import { BridgeFilmActor } from './entity-sqlite/bridge_film_actor';
import { BridgeFilmCategory } from './entity-sqlite/bridge_film_category';
import { FactRental } from './entity-sqlite/fact_rental';
import { FactPayment } from './entity-sqlite/fact_payment';
import { SyncState } from './entity-sqlite/sync_state';

export const AppDataSourceSQLite = new DataSource({
  type: 'sqlite',
  database: 'analytics.db', // SQLite 
  entities: [
    DimFilm,
    DimDate,
    DimActor,
    DimCategory,
    DimStore,
    DimCustomer,
    BridgeFilmActor,
    BridgeFilmCategory,
    FactRental,
    FactPayment,
    SyncState
  ],
  synchronize: false, // first run it is true, for further runs it should turned to false
  logging: false,
});