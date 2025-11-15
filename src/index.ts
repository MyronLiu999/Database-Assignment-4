import { AppDataSourceMySQL } from "./data-source.mysql"
import { Actor } from "../temp/Actor"

// AppDataSource.initialize().then(async () => {

//     console.log("Inserting a new Actor into the database")
//     const actor = new Actor()
//     actor.actorId = 10000
//     actor.firstName = 'Myron'
//     actor.lastName = 'Liu'
    
//     // save a new actor
//     await AppDataSource.manager.save(actor)
//     console.log("Saved a new actor with id: " + actor.actorId)

//     // using repositories
//     const actorRepo = AppDataSource.getRepository(Actor); 
//     console.log("Loading actor from the database")
//     const all_actors = await actorRepo.find()
//     console.log("All Actors here: ", all_actors)

// }).catch(error => console.log(error))
