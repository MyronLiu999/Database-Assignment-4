// src/entity-sqlite/sync_state.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('sync_state')
class SyncState {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  table_name: string; // table name（like 'dim_film'、'fact_rental'）

  @Column({ type: 'datetime' })
  last_sync_time: Date; // the last sync time
}