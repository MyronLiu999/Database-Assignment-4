import { Entity, PrimaryColumn, Column, ForeignKey, JoinColumn } from 'typeorm';
import { DimDate } from './dim_date';
import { DimFilm } from './dim_film';
import { DimStore } from './dim_store';
import { DimCustomer } from './dim_customer';

export @Entity('fact_rental') 
class FactRental {

  @PrimaryColumn({ type: 'int' })
  fact_rental_key: number;

  @Column({ type: 'int', unique: true })
  rental_id: number; 

  @Column({ type: 'int' })
  @ForeignKey(() => DimDate)
  @JoinColumn({ name: 'date_key_ren' })
  date_key_ren: number;

  @Column({ type: 'int', nullable: true })
  @ForeignKey(() => DimDate)
  @JoinColumn({ name: 'date_key_return' })
  date_key_retur: number;

  @Column({ type: 'int' })
  @ForeignKey(() => DimFilm)
  @JoinColumn({ name: 'film_key' })
  film_key: number; 

  @Column({ type: 'int' })
  @ForeignKey(() => DimStore)
  @JoinColumn({ name: 'store_key' })
  store_key: number;

  @Column({ type: 'int' })
  @ForeignKey(() => DimCustomer)
  @JoinColumn({ name: 'customer_key' })
  customer_key: number;

  @Column({ type: 'int' })
  staff_id: number;

  @Column({ type: 'int' })
  rental_duration_days: number;
}