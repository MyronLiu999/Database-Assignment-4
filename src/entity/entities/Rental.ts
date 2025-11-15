import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Payment } from "./Payment";
import { Customer } from "./Customer";
import { Inventory } from "./Inventory";
import { Staff } from "./Staff";

@Index("idx_fk_customer_id", ["customerId"], {})
@Index("idx_fk_inventory_id", ["inventoryId"], {})
@Index("idx_fk_staff_id", ["staffId"], {})
@Index("rental_date", ["rentalDate", "inventoryId", "customerId"], {
  unique: true,
})
@Entity("rental", { schema: "sakila" })
export class Rental {
  @PrimaryGeneratedColumn({ type: "int", name: "rental_id" })
  rentalId: number;

  @Column("datetime", { name: "rental_date" })
  rentalDate: Date;

  @Column("mediumint", { name: "inventory_id", unsigned: true })
  inventoryId: number;

  @Column("smallint", { name: "customer_id", unsigned: true })
  customerId: number;

  @Column("datetime", { name: "return_date", nullable: true })
  returnDate: Date | null;

  @Column("tinyint", { name: "staff_id", unsigned: true })
  staffId: number;

  @Column("timestamp", {
    name: "last_update",
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date;

  @OneToMany(() => Payment, (payment) => payment.rental)
  payments: Payment[];

  @ManyToOne(() => Customer, (customer) => customer.rentals, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "customer_id", referencedColumnName: "customerId" }])
  customer: Customer;

  @ManyToOne(() => Inventory, (inventory) => inventory.rentals, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "inventory_id", referencedColumnName: "inventoryId" }])
  inventory: Inventory;

  @ManyToOne(() => Staff, (staff) => staff.rentals, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "staff_id", referencedColumnName: "staffId" }])
  staff: Staff;
}
