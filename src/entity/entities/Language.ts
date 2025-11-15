import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Film } from "./Film";

@Entity("language", { schema: "sakila" })
export class Language {
  @PrimaryGeneratedColumn({
    type: "tinyint",
    name: "language_id",
    unsigned: true,
  })
  languageId: number;

  @Column("char", { name: "name", length: 20 })
  name: string;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => Film, (film) => film.language)
  films: Film[];

  @OneToMany(() => Film, (film) => film.originalLanguage)
  films2: Film[];
}
