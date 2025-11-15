import 'reflect-metadata';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { DimDate } from '../entity-sqlite/dim_date';

async function generateAndImportDimDate() {
  try {
     
    if (!AppDataSourceSQLite.isInitialized) {
      await AppDataSourceSQLite.initialize();
      console.log("initialization successfully");
    }

    const startDate = new Date('2005-01-01');
    const endDate = new Date('2006-12-31');
    const calendarData: DimDate[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; 
      const day = currentDate.getDate();
      const dayOfWeek = currentDate.getDay(); 
      
      const quarter = Math.ceil(month / 3);
      const dateKey = parseInt(`${year}${month.toString().padStart(2, '0')}${day.toString().padStart(2, '0')}`); // YYYYMMDD格式
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0; 
      const dateStr = currentDate.toISOString().split('T')[0];

      const dimDate = new DimDate();
      dimDate.date_key = dateKey;
      dimDate.date = new Date(dateStr); 
      dimDate.year = year;
      dimDate.month = month;
      dimDate.day_of_month = day;
      dimDate.quarter = quarter;
      dimDate.day_of_week = dayOfWeek;
      dimDate.is_weekend = isWeekend;

      calendarData.push(dimDate);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    await AppDataSourceSQLite.manager.save(calendarData);
    console.log(`input successful ${calendarData.length} data input successfully`);

  } catch (err) {
    console.error("input fail", err);
  } finally {
    if (AppDataSourceSQLite.isInitialized) {
      await AppDataSourceSQLite.destroy();
    }
  }
}

// execute
generateAndImportDimDate();