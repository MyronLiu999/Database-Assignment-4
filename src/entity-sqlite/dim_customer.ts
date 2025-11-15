import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm';
// import { Address } from "../entity/entities/Address";

export @Entity('dim_customer') 
class DimCustomer {

  @PrimaryColumn({ type: 'int' })
  customer_key: number;

  @Column({ type: 'int', unique: true })
  customer_id: number;

  @Column({ type: 'varchar', length: 45 })
  first_name: string;

  @Column({ type: 'varchar', length: 45 })
  last_name: string;

  @Column({ type: 'int' })
  active: number;

  @Column({ type: 'varchar', length: 45 })
  city: string;

  @Column({ type: 'varchar', length: 45 })
  country: string;

  @Column({ type: 'datetime' })
  last_update: Date;
}