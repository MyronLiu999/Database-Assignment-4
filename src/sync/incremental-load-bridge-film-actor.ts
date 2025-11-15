import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { FilmActor } from '../entity/entities/FilmActor';
import { BridgeFilmActor } from '../entity-sqlite/bridge_film_actor';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadBridgeFilmActor() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlFilmActorRepo = AppDataSourceMySQL.getRepository(FilmActor);
    const sqliteBridgeFilmActorRepo = AppDataSourceSQLite.getRepository(BridgeFilmActor);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'film_actor' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newFilmActors = await mysqlFilmActorRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newFilmActors.length === 0) {
      return;
    }

    const bridgeFilmActors = newFilmActors.map(filmActor => {
      const bridge = new BridgeFilmActor();
      bridge.film_key = filmActor.filmId * 100 + 1;
      bridge.actor_key = filmActor.actorId * 100 + 2;
      return bridge;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(bridgeFilmActors);
      await syncStateRepo.update({ table_name: 'film_actor' }, { last_sync_time: new Date() });
    });

    console.log(`bridge_film_actor ${bridgeFilmActors.length} data input`);

  } catch (error) {
    console.error('bridge_film_actor failed', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}