import BaseModel from "./basemodel";
import ModelManager from "./modelmanager";
import metadata from "./metadata";

export interface EntityOptions {
  name?: string;
  schema?: string;
}

/**
 * Decorator which defines an entity
 * @param options
 */
export function Entity(options?: EntityOptions) {
  return function<T extends typeof BaseModel>(constructor: T): T {
    // Cleanly mix BaseModel into given Entity
    // const extendedBaseModel = applyBaseModelMixin(constructor);
    // const constructor = constructor;

    defineEntity(constructor, options);

    // return to overwrite class constructor
    return constructor;
  };
}

/**
 * Adds the entity to the model manager & creates the metadata
 * @param entity
 */
export function defineEntity(
  entity: typeof BaseModel,
  options: EntityOptions = {}
) {
  if (options.name) {
    updateTableName(entity, options.name);
  }

  if (options.schema) {
    updateSchemaName(entity, options.schema);
  }

  // Manage the model
  ModelManager.addModel(entity);

  // Finished and store the SQL entity object
  // metadata.buildEntityMetadata(entity);
  // metadata.build();
}

/**
 * Updates the name of the table in the metadata for an entity
 * @param entity
 * @param tableName
 */
function updateTableName(entity: typeof BaseModel, tableName: string) {
  const entityMetadata = metadata.getEntityMetadata(entity);
  entityMetadata.name = tableName;
}

/**
 * Updates the name of the schema for an entity
 * @param entity
 * @param schemaName
 */
function updateSchemaName(entity: typeof BaseModel, schemaName: string) {
  const entityMetadata = metadata.getEntityMetadata(entity);
  entityMetadata.schema = schemaName;
}

// /**
//  * Mixes all of the BaseModels properties into the given Entity.
//  *
//  * Its basically extending BaseModel.
//  *
//  * @param Entity
//  * @param BaseModel
//  */
// function applyBaseModelMixin<T extends typeof BaseModel>(Entity: T): T {
//   // // Create instance to initialise the dataAttributes object with any default values
//   // const basemodel = new BaseModel();

//   // // Loop through each instance property & copy it onto the entity prototype
//   // Object.getOwnPropertyNames(basemodel).forEach(name => {
//   //   // Read the descriptor
//   //   const descriptor = Object.getOwnPropertyDescriptor(basemodel, name);

//   //   // if the descriptor has a value property create a deep clone
//   //   cloneDescriptorValue(descriptor);

//   //   Object.defineProperty(
//   //     Entity.prototype,
//   //     name,
//   //     <PropertyDescriptor>descriptor
//   //   );
//   // });

//   // Loop through each instance property descriptor & copy it onto the entity prototype
//   Object.getOwnPropertyNames(BaseModel.prototype).forEach(name => {
//     // Don't overwrite the likes of constructor, name etc.
//     // if (!Object.getOwnPropertyDescriptor(Entity, name)) {
//     // Read the descriptor
//     const descriptor = Object.getOwnPropertyDescriptor(
//       BaseModel.prototype,
//       name
//     );

//     // if the descriptor has a value property create a deep clone
//     // cloneDescriptorValue(descriptor);

//     Object.defineProperty(
//       Entity.prototype,
//       name,
//       <PropertyDescriptor>descriptor
//     );
//     // }
//   });

//   // Loop through each static/class property & copy it onto the entity constructor
//   Object.getOwnPropertyNames(BaseModel).forEach(name => {
//     // Don't overwrite the likes of constructor, name etc.
//     if (!Object.getOwnPropertyDescriptor(Entity, name)) {
//       // Read the descriptor
//       const descriptor = Object.getOwnPropertyDescriptor(BaseModel, name);

//       // if the descriptor has a value property create a deep clone
//       // cloneDescriptorValue(descriptor);

//       Object.defineProperty(Entity, name, <PropertyDescriptor>descriptor);
//     }
//   });

//   return <T & typeof BaseModel>Entity;
// }

// /**
//  * Copies & set the value of the descriptor
//  * @param descriptor PropertyDescriptor
//  */
// function cloneDescriptorValue(descriptor?: PropertyDescriptor) {
//   if (
//     descriptor &&
//     descriptor.value &&
//     !(descriptor.value instanceof Function)
//   ) {
//     descriptor.value = JSON.parse(JSON.stringify(descriptor.value));
//   }
// }
