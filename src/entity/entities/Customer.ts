import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Address } from "./Address";
import { Store } from "./Store";
import { Payment } from "./Payment";
import { Rental } from "./Rental";

@Index("idx_fk_address_id", ["addressId"], {})
@Index("idx_fk_store_id", ["storeId"], {})
@Index("idx_last_name", ["lastName"], {})
@Entity("customer", { schema: "sakila" })
export class Customer {
  @PrimaryGeneratedColumn({
    type: "smallint",
    name: "customer_id",
    unsigned: true,
  })
  customerId: number;

  @Column("tinyint", { name: "store_id", unsigned: true })
  storeId: number;

  @Column("varchar", { name: "first_name", length: 45 })
  firstName: string;

  @Column("varchar", { name: "last_name", length: 45 })
  lastName: string;

  @Column("varchar", { name: "email", nullable: true, length: 50 })
  email: string | null;

  @Column("smallint", { name: "address_id", unsigned: true })
  addressId: number;

  @Column("tinyint", { name: "active", width: 1, default: () => "'1'" })
  active: boolean;

  @Column("datetime", { name: "create_date" })
  createDate: Date;

  @Column("timestamp", {
    name: "last_update",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date | null;

  @ManyToOne(() => Address, (address) => address.customers, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "address_id", referencedColumnName: "addressId" }])
  address: Address;

  @ManyToOne(() => Store, (store) => store.customers, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "store_id", referencedColumnName: "storeId" }])
  store: Store;

  @OneToMany(() => Payment, (payment) => payment.customer)
  payments: Payment[];

  @OneToMany(() => Rental, (rental) => rental.customer)
  rentals: Rental[];
}
