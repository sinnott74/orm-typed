import { PrimaryColumn } from "./column";
import Query from "./query";
import {
  RecordNotFoundException,
  MultipleRecordsFoundException
} from "./exceptions";
import { defineNonEnumerableProperty, asyncForEach } from "./util";
import Attribute from "./attribute";
import { groupData } from "./util";
import metadata from "./metadata";
import query from "./query";

interface DataAttributes {
  [attributeName: string]: Attribute;
}

interface AssociattionAttributes {
  [attributeName: string]: BaseModel | BaseModel[];
}

export interface ModelInput {
  [key: string]: any;
}

export default interface BaseModel {
  [key: string]: any;
};

export default class BaseModel {
  private dataAttributes: DataAttributes;
  private associationAttributes: AssociattionAttributes;

  constructor(data: ModelInput = {}) {
    // Stores all column data
    defineNonEnumerableProperty(this, "dataAttributes", {});
    defineNonEnumerableProperty(this, "associationAttributes", {});

    this.mapDataToAttributes(data);
  }

  @PrimaryColumn() id: number;

  // static entity: sql.Table;

  /************************************************************************************
   ******                      MODEL INSTANCE METHODS                            ******
   ************************************************************************************/

  /**
   * Sets the internal values of the columns.
   * @param data object of column keys to values
   */
  private mapDataToAttributes(data: ModelInput) {
    // TODO filter input
    const filteredData = this.filterDataByDefinition(data);
    Object.keys(filteredData).map(attributeName => {
      this[attributeName] = data[attributeName];
    });
  }

  /**
   * Filters the input data by the models metadata definition.
   * @param data
   */
  private filterDataByDefinition(data: ModelInput): ModelInput {
    const filterData: ModelInput = {};
    const modelMetadata = metadata.getEntityMetadata(<typeof BaseModel>this
      .constructor);

    Object.keys(data).forEach(attributeKey => {
      if (
        modelMetadata.columns[attributeKey] ||
        modelMetadata.associations[attributeKey]
      ) {
        filterData[attributeKey] = data[attributeKey];
      }
    });
    return filterData;
  }

  /**
   * Saves the models data & its associated models data
   */
  public async save() {
    await this.saveAssociations();
    await this.modelOnlySave();
  }

  /**
   * Save only the data for this model. i.e. does not save the models associations.
   */
  async modelOnlySave() {
    await this.beforeSave();
    if (this.isDirty()) {
      const BaseModelClass = <typeof BaseModel>this.constructor;
      if (this.id) {
        await this.beforeUpdate();
        this.id = this.id; // dirty the ID
        await Query.modify(BaseModelClass, this.getDirtyData());
        await this.afterUpdate();
      } else {
        await this.beforeCreate();
        this.id = await Query.insert(BaseModelClass, this.getDirtyData());
        await this.afterCreate();
      }
      this.cleanModelOnly();
      await this.afterSave();
    }
  }

  /**
   * Save the models associations
   */
  private async saveAssociations() {
    const modelMetadata = metadata.getEntityMetadata(<typeof BaseModel>this
      .constructor);
    const associationKeys = Object.keys(this.associationAttributes);
    await asyncForEach(associationKeys, async associationKey => {
      const associationMetadata = modelMetadata.associations[associationKey];
      await associationMetadata.save(this);
    });
  }

  /**
   * Deletes the model
   */
  delete() {
    // Model has been saved & can be deleted
    if (this.id) {
      const id = this.id;
      return (<typeof BaseModel>this.constructor).delete({ id });
    }
    return Promise.resolve();
  }

  /**
   * Overwrites a this models data with the given model
   * @param model
   */
  overwrite(model: this): void {
    for (const attributeKey in model) {
      this[attributeKey] = model[attributeKey];

      // Set dirty flag
      if (model.dataAttributes[attributeKey]) {
        this.dataAttributes[attributeKey].isDirty =
          model.dataAttributes[attributeKey].isDirty;
      }
    }
  }

  /**
   * Returns Object which contains only the attributes which are configured
   */
  toJSON() {
    const object: any = {};
    // loop through enumerable properties
    for (const key in this) {
      const value = this[key];
      object[key] = value;
    }
    return object;
  }

  /**
   * Gets a string representation of this model
   */
  toString() {
    return `${this.constructor.name} - ${JSON.stringify(this.toJSON())}`;
  }

  private clean() {
    this.cleanModelOnly();
    this.cleanAssociations();
  }

  /**
   * Sets the isDirty flag of all attributes on this model to false. i.e. cleans the Model.
   */
  private cleanModelOnly() {
    // Clean model's attributes
    Object.values(this.dataAttributes).forEach(attribute => {
      if (attribute) {
        attribute.isDirty = false;
      }
    });
  }

  private cleanAssociations() {
    // Clean Model's association's attributes
    Object.values(this.associationAttributes).forEach(associatedAttribute => {
      if (Array.isArray(associatedAttribute)) {
        associatedAttribute.forEach(associatedAttributeItem => {
          associatedAttributeItem.clean();
        });
      } else {
        associatedAttribute.clean();
      }
    });
  }

  private getDirtyData() {
    const dirtyData: { [key: string]: any } = {};
    Object.keys(this.dataAttributes).forEach(key => {
      const attribute = this.dataAttributes[key];
      if (attribute.isDirty) {
        dirtyData[key] = attribute.value;
      }
    });
    return dirtyData;
  }

  private isDirty() {
    return Object.values(this.dataAttributes).some(attribute => {
      return attribute.isDirty;
    });
  }

  /************************************************************************************
   ******                        MODEL INSTANCE HOOKS                            ******
   ************************************************************************************/

  beforeSave() {}
  afterSave() {}
  beforeCreate() {}
  afterCreate() {}
  beforeUpdate() {}
  afterUpdate() {}

  /************************************************************************************
   ******                         MODEL CLASS METHODS                            ******
   ************************************************************************************/

  /**
   * Class Method which reads a Entity by its primary key.
   * @param {Integer}     id ID of the entity
   * @throws RecordNotFoundException if no row with the given primary key is found
   * @throws MultipleRecordsFoundException if more than 1 row with the given primary key is found
   */
  public static async get<T extends BaseModel>(
    id: number,
    options?: FindOptions
  ): Promise<T> {
    return this.findOne<T>({ id: id }, options);
  }

  /**
   * Class Method which reads a Entity by its primary key.
   * @param {object}     key Attribute - Value object of which only 1 record should exist
   * @throws RecordNotFoundException if no row with the given primary key is found
   * @throws MultipleRecordsFoundException if more than 1 row with the given primary key is found
   * @return {Model}
   */
  public static async findOne<T extends BaseModel>(
    key: object,
    options?: FindOptions
  ): Promise<T> {
    const model = await this.findAtMostOne<T>(key, options);
    if (!model) {
      throw new RecordNotFoundException(
        `Record Not Found on ${this.name} with Key ${JSON.stringify(key)}`
      );
    }
    return model;
  }

  /**
   * Class method which reads an Entity by its a key.
   * @throws MultipleRecordsFoundException if more than 1 row with the given primary key is found
   * @param {*} key
   */
  public static async findAtMostOne<T extends BaseModel>(
    key: object,
    options?: FindOptions
  ): Promise<T | undefined> {
    const models = await this.findAll<T>(key, options);
    if (models.length > 1) {
      throw new MultipleRecordsFoundException(
        `Multiple Records Found on ${this.name} with Key ${JSON.stringify(key)}`
      );
    }
    return models[0];
  }

  /**
   * Class method to search for a entity based on the object & values provided
   * @param {object} attributes
   */
  public static async findAll<T extends BaseModel>(
    attributes: object = {},
    options: FindOptions = {}
  ): Promise<T[]> {
    options.includes = options.includes || [];
    // this._validateIncludes(options.includes);

    const rows = await Query.select(this, attributes, options);
    const groupedData = groupData(rows);

    return groupedData.map(data => {
      return this.buildCleanInstance<T>(data);
    }, this);
  }

  public static async insertAll<T extends BaseModel>(models: BaseModel[]) {
    const modelsData = models
      .filter(model => {
        return model.isDirty();
      })
      .map(model => {
        return model.getDirtyData();
      });

    await query.insertAll(this, modelsData);
  }

  /**
   * Class method to count the number of rows which have the given attributes
   * @param {*} attributes
   */
  public static async count(attributes?: object) {
    return Query.count(this, attributes);
  }

  /**
   * Delete a entry on this table
   * @param {object} where
   */
  public static async delete(where: object) {
    return Query.delete(this, where);
  }

  /**
   * Creates the database if it doesn't exist
   */
  public static async sync() {
    return Query.createTableIfNotExists(this);
  }

  public static async drop() {
    return Query.dropTableIfExists(this);
  }

  /**
   * Creates a clean instance of the model.
   * Clean instances should only be created when data is returned from the database.
   * @param data
   */
  private static buildCleanInstance<T extends BaseModel>(data: object): T {
    const model = <T>new this(data);
    model.cleanModelOnly();
    model.cleanAssociations();
    return model;
  }
}

export function defineModel(
  modelName: string,
  columns: any
  // options: any
): typeof BaseModel {
  // if (!modelName) {
  //   throw new Error("Model name required");
  // }
  // if (ModelManager.isDefined(modelName)) {
  //   throw new Error(`Model ${modelName} has alread been defined`);
  // }

  let Model = class extends BaseModel {};
  Object.defineProperty(Model, "name", { value: modelName, writable: false });
  return Model;
}

export interface FindOptions {
  includes?: string[];
}
