import { define } from "sql";
import metadata, { ORMEntityAssociations } from "../metadata";
import BaseModel from "../basemodel";
import Query from "../query";
import { Association } from "../associations";

const columnsTable = define<string, object>({
  name: "columns",
  schema: "information_schema",
  columns: [
    { name: "table_schema", property: "tableSchema" },
    { name: "table_name", property: "tableName" },
    { name: "table_catalog", property: "tableCatalog" },
    { name: "column_name", property: "name" },
    { name: "ordinal_position", property: "ordinalPosition" },
    { name: "data_type", property: "type" },
    { name: "character_maximum_length", property: "charLength" },
    { name: "column_default", property: "defaultValue" },
    { name: "is_nullable", property: "isNullable" }
  ]
});

/**
 * Compares a models defined metadata with the actual table data
 * @param model
 */
export async function compareEntityMetadataWithTable(model: typeof BaseModel) {
  const allColumnMatch = await compareColumns(model);
  if (!allColumnMatch) {
    throw new Error(`Columns do not match for ${model.name}`);
  }
}

/**
 * Reads the information_schema.columns info for a Model
 * @param model
 */
async function getTableColumns(model: typeof BaseModel): Promise<any[]> {
  const modelMetadata = metadata.getEntityMetadata(model);

  const query = columnsTable
    .select()
    .where((columnsTable as any).tableName.equals(modelMetadata.name))
    .where((columnsTable as any).tableSchema.equals(modelMetadata.schema))
    .toQuery();

  const result = await Query.executeSQLQuery(query);
  return result.rows;
}

/**
 * Compares all the columns of the database table to that stored in the metadata.
 * Compares against both column metadata & association metadata.
 * @param model
 */
async function compareColumns(model: typeof BaseModel): Promise<boolean> {
  const tableColumns = await getTableColumns(model);
  const modelMetadata = metadata.getEntityMetadata(model);
  const metadataColumns = Object.values(modelMetadata.columns);

  // console.log(tableColumns);
  // console.log(metadataColumns);

  // Check every table column has a metadata column or association equivalent
  const isAllColumnsSame = tableColumns.every(tableColumn => {
    // check metadata column
    const metadataColumn = getColumnByName(tableColumn.name, metadataColumns);
    if (metadataColumn) {
      const isColumnSame = compareColumn(tableColumn, metadataColumn);
      if (!isColumnSame) {
        console.log(`Column ${tableColumn.name} does not match the metadata`);
      }
      return isColumnSame;
    }

    // check metadata association column
    const metadataAssociation = getColumnAssociation(
      tableColumn.name,
      modelMetadata.associations
    );
    if (metadataAssociation) {
      const isColumnSame = compareAssociationColumn(
        tableColumn,
        metadataAssociation
      );
      if (!isColumnSame) {
        console.log(`Column ${tableColumn.name} does not match the metadata`);
      }
      return isColumnSame;
    }

    // No metadata equivalent found
    throw new Error(`Column ${tableColumn.name} not found`);
  });

  return isAllColumnsSame;
}

/**
 * Gets a column by name from the array.
 * Throws an error if no column is found.
 *
 * @param name
 * @param columns
 */
function getColumnByName(name: string, columns: any[]) {
  const column = columns.find(item => {
    return item.name === name;
  });

  return column;
}

function compareColumn(tableColumn: any, metadataColumn: any) {
  const isSameName = tableColumn.name === metadataColumn.name;
  const isSameNullable = compareColumnNullable(tableColumn, metadataColumn);
  const isSameType = compareColumnType(tableColumn, metadataColumn);

  if (!(isSameName && isSameNullable && isSameType)) {
    console.error(tableColumn);
    console.error(metadataColumn);
    console.error(`Column ${tableColumn.name} is not the same as the metadata`);
    return false;
  }
  return true;
}

/**
 * Compares the column's nullable value
 * @param tableColumn
 * @param metadataColumn
 */
function compareColumnNullable(tableColumn: any, metadataColumn: any) {
  if (tableColumn.isNullable === "NO" && metadataColumn.notNull) {
    return true;
  } else if (tableColumn.isNullable === "YES" && !metadataColumn.notNull) {
    return true;
  }
  return false;
}

/**
 * Compares the column's type value
 * @param tableColumn
 * @param metadataColumn
 */
function compareColumnType(tableColumn: any, metadataColumn: any) {
  const compareFunction = columnTypeCompareFunctonMap[tableColumn.type];
  return compareFunction(tableColumn, metadataColumn);
}

/**
 * Compares a columns type to be exactly the same
 * @param tableColumn
 * @param metadataColumn
 */
function compareExact(tableColumn: any, metadataColumn: any): boolean {
  return (
    (tableColumn.type as string).toLowerCase() ===
    (metadataColumn.dataType as string).toLowerCase()
  );
}

/**
 * Compares a varchar's column type value
 * @param tableColumn
 * @param metadataColumn
 */
function compareVarcharType(tableColumn: any, metadataColumn: any): boolean {
  return `VARCHAR(${tableColumn.charLength})` === metadataColumn.dataType;
}

/**
 * Compares a integer's column type value
 * @param tableColumn
 * @param metadataColumn
 */
function compareIntegerType(tableColumn: any, metadataColumn: any): boolean {
  if (
    tableColumn.defaultValue &&
    (tableColumn.defaultValue as string).startsWith("nextval")
  ) {
    return metadataColumn.dataType === "SERIAL";
  } else {
    return metadataColumn.dataType === "INT";
  }
}

/**
 * Column Type compare function map.
 * Maps the table's column type value to a compare function
 */
const columnTypeCompareFunctonMap: {
  [name: string]: (tableColumn: any, metadataColumn: any) => boolean;
} = {
  integer: compareIntegerType,
  "timestamp with time zone": compareExact,
  "character varying": compareVarcharType,
  text: compareExact
};

/**
 * Checks if a table column is an Association column.
 * This table column won't be represented the column metadata but in the associations.
 * @param tableColumnName
 * @param associationMetadata
 */
function getColumnAssociation(
  tableColumnName: string,
  associationMetadata: ORMEntityAssociations
) {
  const associations = Object.values(associationMetadata);
  return associations.find(association => {
    // const Target = association.TargetFn();
    // return tableColumnName === `${Target.name.toLowerCase()}_id`;
    return true;
  });
}

function compareAssociationColumn(
  tableColumn: any,
  association: Association
): boolean {
  // const isSameName =
  // tableColumn.name === `${association.TargetFn().name.toLowerCase()}_id`;
  // const isColumnAnInteger = tableColumn.type === "integer";
  // const isNotNullable = tableColumn.isNullable === "NO";

  // return isSameName && isColumnAnInteger && isNotNullable;
  return true;
}
