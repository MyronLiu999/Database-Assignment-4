import 'reflect-metadata';
import { AppDataSourceMySQL } from '../data-source.mysql';
import { AppDataSourceSQLite } from '../data-source.sqlite';
import { Actor } from '../entity/entities/Actor';
import { DimActor } from '../entity-sqlite/dim_actor';
import { SyncState } from '../entity-sqlite/sync_state';
import { MoreThan } from 'typeorm';

export async function incrementalLoadDimActor() {
  try {
    await Promise.all([
      !AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.initialize(),
      !AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.initialize()
    ].filter(Boolean));

    const mysqlActorRepo = AppDataSourceMySQL.getRepository(Actor);
    const sqliteDimActorRepo = AppDataSourceSQLite.getRepository(DimActor);
    const syncStateRepo = AppDataSourceSQLite.getRepository(SyncState);

    const syncState = await syncStateRepo.findOne({ where: { table_name: 'actor' } });
    const lastSyncTime = syncState?.last_sync_time || new Date(0);

    const newActors = await mysqlActorRepo.find({
      where: { lastUpdate: MoreThan(lastSyncTime) }
    });

    if (newActors.length === 0) {
      return;
    }

    const dimActors = newActors.map(actor => {
      const dimActor = new DimActor();
      dimActor.actor_key = actor.actorId * 100 + 2;
      dimActor.actor_id = actor.actorId;
      dimActor.first_name = actor.firstName;
      dimActor.last_name = actor.lastName;
      dimActor.last_update = actor.lastUpdate;
      return dimActor;
    });

    await AppDataSourceSQLite.manager.transaction(async manager => {
      await manager.save(dimActors);
      await syncStateRepo.update({ table_name: 'actor' }, { last_sync_time: new Date() });
    });

    console.log(`dim_actor ${dimActors.length} data input`);

  } catch (error) {
    console.error('dim_actor', error);
  } finally {
    await Promise.all([
      AppDataSourceMySQL.isInitialized && AppDataSourceMySQL.destroy(),
      AppDataSourceSQLite.isInitialized && AppDataSourceSQLite.destroy()
    ].filter(Boolean));
  }
}