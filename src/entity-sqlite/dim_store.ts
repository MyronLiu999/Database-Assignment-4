import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('dim_store') 
class DimStore {

  @PrimaryColumn({ type: 'int' })
  store_key: number;

  @Column({ type: 'int', unique: true })
  store_id: number;

  @Column({ type: 'varchar', length: 50 })
  city: string;

  @Column({ type: 'varchar', length: 50 })
  country: string;

  @Column({ type: 'datetime' })
  last_update: Date;
}