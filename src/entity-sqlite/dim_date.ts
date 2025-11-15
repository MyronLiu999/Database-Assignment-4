import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('dim_date') 
class DimDate {

  @PrimaryColumn({ type: 'int' })
  date_key: number;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'int' })
  quarter: number;

  @Column({ type: 'int' })
  month: number;

  @Column({ type: 'int' })
  day_of_month: number;

  @Column({ type: 'int' })
  day_of_week: number;

  @Column({ type: 'int' })
  is_weekend: number;
}