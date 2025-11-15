import "reflect-metadata"
import { DataSource } from "typeorm"

export const AppDataSourceMySQL = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "Lmy19980416@",
    database: "sakila",
    synchronize: false,
    logging: false,
    entities: [__dirname + "/entity/**/*.ts"],
    migrations: [],
    subscribers: [],
})
