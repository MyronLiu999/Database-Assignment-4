import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Customer } from "./Customer";
import { Rental } from "./Rental";
import { Staff } from "./Staff";

@Index("fk_payment_rental", ["rentalId"], {})
@Index("idx_fk_customer_id", ["customerId"], {})
@Index("idx_fk_staff_id", ["staffId"], {})
@Entity("payment", { schema: "sakila" })
export class Payment {
  @PrimaryGeneratedColumn({
    type: "smallint",
    name: "payment_id",
    unsigned: true,
  })
  paymentId: number;

  @Column("smallint", { name: "customer_id", unsigned: true })
  customerId: number;

  @Column("tinyint", { name: "staff_id", unsigned: true })
  staffId: number;

  @Column("int", { name: "rental_id", nullable: true })
  rentalId: number | null;

  @Column("decimal", { name: "amount", precision: 5, scale: 2 })
  amount: number;

  @Column("datetime", { name: "payment_date" })
  paymentDate: Date;

  @Column("timestamp", {
    name: "last_update",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  lastUpdate: Date | null;

  @ManyToOne(() => Customer, (customer) => customer.payments, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "customer_id", referencedColumnName: "customerId" }])
  customer: Customer;

  @ManyToOne(() => Rental, (rental) => rental.payments, {
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "rental_id", referencedColumnName: "rentalId" }])
  rental: Rental;

  @ManyToOne(() => Staff, (staff) => staff.payments, {
    onDelete: "RESTRICT",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "staff_id", referencedColumnName: "staffId" }])
  staff: Staff;
}
