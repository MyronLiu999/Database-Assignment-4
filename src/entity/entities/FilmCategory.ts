import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";
import { Category } from "./Category";
import { Film } from "./Film";

@Index("fk_film_category_category", ["categoryId"], {})
@Entity("film_category", { schema: "sakila" })
export class FilmCategory {
  @Column("smallint", { primary: true, name: "film_id", unsigned: true })
  filmId: number;

  @Column("tinyint", { primary: true, name: "category_id", unsigned: true })
  categoryId: number;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @ManyToOne(() => Category, (category) => category.filmCategories, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "category_id", referencedColumnName: "categoryId" }])
  category: Category;

  @ManyToOne(() => Film, (film) => film.filmCategories, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "film_id", referencedColumnName: "filmId" }])
  film: Film;
}
