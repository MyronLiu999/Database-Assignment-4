import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Language } from "./Language";
import { FilmActor } from "./FilmActor";
import { FilmCategory } from "./FilmCategory";
import { Inventory } from "./Inventory";

@Index("idx_fk_language_id", ["languageId"], {})
@Index("idx_fk_original_language_id", ["originalLanguageId"], {})
@Index("idx_title", ["title"], {})
@Entity("film", { schema: "sakila" })
export class Film {
  @PrimaryGeneratedColumn({ type: "smallint", name: "film_id", unsigned: true })
  filmId: number;

  @Column("varchar", { name: "title", length: 128 })
  title: string;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("year", { name: "release_year", nullable: true })
  releaseYear: number | null;

  @Column("tinyint", { name: "language_id", unsigned: true })
  languageId: number;

  @Column("tinyint", {
    name: "original_language_id",
    nullable: true,
    unsigned: true,
  })
  originalLanguageId: number | null;

  @Column("tinyint", {
    name: "rental_duration",
    unsigned: true,
    default: () => "'3'",
  })
  rentalDuration: number;

  @Column("decimal", {
    name: "rental_rate",
    precision: 4,
    scale: 2,
    default: () => "'4.99'",
  })
  rentalRate: string;

  @Column("smallint", { name: "length", nullable: true, unsigned: true })
  length: number | null;

  @Column("decimal", {
    name: "replacement_cost",
    precision: 5,
    scale: 2,
    default: () => "'19.99'",
  })
  replacementCost: string;

  // @Column("enum", {
  //   name: "rating",
  //   nullable: true,
  //   enum: ["G", "PG", "PG-13", "R", "NC-17"],
  //   default: 'G',
  // })
  // rating: "G" | "PG" | "PG-13" | "R" | "NC-17" | null;

  @Column()
  rating: "G" | "PG" | "PG-13" | "R" | "NC-17" | null;

  @Column("set", {
    name: "special_features",
    nullable: true,
    enum: ["Trailers", "Commentaries", "Deleted Scenes", "Behind the Scenes"],
  })
  specialFeatures:
    | ("Trailers" | "Commentaries" | "Deleted Scenes" | "Behind the Scenes")[]
    | null;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @ManyToOne(() => Language, (language) => language.films, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "language_id", referencedColumnName: "languageId" }])
  language: Language;

  @ManyToOne(() => Language, (language) => language.films2, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([
    { name: "original_language_id", referencedColumnName: "languageId" },
  ])
  originalLanguage: Language;

  @OneToMany(() => FilmActor, (filmActor) => filmActor.film)
  filmActors: FilmActor[];

  @OneToMany(() => FilmCategory, (filmCategory) => filmCategory.film)
  filmCategories: FilmCategory[];

  @OneToMany(() => Inventory, (inventory) => inventory.film)
  inventories: Inventory[];
}
