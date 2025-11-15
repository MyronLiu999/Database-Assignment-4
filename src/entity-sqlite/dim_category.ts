import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('dim_category') 
class DimCategory {

  @PrimaryColumn({ type: 'int' })
  category_key: number;

  @Column({ type: 'int', unique: true })
  category_id: number;

  @Column({ type: 'varchar', length: 25 })
  name: string;

  @Column({ type: 'datetime' })
  last_update: Date;
}