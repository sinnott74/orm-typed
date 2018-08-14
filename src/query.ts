import Transaction from "./transaction";
import { QueryConfig, QueryResult } from "pg";
import BaseModel, { FindOptions } from "./basemodel";
import metadata, { StarOverloadedSQLTable } from "./metadata";
import { Column } from "sql";
import { Association } from "./associations";
import { asyncForEach } from "./util";

/**
 * Responsible for interacting with the Database.
 */
export class Query {
  /**
   * Executes a given query in the currently running transaction.
   *
   * @param {Object|String}           query Object containing paramaterised SQL & parameter, or an SQL string to execute
   * @param {String}                  [query.text] The paramaterised SQL query to execute
   * @param {Array<String>}           [query.values] Values to be submitted with a paramatarised query
   */
  async executeSQLQuery(sqlQuery: QueryConfig): Promise<QueryResult> {
    const transaction = Transaction.get();
    console.time("query");
    console.log("query", sqlQuery.text, sqlQuery.values);
    const result = transaction.client.query(sqlQuery);
    console.timeEnd("query");
    return result;
  }

  /**
   * Gets the column associated with the given attributeName.
   *
   * @param {array<BaseModel>} models Array of models to check for the given column
   * @param {string} attributeName name of a model attribute
   *
   * @throws Error if no attribute not found
   * @throws Error if multiple columns match the attribute name
   */
  private getMatchingColumn(models: typeof BaseModel[], attributeName: string) {
    // ID should only reference the ID of the initial model, not the association
    if (attributeName === "id") {
      const sqlEntity = metadata.getSQLEntity(models[0]);
      return sqlEntity[attributeName];
    }

    const matches: Column<string, any>[] = [];
    models.forEach(model => {
      const sqlEntity = metadata.getSQLEntity(model);
      const modelMetadata = metadata.getEntityMetadata(model);

      // Check each column of each model
      Object.values(modelMetadata.columns).forEach(column => {
        if (column.name === attributeName) {
          matches.push(sqlEntity[attributeName]);
        }
      });
    });

    // No matches found
    if (matches.length === 0) {
      throw new Error(`No attribute match found for ${attributeName}`);
    }

    // Multiple matches found
    if (matches.length > 1) {
      let matchOutput = "";
      matches.forEach((match, index) => {
        if (index !== 0) {
          matchOutput += ", ";
        }
        // outputs schemaname.tablename.columnname
        // matchOutput += `${match.table._schema}.${match.table._name}.${
        //   match.name
        // }`;
        matchOutput += match.name;
      });
      throw new Error(
        `Multiple attribute matches found for ${attributeName} - ${matchOutput}`
      );
    }

    return matches[0];
  }

  /**
   * Executes a Select Query.
   *
   * @param {Model}                 model           Initial model on which this query is executed.
   * @param {object}                attributes     Attributes used in the where clause
   * @param {object}                options        Query options
   * @param {Array<string>}         options.includes   Array of association names
   */
  async select(
    model: typeof BaseModel,
    where: any = {},
    options?: FindOptions
  ) {
    const sqlEntity = metadata.getSQLEntity(model);
    const includeAssociations = getIncludedAssociations(model, options);

    // select
    let queryBuilder = sqlEntity.select(sqlEntity.star());
    includeAssociations.forEach(association => {
      const targetSQLEntity = metadata.getSQLEntity(association.Target);

      queryBuilder.select(
        targetSQLEntity.star({ prefix: `${association.name}.` })
      );
    });

    // from
    let fromClause = sqlEntity;
    includeAssociations.forEach(association => {
      fromClause = association.join(fromClause) as StarOverloadedSQLTable;
    });
    queryBuilder.from(fromClause);

    // where
    const includedTargets: typeof BaseModel[] = includeAssociations.map(
      association => {
        return association.Target;
      }
    );
    const models = [model, ...includedTargets];
    Object.keys(where).forEach(whereAttributeName => {
      const attribute = this.getMatchingColumn(models, whereAttributeName);
      const whereAttributeValue = where[whereAttributeName];
      queryBuilder.where(attribute.equals(whereAttributeValue));
    });

    // build query
    const sqlQuery = queryBuilder.toQuery();
    const result = await this.executeSQLQuery(sqlQuery);
    return result.rows;
  }

  /**
   * Executes an SQl query to create a table if it doesn't exist
   * @param {Model} model
   * @return an Instance of Query to be executed
   * @see Model
   */
  async createTableIfNotExists(model: typeof BaseModel) {
    const sqlEntity = metadata.getSQLEntity(model);
    const sqlQuery = sqlEntity
      .create()
      .ifNotExists()
      .toQuery();
    await this.executeSQLQuery(sqlQuery);

    const entityMetadata = metadata.getEntityMetadata(model);
    const indexColumns = Object.values(entityMetadata.columns).filter(
      column => {
        return column.index;
      }
    );

    // Drop indexes
    await asyncForEach(indexColumns, async column => {
      const createIndexQuery = sqlEntity
        .indexes()
        .drop(sqlEntity[column.property])
        .toQuery();
      createIndexQuery.text = createIndexQuery.text.replace(
        "INDEX",
        "INDEX IF EXISTS"
      );
      await this.executeSQLQuery(createIndexQuery);
    });

    // Create indexes
    await asyncForEach(indexColumns, async column => {
      const createIndexQuery = sqlEntity
        .indexes()
        .create()
        .on(sqlEntity[column.property])
        .toQuery();
      // IF NOT EXISTS is postgres 9.5+ only, elephantsql is using 9.4
      // createIndexQuery.text = createIndexQuery.text.replace(
      //   "INDEX",
      //   "INDEX IF NOT EXISTS"
      // );
      await this.executeSQLQuery(createIndexQuery);
    });

    return;
  }

  /**
   * Executes an SQl query to create a table if it doesn't exist
   * @param {Model} model
   * @return an Instance of Query to be executed
   * @see Model
   */
  async dropTableIfExists(model: typeof BaseModel) {
    const sqlEntity = metadata.getSQLEntity(model);
    const sqlQuery = sqlEntity
      .drop()
      .ifExists()
      .toQuery();
    await this.executeSQLQuery(sqlQuery);
    return;
  }

  /**
   * Executes an SQL query to create an instance of an entity
   * @param {Model} model
   * @param {*} attributes
   * @see Model
   */
  async insert(model: typeof BaseModel, attributes: object = {}) {
    const sqlEntity = metadata.getSQLEntity(model);

    const sqlQuery = sqlEntity
      .insert(attributes)
      .returning(sqlEntity["id"])
      .toQuery();
    const result = await this.executeSQLQuery(sqlQuery);
    return <number>result.rows[0].id;
  }

  async insertAll(model: typeof BaseModel, attributes: object[]) {
    if (attributes.length) {
      const sqlEntity = metadata.getSQLEntity(model);

      const sqlQuery = sqlEntity
        .insert(attributes)
        .returning(sqlEntity["id"])
        .toQuery();
      const result = await this.executeSQLQuery(sqlQuery);

      return result.rows.map(row => {
        return row.id;
      });
    }
    return [];
  }

  /**
   * Counts the number of rows.
   * @param model
   * @param attributes
   */
  async count(model: typeof BaseModel, attributes: any) {
    const sqlEntity = metadata.getSQLEntity(model);
    const kCOUNT = "count";
    let countQuery = sqlEntity.select(
      sqlEntity
        .star()
        .count()
        .as(kCOUNT)
    );
    if (attributes) {
      countQuery = countQuery.where(attributes);
    }
    const sqlQuery = countQuery.toQuery();
    const result = await this.executeSQLQuery(sqlQuery);
    return parseInt(result.rows[0][kCOUNT], 10);
  }

  /**
   * Performs an SQL modification
   * @param {Model} model
   * @param {Number} id ID of the entity
   * @param {Object} attributes
   */
  async modify(model: typeof BaseModel, attributes: any) {
    const sqlEntity = metadata.getSQLEntity(model);
    const id = attributes.id;
    delete attributes.id;

    const sqlQuery = sqlEntity
      .update(attributes)
      .where({ id })
      .toQuery();
    await this.executeSQLQuery(sqlQuery);
    return;
  }

  /**
   * Performs an SQL delete where matches the where object
   * @param {Model} model
   * @param {Object} where
   */
  async delete(model: typeof BaseModel, where?: object) {
    const sqlEntity = metadata.getSQLEntity(model);
    let deleteQuery = sqlEntity.delete();
    if (where) {
      deleteQuery = deleteQuery.where(where);
    }
    const sqlQuery = deleteQuery.toQuery();
    await this.executeSQLQuery(sqlQuery);
    return;
  }
}

export default new Query();

function getIncludedAssociations(
  model: typeof BaseModel,
  options?: FindOptions
) {
  const includedAssociations: Association[] = [];
  const modelMetadata = metadata.getEntityMetadata(model);
  Object.values(modelMetadata.associations).forEach(association => {
    if (shouldAssociationBeIncluded(association, options)) {
      includedAssociations.push(association);
    }
  });
  return includedAssociations;
}

function shouldAssociationBeIncluded(
  association: Association,
  options?: FindOptions
): boolean {
  // include eager associations
  if (association.eager) {
    return true;
  }

  if (
    options &&
    options.includes &&
    options.includes.includes(association.name)
  ) {
    return true;
  }
  return false;
}
