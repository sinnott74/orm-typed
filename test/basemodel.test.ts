import BaseModel from "../dist/basemodel";
import { Column } from "../dist/column";
import { Entity } from "../dist/entity";
import { set } from "../dist/threadlocal";
import { MultipleRecordsFoundException } from "../dist/exceptions";
import metadata from "../dist/metadata";

// Test variabls
const id = 1;
const name = "Joe Bloggs";
const count = 3;

// Test subclass
@Entity()
class Test extends BaseModel {
  @Column() name: string;
}

@Entity({ name: "NAMED_TEST" })
class NamedTest extends BaseModel {
  @Column({ name: "NAMED_COLUMN" })
  name: string;
}

metadata.build();

// Mock pg.Client
const mockedClient = {
  query: jest.fn().mockReturnValue([])
};
// Mock a transaction with mocked pg.client
const mockedTransaction = {
  client: mockedClient
};
// Set the transaction in threadlocal
set("transaction", mockedTransaction);

beforeEach(() => {
  mockedClient.query.mockClear();
});

describe("BaseModel", () => {
  describe("Instance", () => {
    describe("constructor", () => {
      it("can be used to create an instance", () => {
        const basemodel = new BaseModel();
        expect(basemodel).toBeTruthy();
        expect(basemodel).toBeInstanceOf(BaseModel);
      });
      it("can be used to create an instance with values set", () => {
        const basemodel = new BaseModel({ id });
        expect(basemodel).toBeTruthy();
        expect(basemodel).toBeInstanceOf(BaseModel);
        expect(basemodel.id).toEqual(id);
      });
      it("is called by subclasses constructor", () => {
        const test = new Test();
        expect(test).toBeTruthy();
        expect(test).toBeInstanceOf(BaseModel);
      });
      it("can set values when called by a subclass", () => {
        const test = new Test({ id, name });
        expect(test).toBeTruthy();
        expect(test).toBeInstanceOf(BaseModel);
        expect(test.id).toEqual(id);
        expect(test.name).toEqual(name);
      });
      // it("will filter out values which are not defined in the metadata", () => {
      //   throw new Error("NOT IMPLEMENTED YET");
      // });
    });
    // describe("save", () => {
    //   it("persistes the date", () => {
    //     throw new Error("Save tests not implemented yet");
    //   });
    // });
    describe("overwrite", () => {
      it("will overwite all the data with a given model", () => {
        const test1 = new Test({ name: "test1" });
        const test2 = new Test({ name: "test2" });
        test1.overwrite(test2);

        expect(test2.name).toEqual(test2.name);
      });
    });

    describe("toJSON", () => {
      it("will return an empty object is the instance has no data", () => {
        const basemodel = new BaseModel();
        const JSON = basemodel.toJSON();
        expect(JSON).toEqual({});
      });

      it("will return object's data if it has some", () => {
        const basemodel = new BaseModel();
        basemodel.id = id;
        const JSON = basemodel.toJSON();
        expect(JSON).toEqual({ id });
      });

      it("will contain subclasses data", () => {
        const test = new Test();
        test.id = id;
        test.name = name;
        const JSON = test.toJSON();
        expect(JSON).toEqual({ id, name });
      });
    });

    describe("toString", () => {
      it("will contain the models name", () => {
        const basemodel = new BaseModel();
        const string = basemodel.toString();
        expect(string).toEqual(`BaseModel - {}`);
      });

      it("will contain the models data", () => {
        const basemodel = new BaseModel();
        basemodel.id = id;
        const string = basemodel.toString();
        expect(string).toEqual(`BaseModel - {"id":1}`);
      });

      it("will contain the subclasses data", () => {
        const test = new Test();
        test.id = id;
        test.name = name;
        const string = test.toString();
        expect(string).toEqual(`Test - {"name":"Joe Bloggs","id":1}`);
      });
    });
  });

  describe("Static", () => {
    describe("delete", () => {
      it("can be called on an Entity", async () => {
        const expectQuery = {
          text: 'DELETE FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [id]
        };

        const returnedValue = await Test.delete({ id });

        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });

    describe("sync", () => {
      it("can be called on an Entity to create the table", async () => {
        const expectQuery = {
          text:
            'CREATE TABLE IF NOT EXISTS "public"."test" ("id" SERIAL PRIMARY KEY, "name" VARCHAR)',
          values: []
        };

        const returnedValue = await Test.sync();

        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("creates a tables with the names specifiec", async () => {
        const expectQuery = {
          text:
            'CREATE TABLE IF NOT EXISTS "public"."NAMED_TEST" ("id" SERIAL PRIMARY KEY, "NAMED_COLUMN" VARCHAR)',
          values: []
        };

        const returnedValue = await NamedTest.sync();

        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });

    describe("drop", () => {
      it("can be called on an Entity to drop the table", () => {
        const expectQuery = {
          text: 'DROP TABLE IF EXISTS "public"."test"',
          values: []
        };

        const returnedValue = Test.drop();

        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });

    describe("count", () => {
      it("can be called on an Entity", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ count }]
        });

        const expectQuery = {
          text:
            'SELECT COUNT("public"."test".*) AS "count" FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [id]
        };

        const returnedValue = Test.count({ id });

        expect(returnedValue).resolves.toEqual(count);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });

    describe("findAll", () => {
      it("can return an array of that entity", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findAll({});

        expect(returnedValue).resolves.toEqual([expectedEntity]);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("can return an empty array", () => {
        mockedClient.query.mockReturnValue({
          rows: []
        });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findAll<Test>({});

        expect(returnedValue).resolves.toEqual([]);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("can return multiple entity instances", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }, { id: 2, name }]
        });

        const expectedEntity1 = new Test({ id, name });
        const expectedEntity2 = new Test({ id: 2, name });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findAll<Test>({});

        expect(returnedValue).resolves.toEqual([
          expectedEntity1,
          expectedEntity2
        ]);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });
    describe("findAtMostOne", () => {
      it("may return undefined", () => {
        mockedClient.query.mockReturnValue({
          rows: []
        });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findAtMostOne<Test>({});

        expect(returnedValue).resolves.toBeUndefined();
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("can return a single instance", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findAtMostOne<Test>({});

        expect(returnedValue).resolves.toEqual(expectedEntity);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("will throw if more than 1 instance is returned ", async () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }, { id: 2, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text:
            'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [1]
        };

        expect(Test.findAtMostOne<Test>({ id })).rejects.toThrow(
          'Multiple Records Found on Test with Key {"id":1}'
        );
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });
    describe("findOne", () => {
      it("can return a single instance", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findOne<Test>({});

        expect(returnedValue).resolves.toEqual(expectedEntity);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("will throw is no instance is found", () => {
        mockedClient.query.mockReturnValue({
          rows: []
        });

        const expectQuery = {
          text: 'SELECT "public"."test".* FROM "public"."test"',
          values: []
        };

        const returnedValue = Test.findOne<Test>({});

        expect(returnedValue).rejects.toThrow(
          "Record Not Found on Test with Key {}"
        );
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("will throw if more than 1 instance is returned ", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }, { id: 2, name }]
        });

        const expectQuery = {
          text:
            'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [1]
        };

        expect(Test.findOne<Test>({ id })).rejects.toThrow(
          'Multiple Records Found on Test with Key {"id":1}'
        );
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });
    describe("get", () => {
      it("can return a single instance", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text:
            'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [1]
        };

        const returnedValue = Test.get<Test>(id);

        expect(returnedValue).resolves.toEqual(expectedEntity);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("will throw is no instance is found", () => {
        mockedClient.query.mockReturnValue({
          rows: []
        });

        const expectQuery = {
          text:
            'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [1]
        };

        const returnedValue = Test.get<Test>(id);

        expect(returnedValue).rejects.toThrow(
          'Record Not Found on Test with Key {"id":1}'
        );
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("will throw if more than 1 instance is returned ", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }, { id: 2, name }]
        });

        const expectQuery = {
          text:
            'SELECT "public"."test".* FROM "public"."test" WHERE ("public"."test"."id" = $1)',
          values: [1]
        };

        expect(Test.get<Test>(id)).rejects.toThrow(
          'Multiple Records Found on Test with Key {"id":1}'
        );
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });

      it("it get the actuals columns names as the class attribute name", () => {
        mockedClient.query.mockReturnValue({
          rows: [{ id, name }]
        });

        const expectedEntity = new Test({ id, name });

        const expectQuery = {
          text:
            'SELECT "public"."NAMED_TEST"."id", "public"."NAMED_TEST"."NAMED_COLUMN" AS "name" FROM "public"."NAMED_TEST" WHERE ("public"."NAMED_TEST"."id" = $1)',
          values: [1]
        };

        const returnedValue = NamedTest.get<Test>(id);

        expect(returnedValue).resolves.toEqual(expectedEntity);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });

    describe("insertAll", () => {
      it("will save multiple models in a single query", () => {
        const expectQuery = {
          text:
            'INSERT INTO "public"."test" ("name") VALUES ($1), ($2), ($3) RETURNING "id"',
          values: ["test1", "test2", "test3"]
        };

        const test1 = new Test({ name: "test1" });
        const test2 = new Test({ name: "test2" });
        const test3 = new Test({ name: "test3" });

        const insertAllPromise = Test.insertAll([test1, test2, test3]);

        expect(insertAllPromise).resolves.toEqual(undefined);
        expect(mockedClient.query).toHaveBeenCalledTimes(1);
        expect(mockedClient.query).lastCalledWith(expectQuery);
      });
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js basemodel.test.ts
