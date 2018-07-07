const toposort = require("toposort");
import BaseModel from "./basemodel";
import metadata from "./metadata";

interface Models {
  [modelName: string]: typeof BaseModel;
}

/**
 * Responsible for keeping track of all Models created by ORM.
 */
export class ModelManager {
  private models: Models = {};

  /**
   * Adds a model.
   *
   * see {@link BaseModel}
   *
   * @param {BaseModel}          model A Model
   */
  addModel(model: typeof BaseModel) {
    this.models[model.name.toLowerCase()] = model;
  }

  /**
   * Retrieves a managed a model.
   *
   * see {@link BaseModel}
   *
   * @param {String}          modelName A Model name
   */
  getModel(modelName: string) {
    return this.models[modelName.toLowerCase()];
  }

  /**
   * Checks if a Model has been defined previously
   * see {@link BaseModel}
   *
   * @param {String}          modelName Name of a model
   */
  isDefined(modelName: string) {
    return !!this.getModel(modelName.toLowerCase());
  }

  /**
   * Get a list of all Models, sorted based on model foregin references.
   * @returns A sorted array of Models
   */
  getModels() {
    // toposort the models
    let vertices = this._getModelVerticies();
    let modelNameOrder: Array<BaseModel["name"]> = toposort(vertices);
    let sortedModels = modelNameOrder.map(modelName => {
      return this.models[modelName];
    });
    this._addStandaloneModels(sortedModels);
    return sortedModels;
    // return Object.values(this.models);
  }

  /**
   * Gets a list of all directed foreign key vertices the model name. E.g. [blogpost -> user]
  //  * @returns {Array<Array<String, String>>} Array of Vertices of model foreign references
   * @example User.hasMany(BlogPost) & User.hasMany(Credential), returns [[user, blogpost],[user, credential]]
   */
  private _getModelVerticies() {
    const vertices: Array<[string, string]> = [];

    Object.values(this.models).forEach(model => {
      const modelMetadata = metadata.getEntityMetadata(model);

      Object.values(modelMetadata.columns).forEach(column => {
        if (column.references) {
          vertices.push([column.references.table, modelMetadata.name]);
        }
      });
    });

    return vertices;
  }

  /**
   * Adds Models which aren't include in the sorted (by foreign reference) list
   * @param {Array<Model>} sortedModels
   */
  private _addStandaloneModels(sortedModels: Array<typeof BaseModel>) {
    Object.keys(this.models).forEach(modelName => {
      const model = this.models[modelName];
      if (!sortedModels.includes(model)) {
        sortedModels.push(model);
      }
    });
  }
}

export default new ModelManager();
