export interface DataTypeOption {
  length?: number;
  autoIncrement?: boolean;
}

export interface DataType {
  getSQLType(attributeOptions?: DataTypeOption): string;
}

/**
 * Boolean
 */
export class BooleanDataType implements DataType {
  getSQLType() {
    return "BOOLEAN";
  }
}
export const BOOLEAN = new BooleanDataType();

/**
 * INT
 */
export class IntDataType implements DataType {
  getSQLType(attributeOptions?: DataTypeOption) {
    if (attributeOptions && attributeOptions.autoIncrement) {
      return "SERIAL";
    }
    return "INT";
  }
}

export const INT = new IntDataType();

/**
 * String
 */
export class StringDataType implements DataType {
  getSQLType(attributeOptions?: DataTypeOption) {
    if (
      attributeOptions &&
      attributeOptions.length &&
      attributeOptions.length > 255
    ) {
      throw new Error("String too long, use TextDataType instead");
    }
    return attributeOptions && attributeOptions.length
      ? `VARCHAR(${attributeOptions.length})`
      : "VARCHAR";
  }
}
export const STRING = new StringDataType();

/**
 * Text
 */
export class TextDataType implements DataType {
  getSQLType() {
    return "TEXT";
  }
}
export const TEXT = new TextDataType();

/**
 * Timestamp
 */
export class TimeStampDataType implements DataType {
  getSQLType() {
    return "TIMESTAMP WITH TIME ZONE";
  }
}
export const TIMESTAMP = new TimeStampDataType();

export function getDataType(type: string): DataType | undefined {
  switch (type.toUpperCase()) {
    case "NUMBER":
    case "INT":
    case "INTEGER":
    case "SERIAL":
      return INT;
    case "STRING":
      return STRING;
    case "BOOL":
    case "BOOLEAN":
      return BOOLEAN;
    default:
      return undefined;
  }
}
