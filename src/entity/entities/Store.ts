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
import { Customer } from "./Customer";
import { Inventory } from "./Inventory";
import { Staff } from "./Staff";
import { Address } from "./Address";

@Index("idx_fk_address_id", ["addressId"], {})
@Index("idx_unique_manager", ["managerStaffId"], { unique: true })
@Entity("store", { schema: "sakila" })
export class Store {
  @PrimaryGeneratedColumn({ type: "tinyint", name: "store_id", unsigned: true })
  storeId: number;

  @Column("tinyint", { name: "manager_staff_id", unique: true, unsigned: true })
  managerStaffId: number;

  @Column("smallint", { name: "address_id", unsigned: true })
  addressId: number;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => Customer, (customer) => customer.store)
  customers: Customer[];

  @OneToMany(() => Inventory, (inventory) => inventory.store)
  inventories: Inventory[];

  @OneToMany(() => Staff, (staff) => staff.store_2)
  staff: Staff[];

  @ManyToOne(() => Address, (address) => address.stores, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "address_id", referencedColumnName: "addressId" }])
  address: Address;

  @OneToOne(() => Staff, (staff) => staff.store, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "manager_staff_id", referencedColumnName: "staffId" }])
  managerStaff: Staff;
}
