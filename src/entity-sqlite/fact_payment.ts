import { Entity, PrimaryColumn, Column, ForeignKey, JoinColumn } from 'typeorm';
import { DimDate } from './dim_date';
import { DimStore } from './dim_store';
import { DimCustomer } from './dim_customer';

@Entity('fact_payment') 
export class FactPayment {

  @PrimaryColumn({ type: 'int' })
  fact_payment_key: number;

  @Column({ type: 'int', unique: true })
  payment_id: number;

  @Column({ type: 'int' })
  @ForeignKey(() => DimDate)
  @JoinColumn({ name: 'date_key_paid' })
  date_key_paid: number;

  @Column({ type: 'int' })
  @ForeignKey(() => DimCustomer)
  @JoinColumn({ name: 'customer_key' })
  customer_key: number;

  @Column({ type: 'int' })
  @ForeignKey(() => DimStore)
  @JoinColumn({ name: 'store_key' })
  store_key: number;

  @Column({ type: 'int' })
  staff_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  amount: number;
}