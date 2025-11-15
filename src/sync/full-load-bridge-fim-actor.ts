import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { FilmActor as MySqlFilmActor } from '../entity/entities/FilmActor';
import { Film as MySqlFilm } from '../entity/entities/Film';
import { Actor as MySqlActor } from '../entity/entities/Actor';
import { BridgeFilmActor as SqliteBridgeFilmActor } from '../entity-sqlite/bridge_film_actor';

export async function fullLoadBridgeFilmActor() {
  try {
    // 1. initialization
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));
    console.log("bridge_film_actor successfully");

    // 2. get repo
    const mysqlFilmActorRepo = AppDataSourceMySQL.getRepository(MySqlFilmActor);
    const sqliteBridgeFilmActorRepo = AppDataSourceSQLite.getRepository(SqliteBridgeFilmActor);

    // 3. get data
    const allMySqlFilmActors = await mysqlFilmActorRepo
      .createQueryBuilder('film_actor')
      .leftJoinAndSelect('film_actor.film', 'film')
      .leftJoinAndSelect('film_actor.actor', 'actor')
      .getMany();

    // 4. data transfer
    const sqliteBridgeFilmActors = allMySqlFilmActors.map(mysqlFilmActor => {
      const bridge = new SqliteBridgeFilmActor();
      bridge.film_key = mysqlFilmActor.film.filmId * 100 + 1;
      bridge.actor_key = mysqlFilmActor.actor.actorId * 100 + 1;
      return bridge;
    });

    // 5. clean old data
    await AppDataSourceSQLite.manager.transaction(async (transactionManager) => {
      await transactionManager.query(`DELETE FROM bridge_film_actor`);
      await transactionManager.save(sqliteBridgeFilmActors);
    });

    console.log(`bridge_film_actor upload successfully ${sqliteBridgeFilmActors.length} data input`);

  } catch (error) {
    console.error("failed", error);
  } finally {
    // deconnection
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}

fullLoadBridgeFilmActor();