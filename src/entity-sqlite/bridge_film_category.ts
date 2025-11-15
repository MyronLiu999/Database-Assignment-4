import { Entity, PrimaryColumn, Column, ForeignKey, JoinColumn } from 'typeorm';
import { DimFilm } from './dim_film';
import { DimCategory } from './dim_category';

export @Entity('bridge_film_category') 
class BridgeFilmCategory {

  @PrimaryColumn({ type: 'int' })
  @ForeignKey(() => DimFilm)
  @JoinColumn({ name: 'film_key' })
  film_key: number;

  @PrimaryColumn({ type: 'int' })
  @ForeignKey(() => DimCategory)
  @JoinColumn({ name: 'category_key' })
  category_key: number;
}