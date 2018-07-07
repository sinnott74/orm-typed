import BaseModel from "./basemodel";
import metadata, { StarOverloadedSQLTable } from "./metadata";
import { defineColumn, defineDataAttributeGetterAndSetter } from "./column";
import { TableNode } from "sql";
import { asyncForEach } from "./util";
import ModelManager from "./modelmanager";
import { INT } from "./datatypes";

export interface AssociationOptions {
  type(): typeof BaseModel;
  eager?: boolean;
  onDelete?: "restrict" | "cascade" | "no action" | "set null" | "set default";
}

export interface ManyToManyAssociationOptions extends AssociationOptions {
  throughName?: string;
}

/**
 * Decorator to define a One to One Association
 * @param options
 */
export function OneToOne(options: AssociationOptions) {
  return function(object: BaseModel, propertyName: string) {
    defineOneToOneAssociation(object, propertyName, options);
  };
}

/**
 * Decorator to define a One to Many Association
 * @param object
 * @param propertyName
 * @param options
 */
export function ManyToOne(options: AssociationOptions) {
  return function(object: BaseModel, propertyName: string) {
    defineManyToOneAssociation(object, propertyName, options);
  };
}

/**
 * Decorator to define a Many to Many Association
 * @param object
 * @param propertyName
 * @param options
 */
export function ManyToMany(options: ManyToManyAssociationOptions) {
  return function(object: BaseModel, propertyName: string) {
    defineManyToManyAssociation(object, propertyName, options);
  };
}

/**
 * Defines a One to One Association
 * @param object
 * @param propertyName
 * @param options
 */
export function defineOneToOneAssociation(
  object: BaseModel,
  propertyName: string,
  options: AssociationOptions
) {
  // Add ManyToOne association metadata
  const oneToOneAssociation = new OneToOneAssociation({
    name: propertyName,
    TargetFn: options.type,
    sourcePrototype: object,
    eager: options.eager,
    onDelete: options.onDelete
  });
  metadata.addAssociation(oneToOneAssociation);
}

/**
 * Defines a One to Many Association
 * @param object
 * @param propertyName
 * @param options
 */
export function defineManyToOneAssociation(
  object: BaseModel,
  propertyName: string,
  options: AssociationOptions
) {
  // Add ManyToOne association metadata
  const manyToOneAssociation = new ManyToOneAssociation({
    name: propertyName,
    sourcePrototype: object,
    TargetFn: options.type,
    eager: options.eager,
    onDelete: options.onDelete
  });
  metadata.addAssociation(manyToOneAssociation);
}

/**
 * Defines a One to One Association
 * @param object
 * @param propertyName
 * @param options
 */
export function defineManyToManyAssociation(
  object: BaseModel,
  propertyName: string,
  options: ManyToManyAssociationOptions
) {
  // Add ManyToOne association metadata
  const manyToManyAssociation = new ManyToManyAssociation({
    name: propertyName,
    TargetFn: options.type,
    sourcePrototype: object,
    throughName: options.throughName,
    eager: options.eager,
    onDelete: options.onDelete
  });
  metadata.addAssociation(manyToManyAssociation);
}

export interface AssociationInput {
  name: string;
  TargetFn: () => typeof BaseModel;
  sourcePrototype: BaseModel;
  eager?: boolean;
  throughName?: string;
  onDelete?: "restrict" | "cascade" | "no action" | "set null" | "set default";
}

export interface Association extends AssociationInput {
  Source: typeof BaseModel;
  Target: typeof BaseModel;
  type: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
  join(from: StarOverloadedSQLTable): TableNode;
  save(source: BaseModel): void;
  build(): void;
}

/**
 * Abstract Association
 */
abstract class AbstractAssociation implements Association {
  name: string;
  Source: typeof BaseModel;
  Target: typeof BaseModel;
  TargetFn: () => typeof BaseModel;
  targetIDName: string;
  Through?: typeof BaseModel;
  throughName?: string;
  sourcePrototype: BaseModel;
  type: "OneToOne" | "OneToMany" | "ManyToOne" | "ManyToMany";
  eager?: boolean;
  onDelete: "restrict" | "cascade" | "no action" | "set null" | "set default";

  abstract join(from: StarOverloadedSQLTable): TableNode;
  abstract save(source: BaseModel): void;
  abstract defineGettersAndSetters(): void;
  protected abstract defineForeignKey(): void;

  constructor(options: AssociationInput) {
    this.name = options.name;
    this.sourcePrototype = options.sourcePrototype;
    this.Source = <typeof BaseModel>options.sourcePrototype.constructor;
    this.TargetFn = options.TargetFn;
    this.eager = options.eager;
    this.onDelete = options.onDelete || "cascade";
  }

  addMetadataColumnReference(
    Source: typeof BaseModel,
    Target: typeof BaseModel,
    columnName: string
  ) {
    const onDelete = this.onDelete;

    metadata.addColumn(Source, {
      name: columnName,
      property: columnName,
      dataType: INT.getSQLType(),
      notNull: true,
      references: {
        column: "id",
        table: Target.name.toLowerCase(),
        onDelete: onDelete
      },
      index: true
    });
  }

  build() {
    this.setTarget();
    this.defineForeignKey();
    this.defineGettersAndSetters();
  }

  setTarget() {
    this.Target = this.TargetFn();
    this.targetIDName = `${this.Target.name.toLowerCase()}_id`;
  }
}

/**
 * Many To One Association
 */
class ManyToOneAssociation extends AbstractAssociation {
  constructor(options: AssociationInput) {
    super(options);
    this.type = "ManyToOne";
  }

  join(from: StarOverloadedSQLTable) {
    const targetSQLEntity = metadata.getSQLEntity(this.Target);
    return from
      .leftJoin(targetSQLEntity)
      .on(targetSQLEntity.id.equals(from[this.targetIDName]));
  }

  async save(source: BaseModel) {
    const target = <BaseModel>source[this.name];
    await target.save();
    source[this.targetIDName] = target.id;
  }

  defineGettersAndSetters() {
    const name = this.name;
    const Target = this.Target;
    const sourceObject = this.sourcePrototype;
    // define ManyToOne Getter and setter
    Object.defineProperty(sourceObject, name, {
      get: function() {
        return this.associationAttributes[name];
      },
      set: function(value: BaseModel | any[]) {
        // may be an array coming from the database
        if (Array.isArray(value) && value[0]) {
          value = new Target(value[0]);
        }
        if (value instanceof BaseModel) {
          this.associationAttributes[name] = value;
        }
      },
      enumerable: true,
      configurable: true
    });
  }

  defineForeignKey() {
    this.addMetadataColumnReference(
      this.Source,
      this.Target,
      this.targetIDName
    );
    defineDataAttributeGetterAndSetter(this.sourcePrototype, this.targetIDName);
  }
}

/**
 * One To One Association
 */
class OneToOneAssociation extends AbstractAssociation {
  constructor(options: AssociationInput) {
    super(options);
    this.type = "OneToOne";
  }

  join(from: StarOverloadedSQLTable) {
    const targetSQLEntity = metadata.getSQLEntity(this.Target);
    return from
      .leftJoin(targetSQLEntity)
      .on(targetSQLEntity.id.equals(from[this.targetIDName]));
  }

  async save(source: BaseModel) {
    const target = <BaseModel>source[this.name];
    await target.save();
    source[this.targetIDName] = target.id;
  }

  defineGettersAndSetters() {
    const name = this.name;
    const Target = this.Target;
    const sourceObject = this.sourcePrototype;
    Object.defineProperty(sourceObject, name, {
      get: function() {
        return this.associationAttributes[name];
      },
      set: function(value: BaseModel | any[]) {
        // may be an array coming from the database
        if (Array.isArray(value) && value[0]) {
          value = new Target(value[0]);
        }

        if (value instanceof BaseModel) {
          this.associationAttributes[name] = value;
        }
      },
      enumerable: true,
      configurable: true
    });
  }

  defineForeignKey() {
    this.addMetadataColumnReference(
      this.Source,
      this.Target,
      this.targetIDName
    );
    defineDataAttributeGetterAndSetter(this.sourcePrototype, this.targetIDName);
  }
}

/**
 * Many To Many Association
 */
class ManyToManyAssociation extends AbstractAssociation {
  Through: typeof BaseModel;
  sourceIDName: string;

  constructor(options: AssociationInput) {
    super(options);
    this.type = "ManyToMany";
    this.throughName = options.throughName;
    this.sourceIDName = `${this.Source.name.toLowerCase()}_id`;
  }

  join(from: StarOverloadedSQLTable) {
    const sourceSQLEntity = metadata.getSQLEntity(this.Source);
    const targetSQLEntity = metadata.getSQLEntity(this.Target);
    const throughSQLEntity = metadata.getSQLEntity(this.Through);
    return from
      .leftJoin(throughSQLEntity)
      .on(throughSQLEntity[this.sourceIDName].equals(sourceSQLEntity.id))
      .leftJoin(targetSQLEntity)
      .on(throughSQLEntity[this.targetIDName].equals(targetSQLEntity.id));
  }

  async save(source: BaseModel) {
    // Save the source to get an id
    if (!source.id) {
      await source.modelOnlySave();
    }

    // delete all through rows for the source
    await this.Through.delete({
      [this.sourceIDName]: source.id
    });
    const throughs: BaseModel[] = [];

    // save the targets
    const targets = <BaseModel[]>source[this.name.toLowerCase()];
    await asyncForEach(targets, async target => {
      await target.modelOnlySave();

      // create a through for each source/target
      const throughData = {
        [this.sourceIDName]: source.id,
        [this.targetIDName]: target.id
      };
      const through = new this.Through(throughData);
      throughs.push(through);
    });

    // Save all the new through rows
    this.Through.insertAll(throughs);
  }

  defineGettersAndSetters() {
    const name = this.name;
    const Target = this.Target;
    Object.defineProperty(this.sourcePrototype, name, {
      get: function() {
        return this.associationAttributes[name];
      },
      set: function(values: any[]) {
        if (values) {
          const associatedModels: BaseModel[] = values.map(value => {
            // may be coming as an object array for the db
            if (!(value instanceof BaseModel)) {
              value = new Target(value);
            }
            return value;
          });

          this.associationAttributes[name] = associatedModels;
        }
      },
      enumerable: true,
      configurable: true
    });
  }

  defineThroughModel(): typeof BaseModel {
    const Through = class extends BaseModel {};
    const throughName = this.throughName;
    Object.defineProperty(Through, "name", {
      value: throughName,
      writable: false
    });
    defineColumn(Through, this.sourceIDName, {
      type: INT,
      notNull: true
    });
    defineColumn(Through, this.targetIDName, {
      type: INT,
      notNull: true
    });
    ModelManager.addModel(Through);
    return Through;
  }

  defineForeignKey() {
    this.addMetadataColumnReference(
      this.Through,
      this.Target,
      this.targetIDName
    );
    this.addMetadataColumnReference(
      this.Through,
      this.Source,
      this.sourceIDName
    );
  }

  build() {
    this.setTarget();
    this.Through = this.defineThroughModel();
    super.build();
  }
}
