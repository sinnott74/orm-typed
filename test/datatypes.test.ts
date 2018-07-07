import {
  BOOLEAN,
  INT,
  STRING,
  TEXT,
  TIMESTAMP,
  getDataType
} from "../dist/datatypes";

describe("DataTypes", () => {
  it("BOOLEANDataType sql type is BOOLEAN", () => {
    expect(BOOLEAN.getSQLType()).toMatch("BOOLEAN");
  });

  it("IntDataType sql type is INT", () => {
    const attributeOptions = {};
    expect(INT.getSQLType(attributeOptions)).toMatch("INT");
  });

  it("IntDataType sql type is SERIAL when autoincrement is set", () => {
    const attributeOptions = { autoIncrement: true };
    expect(INT.getSQLType(attributeOptions)).toMatch("SERIAL");
  });

  it("TextDataType sql type is TEXT", () => {
    expect(TEXT.getSQLType()).toMatch("TEXT");
  });

  it("TimeStampDataType sql type is TIMESTAMP WITH TIME ZONE", () => {
    expect(TIMESTAMP.getSQLType()).toMatch("TIMESTAMP WITH TIME ZONE");
  });

  it("StringDataType sql type is VARCHAR", () => {
    const attributeOptions = {};
    expect(STRING.getSQLType(attributeOptions)).toMatch("VARCHAR");
  });

  it("StringDataType sql type is VARCHAR(length) when length set", () => {
    const attributeOptions = { length: 10 };
    expect(STRING.getSQLType(attributeOptions)).toMatch("VARCHAR(10)");
  });

  it("StringDataType sql type throws when length > 255", () => {
    const attributeOptions = { length: 256 };
    expect(() => {
      STRING.getSQLType(attributeOptions);
    }).toThrow("String too long, use TextDataType instead");
  });
});

describe("getDataType", () => {
  it("returns INT type for number", () => {
    expect(getDataType("number")).toEqual(INT);
  });

  it("returns INT type for int", () => {
    expect(getDataType("int")).toEqual(INT);
  });

  it("returns INT type for integer", () => {
    expect(getDataType("integer")).toEqual(INT);
  });

  it("returns INT type for serial", () => {
    expect(getDataType("serial")).toEqual(INT);
  });

  it("returns STRING type for string", () => {
    expect(getDataType("string")).toEqual(STRING);
  });

  it("returns BOOLEAN type for bool", () => {
    expect(getDataType("bool")).toEqual(BOOLEAN);
  });

  it("returns BOOLEAN type for boolean", () => {
    expect(getDataType("boolean")).toEqual(BOOLEAN);
  });

  it("returns undefined otherwise", () => {
    expect(getDataType("")).toEqual(undefined);
  });
});

// yarn build && ../node_modules/jest/bin/jest.js datatypes.test.ts
