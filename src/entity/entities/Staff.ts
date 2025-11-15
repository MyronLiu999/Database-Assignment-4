import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Payment } from "./Payment";
import { Rental } from "./Rental";
import { Address } from "./Address";
import { Store } from "./Store";

@Index("idx_fk_address_id", ["addressId"], {})
@Index("idx_fk_store_id", ["storeId"], {})
@Entity("staff", { schema: "sakila" })
export class Staff {
  @PrimaryGeneratedColumn({ type: "tinyint", name: "staff_id", unsigned: true })
  staffId: number;

  @Column("varchar", { name: "first_name", length: 45 })
  firstName: string;

  @Column("varchar", { name: "last_name", length: 45 })
  lastName: string;

  @Column("smallint", { name: "address_id", unsigned: true })
  addressId: number;

  @Column("blob", { name: "picture", nullable: true })
  picture: Buffer | null;

  @Column("varchar", { name: "email", nullable: true, length: 50 })
  email: string | null;

  @Column("tinyint", { name: "store_id", unsigned: true })
  storeId: number;

  @Column("tinyint", { name: "active", width: 1, default: () => "'1'" })
  active: boolean;

  @Column("varchar", { name: "username", length: 16 })
  username: string;

  @Column("varchar", { name: "password", nullable: true, length: 40 })
  password: string | null;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => Payment, (payment) => payment.staff)
  payments: Payment[];

  @OneToMany(() => Rental, (rental) => rental.staff)
  rentals: Rental[];

  @ManyToOne(() => Address, (address) => address.staff, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "address_id", referencedColumnName: "addressId" }])
  address: Address;

  @ManyToOne(() => Store, (store) => store.staff, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "store_id", referencedColumnName: "storeId" }])
  store_2: Store;

  @OneToOne(() => Store, (store) => store.managerStaff)
  store: Store;
}
