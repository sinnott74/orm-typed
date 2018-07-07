import { Entity } from "../dist/entity";
import { Column, DerivedColumn, defineColumn } from "../dist/column";
import BaseModel from "../dist/basemodel";
import metadata from "../dist/metadata";
import { INT } from "../dist/datatypes";

describe("Column", () => {
  describe("Decorator", () => {
    it("get added to Entity", () => {
      class Test extends BaseModel {
        @Column() column: string = "test";
      }
      const test = new Test();
      expect(test.column).toEqual("test");
    });

    it("can be set & get & reset & get", () => {
      class Test extends BaseModel {
        @Column() column: string;
      }
      const test = new Test();

      test.column = "test";
      expect(test.column).toEqual("test");

      test.column = "test2";
      expect(test.column).toEqual("test2");
    });

    it("is enumerable", () => {
      class Test extends BaseModel {
        @Column() column: string;
      }
      const test = new Test();
      const enumerableColumns: string[] = [];
      for (const attributeName in test) {
        enumerableColumns.push(attributeName);
      }
      expect(enumerableColumns).toContain("column");
    });

    it("get added to the metadata", () => {
      class MetadataTest extends BaseModel {
        @Column() testColumn: string;
      }
      const modelMetadata = metadata.getEntityMetadata(MetadataTest);
      const columnMetadata = modelMetadata.columns["testcolumn"];
      expect(columnMetadata).toBeTruthy();
    });

    it("can have a table attribute name that different to the class property name", () => {
      class MetadataTest extends BaseModel {
        @Column({ name: "TEST_COLUMN" })
        testColumn: string;
      }
      const modelMetadata = metadata.getEntityMetadata(MetadataTest);
      const columnMetadata = modelMetadata.columns["TEST_COLUMN"];
      expect(columnMetadata).toBeTruthy();
    });
  });

  describe("DerivedColumn", () => {
    it("can be added to entity and read", () => {
      class Test extends BaseModel {
        @Column() firstname: string = "Joe";
        @Column() lastname: string = "Bloggs";
        @DerivedColumn({
          get: function() {
            return `${this.firstname} ${this.lastname}`;
          }
        })
        fullname: string;
      }
      const test = new Test();
      expect(test.fullname).toEqual("Joe Bloggs");
    });
  });

  describe("defineColumn", () => {
    it("adds column metadata", () => {
      class DefinedColumnTest extends BaseModel {}
      defineColumn(DefinedColumnTest, "test", { type: INT });
      const modelMetadata = metadata.getEntityMetadata(DefinedColumnTest);
      const columnMetadata = modelMetadata.columns["test"];
      expect(columnMetadata).toBeTruthy();
    });

    it("throws if the type isn't included", () => {
      class DefinedColumnTest extends BaseModel {}
      expect(() => {
        defineColumn(DefinedColumnTest, "test");
      }).toThrowError(
        "Column Type on DefinedColumnTest.test could not be determined. Please specify in column options"
      );
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js column.test.ts
