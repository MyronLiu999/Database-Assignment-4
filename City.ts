import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Country } from "./Country";
import { Address } from "./Address";

@Entity()
export class City {
  @PrimaryGeneratedColumn()
  cityId: number;

  @Column()
  city: string;

  @Column()
  countryId: number;

  @Column()
  lastUpdate: Date;

  // 多对一：城市 → 国家
  @ManyToOne(() => Country, (country) => country.cities)
  country: Country;

  // 一对多：城市 → 地址
  @OneToMany(() => Address, (address) => address.city)
  addresses: Address[];
}