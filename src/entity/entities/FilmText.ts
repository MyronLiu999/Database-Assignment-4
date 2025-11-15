import { Column, Entity, Index } from "typeorm";

@Index("idx_title_description", ["title", "description"], { fulltext: true })
@Entity("film_text", { schema: "sakila" })
export class FilmText {
  @Column("smallint", { primary: true, name: "film_id", unsigned: true })
  filmId: number;

  @Column("varchar", { name: "title", length: 255 })
  title: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;
}
