import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Payment } from '../entity/entities/Payment';
import { Rental } from '../entity/entities/Rental';
import { FactPayment } from '../entity-sqlite/fact_payment';
import { FactRental } from '../entity-sqlite/fact_rental';
import { DimDate } from '../entity-sqlite/dim_date';
import { format, subDays } from 'date-fns';
import { Between } from 'typeorm';

export async function validateDataConsistency() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const endDate = new Date();
    const startDate = subDays(endDate, 30); // 30 days
    const startDateKey = parseInt(format(startDate, 'yyyyMMdd'));
    const endDateKey = parseInt(format(endDate, 'yyyyMMdd'));

    // ========== Payment ==========
    const mysqlPaymentRepo = AppDataSourceMySQL.getRepository(Payment);
    const sqliteFactPaymentRepo = AppDataSourceSQLite.getRepository(FactPayment);

    // MySQL
    const mysqlPaymentCount = await mysqlPaymentRepo.count({
      where: { paymentDate: Between(startDate, endDate) }
    });
    const mysqlPaymentTotal = await mysqlPaymentRepo.createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.payment_date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .getRawOne();

    // SQLite
    const sqlitePaymentCount = await sqliteFactPaymentRepo.createQueryBuilder('fact_payment')
    .innerJoin(DimDate, 'date', 'fact_payment.payment_date_key = date.date_key')
    .where('date.date_key BETWEEN :start AND :end', { start: startDateKey, end: endDateKey })
    .getCount(); 

    const sqlitePaymentTotal = await sqliteFactPaymentRepo.createQueryBuilder('fact_payment')
    .innerJoin(DimDate, 'date', 'fact_payment.payment_date_key = date.date_key')
    .select('SUM(fact_payment.amount)', 'total')
    .where('date.date_key BETWEEN :start AND :end', { start: startDateKey, end: endDateKey })
    .getRawOne();

    console.log('\n=== Payment record(latest 30 days) ===');
    console.log(`MySQL: ${mysqlPaymentCount}, total: ${mysqlPaymentTotal.total || 0}`);
    console.log(`SQLite: ${sqlitePaymentCount}, total: ${sqlitePaymentTotal.total || 0}`);
    console.log(`results: ${mysqlPaymentCount === sqlitePaymentCount && (mysqlPaymentTotal.total || 0) === (sqlitePaymentTotal.total || 0) ? '一致' : '不一致'}`);


    // ========== Rental ==========
    const mysqlRentalRepo = AppDataSourceMySQL.getRepository(Rental);
    const sqliteFactRentalRepo = AppDataSourceSQLite.getRepository(FactRental);

    // MySQL
    const mysqlRentalCount = await mysqlRentalRepo.count({
      where: { rentalDate: Between(startDate, endDate) }
    });

    // SQLite
    const sqliteRentalCount = await sqliteFactRentalRepo.createQueryBuilder('fact_rental')
    .innerJoin(DimDate, 'date', 'fact_rental.rental_date_key = date.date_key')
    .where('date.date_key BETWEEN :start AND :end', { 
        start: startDateKey, 
        end: endDateKey 
    })
    .getCount();

    console.log('\n=== Rental Validation(30 days) ===');
    console.log(`MySQL: ${mysqlRentalCount}`);
    console.log(`SQLite: ${sqliteRentalCount}`);
    console.log(`Result: ${mysqlRentalCount === sqliteRentalCount ? 'correct' : 'incorrect'}`);


  } catch (error) {
    console.error('Validation failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}