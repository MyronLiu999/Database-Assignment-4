import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Actor as MySqlActor } from '../entity/entities/Actor';
import { DimActor as SqliteDimActor } from '../entity-sqlite/dim_actor';

export async function fullLoadDimActor() {
  try {
    // 1. initialize
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("dim_actor connected");

    // 2. get repo
    const mysqlActorRepo = AppDataSourceMySQL.getRepository(MySqlActor);
    const sqliteDimActorRepo = AppDataSourceSQLite.getRepository(SqliteDimActor);

    // 3. get data
    const allMySqlActors = await mysqlActorRepo.find();

    // 4. data transfer
    const sqliteDimActors = allMySqlActors.map(mysqlActor => {
      const dimActor = new SqliteDimActor();
      dimActor.actor_key = mysqlActor.actorId * 100 + 1;
      dimActor.actor_id = mysqlActor.actorId;
      dimActor.first_name = mysqlActor.firstName;
      dimActor.last_name = mysqlActor.lastName;
      dimActor.last_update = mysqlActor.lastUpdate;
      return dimActor;
    });

    // 5. clean old data
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM dim_actor`);
      await transactionManager.save(sqliteDimActors);
    });

    console.log(`dim_actor uploaded successfully ${sqliteDimActors.length} data input`);

  } catch (error) {
    console.error("failed", error);
  } finally {
    // deconnected
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadDimActor();