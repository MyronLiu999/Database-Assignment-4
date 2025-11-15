import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Actor } from "./Actor";
import { Film } from "./Film";

@Index("idx_fk_film_id", ["filmId"], {})
@Entity("film_actor", { schema: "sakila" })
export class FilmActor {
  @Column("smallint", { primary: true, name: "actor_id", unsigned: true })
  actorId: number;

  @Column("smallint", { primary: true, name: "film_id", unsigned: true })
  filmId: number;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @ManyToOne(() => Actor, (actor) => actor.filmActors, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "actor_id", referencedColumnName: "actorId" }])
  actor: Actor;

  @ManyToOne(() => Film, (film) => film.filmActors, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "film_id", referencedColumnName: "filmId" }])
  film: Film;
}
