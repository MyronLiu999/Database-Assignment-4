import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { City } from "./City";

@Entity("country", { schema: "sakila" })
export class Country {
  @PrimaryGeneratedColumn({
    type: "smallint",
    name: "country_id",
    unsigned: true,
  })
  countryId: number;

  @Column("varchar", { name: "country", length: 50 })
  country: string;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => City, (city) => city.country)
  cities: City[];
}
