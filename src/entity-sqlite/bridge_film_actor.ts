import { Entity, PrimaryColumn, Column, ForeignKey, JoinColumn } from 'typeorm';
import { DimFilm } from './dim_film';
import { DimActor } from './dim_actor';

export @Entity('bridge_film_actor') 
class BridgeFilmActor {

  @PrimaryColumn({ type: 'int' })
  @ForeignKey(() => DimFilm)
  @JoinColumn({ name: 'film_key' })
  film_key: number;

  @PrimaryColumn({ type: 'int' })
  @ForeignKey(() => DimActor)
  @JoinColumn({ name: 'actor_key' })
  actor_key: number; 
}