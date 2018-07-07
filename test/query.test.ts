import BaseModel from "../dist/basemodel";
import { Column } from "../dist/column";
import { Entity } from "../dist/entity";
import { set } from "../dist/threadlocal";
import Query from "../dist/query";
import metadata from "../dist/metadata";

describe("Query", () => {
  // Mock return values from pg.Client
  const mockedRows: any = [];
  const mockedResult = {
    rows: mockedRows
  };

  // Mock pg.Client
  const mockedClient = {
    query: jest.fn().mockReturnValue(mockedResult)
  };

  // Mock a transaction with mocked pg.client
  const mockedTransaction = {
    client: mockedClient
  };

  // Set the transaction in threadlocal
  set("transaction", mockedTransaction);

  // Create Entity to test on
  @Entity()
  class Test extends BaseModel {
    @Column() name: string;
  }

  metadata.build();

  // Test variable
  const id = 1;
  const name = "Joe Bloggs";
  const count = 101;

  beforeEach(() => {
    mockedClient.query.mockClear();
  });

  describe("Select", () => {
    it("can called without attributes to return all", () => {
      const expectQuery = {
        text: 'SELECT "public"."test".* FROM "public"."test"',
        values: []
      };

      const result = Query.select(Test);

      expect(result).resolves.toEqual(mockedRows);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });

    it("can called with an attribute", () => {
      const expectQuery = {
        text:
          'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
        values: [1]
      };

      const result = Query.select(Test, { id });

      expect(result).resolves.toEqual(mockedRows);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });

    it("can called with multiple attributes", () => {
      const expectQuery = {
        text:
          'SELECT "public"."test".* FROM "public"."test" WHERE (("public"."test"."id" = $1) AND ("public"."test"."name" = $2))',
        values: [id, name]
      };

      const result = Query.select(Test, { id, name });

      expect(result).resolves.toEqual(mockedRows);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });

  describe("Insert", () => {
    it("can be called with no values", async done => {
      mockedClient.query.mockReturnValue({
        rows: [{ id }]
      });

      const expectQuery = {
        text: 'INSERT INTO "public"."test" DEFAULT VALUES RETURNING "id"',
        values: []
      };

      const returnedId = await Query.insert(Test);

      expect(returnedId).toEqual(id);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
      done();
    });

    it("can be called with value", async done => {
      mockedClient.query.mockReturnValue({
        rows: [{ id }]
      });

      const expectQuery = {
        text: 'INSERT INTO "public"."test" ("name") VALUES ($1) RETURNING "id"',
        values: [name]
      };

      const returnedId = await Query.insert(Test, { name });

      expect(returnedId).toEqual(id);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
      done();
    });
  });

  describe("Modify", () => {
    it("can be called", () => {
      const expectQuery = {
        text:
          'UPDATE "public"."test" SET "name" = $1 WHERE ("public"."test"."id" = $2)',
        values: [name, id]
      };

      const result = Query.modify(Test, { id, name });

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });

  describe("Delete", () => {
    it("can be called with no attributes to delete all", () => {
      const expectQuery = {
        text: 'DELETE FROM "public"."test"',
        values: []
      };

      const result = Query.delete(Test);

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });

    it("can be called with a single attribute", () => {
      const expectQuery = {
        text: 'DELETE FROM "public"."test" WHERE ("public"."test"."id" = $1)',
        values: [id]
      };

      const result = Query.delete(Test, { id });

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });

    it("can be called with a multiple attribute", () => {
      const expectQuery = {
        text:
          'DELETE FROM "public"."test" WHERE (("public"."test"."id" = $1) AND ("public"."test"."name" = $2))',
        values: [id, name]
      };

      const result = Query.delete(Test, { id, name });

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });

  describe("Count", () => {
    it("can be called", () => {
      mockedClient.query.mockReturnValue({
        rows: [{ count }]
      });

      const expectQuery = {
        text:
          'SELECT COUNT("public"."test".*) AS "count" FROM "public"."test" WHERE ("public"."test"."id" = $1)',
        values: [id]
      };

      const returnedCount = Query.count(Test, { id });

      expect(returnedCount).resolves.toEqual(count);
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });

  describe("Create table if not exists", () => {
    it("can be called", () => {
      const expectQuery = {
        text:
          'CREATE TABLE IF NOT EXISTS "public"."test" ("id" SERIAL PRIMARY KEY, "name" VARCHAR)',
        values: []
      };

      const result = Query.createTableIfNotExists(Test);

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });

  describe("Drop table if exists", () => {
    it("can be called", () => {
      const expectQuery = {
        text: 'DROP TABLE IF EXISTS "public"."test"',
        values: []
      };

      const result = Query.dropTableIfExists(Test);

      expect(result).resolves.toBeUndefined();
      expect(mockedClient.query).toHaveBeenCalledTimes(1);
      expect(mockedClient.query).lastCalledWith(expectQuery);
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js query.test.ts
