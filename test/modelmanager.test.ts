import BaseModel from "../dist/basemodel";
import ModelManager from "../dist/modelmanager";
import { ManyToOne } from "../dist/associations";
import metadata from "../dist/metadata";

describe("ModelManager", () => {
  it("can have models added to it", () => {
    class Test extends BaseModel {}
    ModelManager.addModel(Test);
    expect(ModelManager.isDefined("Test")).toBeTruthy();
  });

  it("can have models retrived from it by their name", () => {
    class Test extends BaseModel {}
    ModelManager.addModel(Test);
    expect(ModelManager.getModel("Test")).toBe(Test);
  });

  it("can have all models retrived from it", () => {
    class Test extends BaseModel {}
    ModelManager.addModel(Test);
    class Test2 extends BaseModel {}
    ModelManager.addModel(Test2);
    const models = ModelManager.getModels();
    expect(models).toContain(Test);
    expect(models).toContain(Test2);
  });

  it("returns all models sorted by foreign reference", () => {
    class Test extends BaseModel {}
    class Test2 extends BaseModel {
      @ManyToOne({ type: () => Test })
      test: Test;
    }
    class Test3 extends BaseModel {
      @ManyToOne({ type: () => Test2 })
      test: Test2;
    }
    class Test4 extends BaseModel {} // unassociated models are added to the end
    ModelManager.addModel(Test4);
    ModelManager.addModel(Test2);
    ModelManager.addModel(Test3);
    ModelManager.addModel(Test);
    metadata.build();
    const models = ModelManager.getModels();
    expect(models).toEqual([Test, Test2, Test3, Test4]);
  });
});

// yarn build && ../node_modules/jest/bin/jest.js modelmanager.test.ts
