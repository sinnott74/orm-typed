import { Entity } from "../dist/entity";
import BaseModel from "../dist/basemodel";
import ModelManager from "../dist/modelmanager";
import metadata from "../dist/metadata";

describe("Entity", () => {
  it("gets added to the ModelManager", () => {
    @Entity()
    class Test extends BaseModel {}
    expect(ModelManager.isDefined("Test")).toBeTruthy();
  });

  it("keeps its name", () => {
    @Entity()
    class Test extends BaseModel {}
    expect(Test.name).toBe("Test");
  });

  it("gains static read methods", () => {
    @Entity()
    class Test extends BaseModel {}
    expect(Test.get).toBeInstanceOf(Function);
    expect(Test.findAtMostOne).toBeInstanceOf(Function);
    expect(Test.findOne).toBeInstanceOf(Function);
    expect(Test.findAll).toBeInstanceOf(Function);
  });

  it("gains instance methods", () => {
    @Entity()
    class Test extends BaseModel {}
    const test = new Test();
    expect(test.toJSON).toBeInstanceOf(Function);
    expect(test.toString).toBeInstanceOf(Function);
    expect(test.save).toBeInstanceOf(Function);
  });

  it("gains own copy of instance variables", () => {
    @Entity()
    class Test extends BaseModel {}
    const test1 = new Test();
    test1.id = 1;
    const test2 = new Test();
    test2.id = 2;
    expect(test1.id).not.toBe(test2.id);
  });

  it("gains enumerable BaseModel columns", () => {
    @Entity()
    class Test extends BaseModel {}
    const test1 = new Test();
    expect(test1.toJSON()).toEqual({});
    test1.id = 1;
    expect(test1.toJSON()).toEqual({ id: 1 });
  });

  it("creates table metadata", () => {
    @Entity()
    class Test extends BaseModel {}
    metadata.build();

    const tableMetadata = metadata.getSQLEntity(Test);
    expect(tableMetadata).toBeTruthy();
  });

  it("table name can be specified", () => {
    @Entity({ name: "TEST" })
    class Test extends BaseModel {}
    metadata.build();

    const tableMetadata = metadata.getEntityMetadata(Test);
    expect(tableMetadata.name).toEqual("TEST");
  });
});

// ../node_modules/jest/bin/jest.js entity.test.ts
