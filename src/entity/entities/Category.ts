import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FilmCategory } from "./FilmCategory";

@Entity("category", { schema: "sakila" })
export class Category {
  @PrimaryGeneratedColumn({
    type: "tinyint",
    name: "category_id",
    unsigned: true,
  })
  categoryId: number;

  @Column("varchar", { name: "name", length: 25 })
  name: string;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => FilmCategory, (filmCategory) => filmCategory.category)
  filmCategories: FilmCategory[];
}
