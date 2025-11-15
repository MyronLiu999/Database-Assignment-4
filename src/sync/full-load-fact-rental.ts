import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Rental as MySqlRental } from '../entity/entities/Rental';
import { Inventory as MySqlInventory } from '../entity/entities/Inventory';
import { Film as MySqlFilm } from '../entity/entities/Film';
import { Store as MySqlStore } from '../entity/entities/Store';
import { Customer as MySqlCustomer } from '../entity/entities/Customer';
import { Staff as MySqlStaff } from '../entity/entities/Staff';
import { FactRental as SqliteFactRental } from '../entity-sqlite/fact_rental';

// date_key transfer（YYYYMMDD）
function dateToDateKey(date: Date): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`);
}

// compute（returnDate - rentalDate）
function calculateRentalDuration(rentalDate: Date, returnDate: Date | null): number {
  if (!returnDate) return 0;
  const diffTime = returnDate.getTime() - rentalDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function fullLoadFactRental() {
  try {
    // 1. initialization
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("fact_rental 初始化连接成功");

    // 2. get repo
    const mysqlRentalRepo = AppDataSourceMySQL.getRepository(MySqlRental);
    const sqliteFactRentalRepo = AppDataSourceSQLite.getRepository(SqliteFactRental);

    // 3. get data
    const allMySqlRentals = await mysqlRentalRepo
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.inventory', 'inventory')
      .leftJoinAndSelect('inventory.film', 'film')
      .leftJoinAndSelect('inventory.store', 'store')
      .leftJoinAndSelect('rental.customer', 'customer')
      .leftJoinAndSelect('rental.staff', 'staff')
      .getMany();

    // 4. data transfer
    const sqliteFactRentals = allMySqlRentals.map(mysqlRental => {
      const factRental = new SqliteFactRental();
      factRental.fact_rental_key = mysqlRental.rentalId * 100 + 1;
      factRental.rental_id = mysqlRental.rentalId;
      factRental.date_key_ren = dateToDateKey(mysqlRental.rentalDate);
      factRental.date_key_retur = mysqlRental.returnDate ? dateToDateKey(mysqlRental.returnDate) : null;
      factRental.film_key = mysqlRental.inventory.film.filmId * 100 + 1;
      factRental.store_key = mysqlRental.inventory.store.storeId * 100 + 1;
      factRental.customer_key = mysqlRental.customer.customerId * 100 + 1;
      factRental.staff_id = mysqlRental.staff.staffId;
      factRental.rental_duration_days = calculateRentalDuration(mysqlRental.rentalDate, mysqlRental.returnDate);
      return factRental;
    });

    // 5. clean old data
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM fact_rental`);
      await transactionManager.save(sqliteFactRentals);
    });

    console.log(`fact_rental ${sqliteFactRentals.length} data input`);

  } catch (error) {
    console.error("fact_rental failed", error);
  } finally {
    // de connection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadFactRental();