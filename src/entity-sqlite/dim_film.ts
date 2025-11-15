// src/entity-sqlite/dim_film.ts
import { Entity, PrimaryColumn, Column } from 'typeorm';

export @Entity('dim_film') 
class DimFilm {

  @PrimaryColumn({ type: 'int' })
  film_key: number; 

  @Column({ type: 'int', unique: true })
  film_id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string; 

  @Column({ type: 'varchar', length: 10 })
  rating: string;

  @Column({ type: 'int' })
  length: number;

  @Column({ type: 'varchar', length: 50 })
  language: string; 

  @Column({ type: 'int' })
  release_year: number;

  @Column({ type: 'datetime' })
  last_update: Date;
}