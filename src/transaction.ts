import { get, set } from "./threadlocal";
import { v4 as uuidV4 } from "uuid";
import * as onFinished from "on-finished";
import { Pool, PoolConfig, PoolClient } from "pg";
import { ServerResponse } from "http";

/**
 * Initialises a PG Pool object
 * @param config
 */
export function createPGPool(config: PoolConfig) {
  const pool = new Pool(config);
  pool.on("error", (err, client) => {
    console.error(err);
  });
  return pool;
}

/**
 * Key underwhich the transaction is store in threadlocal.
 */
export const TRANSACTION = "transaction";

/**
 * Responsible for starting & maintaining database tranactions
 */
export default class Transaction {
  id: string;
  client: PoolClient;

  /**
   * Internal constructor which instantiates the Transaction object.
   * @param client
   */
  private constructor(client: PoolClient) {
    this.id = uuidV4();
    this.client = client;
  }

  /**
   * Retrives the current transaction
   */
  static get(): Transaction {
    // global put there for testing
    return get(TRANSACTION) || (global as any).transaction;
  }

  /**
   * Starts a transaction.
   *
   * Creates the transaction object & puts it into localstorage.
   * The transaction can be retrieved from your callback function by using the static get() function.
   *
   * The transaction is commited on succesfully execution of the callback, but rolledback if your callback throws.
   *
   * @param pool
   * @param cb
   */
  static async startTransaction(pool: Pool, cb: Function) {
    const transaction = await this.begin(pool);
    set(TRANSACTION, transaction);
    try {
      await cb();
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw new Error(err);
    }
  }

  /**
   * Starts a transaction.
   *
   * Creates the transaction object.
   * The transaction can be retrieved from your Next function by using the static get() function
   *
   * The transaction is finished when the response finishes.
   *
   * @param pool
   * @param res
   * @param cb
   */
  static async startResponseManagedTransaction(
    pool: Pool,
    res: ServerResponse,
    cb: Function
  ) {
    const transaction = await this.begin(pool);
    set(TRANSACTION, transaction);

    onFinished(res, async (err, res) => {
      if (err || (res.statusCode && res.statusCode >= 400)) {
        if (err) console.error(err);
        await transaction.rollback();
      } else {
        await transaction.commit();
      }
    });

    await cb();
  }

  /**
   * Static Transaction builder to create a Transaction from the pool.
   * @param pool
   */
  static async begin(pool: Pool) {
    const client = await pool.connect();
    await client.query("BEGIN");
    return new Transaction(client);
  }

  /**
   * rollsback the transaction.
   */
  async rollback() {
    await this.client.query("ROLLBACK");
    await this.client.release();
  }

  /**
   * Commits the transaction.
   */
  async commit() {
    await this.client.query("COMMIT");
    await this.client.release();
  }
}
