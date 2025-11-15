import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Rental } from '../entity/entities/Rental';
import { Film } from '../entity/entities/Film';
import { Customer } from '../entity/entities/Customer';
import { Store } from '../entity/entities/Store';
import { FactRental } from '../entity-sqlite/fact_rental';
import { DimDate } from '../entity-sqlite/dim_date';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadFactRental() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlRentalRepo = AppDataSourceMySQL.getRepository(Rental);
    const mysqlFilmRepo = AppDataSourceMySQL.getRepository(Film);
    const mysqlCustomerRepo = AppDataSourceMySQL.getRepository(Customer);
    const mysqlStoreRepo = AppDataSourceMySQL.getRepository(Store);
    const sqliteFactRentalRepo = AppDataSourceSQLite.getRepository(FactRental);
    const sqliteDimDateRepo = AppDataSourceSQLite.getRepository(DimDate);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'rental' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newRentals = await mysqlRentalRepo.find({
      where: { 
        rentalDate: MoreThan(lastSyncTime) 
    }
    });
    // no update
    if (newRentals.length === 0) {
      return;
    }

    function calculateRentalDuration(rentalDate: Date, returnDate: Date | null): number {
        if (!returnDate) return 0;
        const diffTime = returnDate.getTime() - rentalDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }


    // final the latest rental_date
    const maxRentalDate = await mysqlRentalRepo.createQueryBuilder('rental')
      .select('MAX(rental.rentalDate)', 'maxDate')
      .where('rental.rentalDate > :lastSyncTime', { lastSyncTime })
      .getRawOne();

    const factRentals = [];
    for (const rental of newRentals) {
      const film = await mysqlFilmRepo.findOne({ where: { filmId: rental.inventory.film.filmId } });
      const customer = await mysqlCustomerRepo.findOne({ where: { customerId: rental.customerId } });
      const store = await mysqlStoreRepo.findOne({ where: { storeId: rental.inventory.storeId } });

      const rentalDateKey = parseInt(rental.rentalDate.toISOString().split('T')[0].replace(/-/g, ''));
      const rentalDateEntity = await sqliteDimDateRepo.findOne({ where: { date_key: rentalDateKey } });

      let returnDateKey: number | null = null;
      if (rental.returnDate) {
        returnDateKey = parseInt(rental.returnDate.toISOString().split('T')[0].replace(/-/g, ''));
      }

      const factRental = new FactRental();
      factRental.fact_rental_key = rental.rentalId * 1000 + 1;
      factRental.rental_id = rental.rentalId;
      factRental.date_key_ren = rentalDateEntity?.date_key || 0;
      factRental.date_key_retur = returnDateKey || null;
      factRental.film_key = film.filmId * 100 + 1 || 0;
      factRental.store_key = store.storeId * 100 + 5 || 0;
      factRental.customer_key = customer.customerId * 100 + 6 || 0;
      factRental.staff_id = rental.staffId;
      factRental.rental_duration_days = calculateRentalDuration(rental.rentalDate, rental.returnDate);

      if (rental.returnDate && rental.rentalDate) {
        const diffTime = Math.abs(rental.returnDate.getTime() - rental.rentalDate.getTime());
        factRental.rental_duration_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      factRentals.push(factRental);
    }

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(factRentals);
      await syncStateRepo.update(
        { table_name: 'rental' },
        { last_sync_time: maxRentalDate.maxDate || new Date() }
      );
    });

    console.log(`fact_rental ${factRentals.length} data input`);

  } catch (error) {
    console.error('fact_rental failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}