import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('dim_actor') 
class DimActor {

  @PrimaryColumn({ type: 'int' })
  actor_key: number;

  @Column({ type: 'int', unique: true })
  actor_id: number;

  @Column({ type: 'varchar', length: 45 })
  first_name: string;

  @Column({ type: 'varchar', length: 45 })
  last_name: string;

  @Column({ type: 'datetime' })
  last_update: Date;
}