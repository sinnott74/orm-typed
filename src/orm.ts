import ModelManager from "./modelmanager";
import Transaction, { createPGPool } from "./transaction";
import { PoolConfig, Pool } from "pg";
import { IncomingMessage, ServerResponse } from "http";
import { asyncForEach } from "./util";
import metadata from "./metadata";
import { default as BaseModel, defineModel } from "./basemodel";

/************************************************
 *                    Exports                   *
 ************************************************/

export { STRING, BOOLEAN, INT, TEXT, TIMESTAMP } from "./datatypes";
export { BaseModel, defineModel };
export { Column, DerivedColumn } from "./column";
export { Entity } from "./entity";
export { OneToOne, ManyToOne, ManyToMany } from "./associations";

let databaseConfig: PoolConfig;
let pool: Pool;

/**
 * Initialises the database connection
 * @param config
 */
export function init(config: PoolConfig) {
  // Store config & create pool
  databaseConfig = config;
  pool = createPGPool(databaseConfig);
  metadata.build();
}

/**
 * Ends the connection to the database
 */
export async function end() {
  return pool.end();
}

/**
 * Creates a database table for each model.
 */
export async function sync() {
  const models = ModelManager.getModels();
  await Transaction.startTransaction(pool, async () => {
    await asyncForEach(models, async model => {
      await model.sync();
    });
  });
}

/**
 * Starts a transaction
 * @param cb
 */
export async function transaction(cb: Function) {
  await Transaction.startTransaction(pool, cb);
}

/**
 * Express Middleware
 */
export async function middleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: Function
) {
  await Transaction.startResponseManagedTransaction(pool, res, next);
}
