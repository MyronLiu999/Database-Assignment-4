# SakilaTyperomMySQL

A Sakila database data synchronization and CLI tool built with TypeORM,
supporting dual databases (MySQL/SQLite3) and providing full data
synchronization, automatic entity generation, and unit testing
capabilities.

## Project Overview

**Core Features:** Full data synchronization for Sakila database
dimension tables (e.g., film, actor, category)\
**Tech Stack:** TypeScript + TypeORM + MySQL/SQLite3 + Commander (CLI) +
Jest (Testing)\
**Highlights:** entity generation, command-line sync
execution, and comprehensive test coverage

## Prerequisites

-   Node.js ≥ 14.17.0 (v16+ recommended)

-   npm ≥ 5.2.0

-   Databases: MySQL and SQLite3

-   Optional Global Dependencies:

    ``` bash
    npm install -g ts-node typeorm-model-generator
    ```

------------------------------------------------------------------------

## 1. Project Initialization

``` bash
# Initialize TypeORM project (MySQL template)
typeorm init --name SakilaTyperomMySQL --database mysql
cd SakilaTyperomMySQL

# Install core dependencies
npm install sqlite3 --save
npm install commander date-fns --save

# Install dev dependencies
npm install --save-dev ts-node typescript jest ts-jest @types/jest
```

------------------------------------------------------------------------

## 2. Database Configuration

### 2.1 MySQL (`src/data-source.mysql.ts`)

``` ts
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "your password",
    database: "sakila",
    entities: [__dirname + "/entity/**/*.ts"],
    synchronize: false,
    logging: false,
});
```

### 2.2 SQLite (`src/data-source.ts`)

``` ts
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "sakila.sqlite",
    entities: [__dirname + "/entity/**/*.ts"],
    synchronize: false,
    logging: false,
});
```

------------------------------------------------------------------------

## 3. Import Sakila Database Entities

``` bash
npx typeorm-model-generator   -h localhost   -d sakila   -u root   -x 'your password'   -e mysql   -o src/entity
```

Generated entity files automatically map to database table structures.

------------------------------------------------------------------------

## 4. Data Synchronization

### Sync a Single Dimension Table

``` bash
npx ts-node src/sync/full-load-dim-film.ts
npx ts-node src/sync/full-load-dim-actor.ts
npx ts-node src/sync/full-load-dim-category.ts
```

### Full Synchronization

Add to `package.json`:

``` json
{
  "scripts": {
    "full-load": "ts-node src/cli.ts full-load",
    "test": "jest"
  }
}
```

Run:

``` bash
npm run full-load
```

------------------------------------------------------------------------

## 5. Run Tests

``` bash
npm run test
```
