import { transaction, init } from "../dist/orm";
import config from "./config";
import { compareEntityMetadataWithTable } from "../dist/tableinfo";
import BlogPost from "../../server/dist/entity/BlogPost";

beforeAll(async () => {
  init(config);
});

describe("TableInfo", () => {
  xit("can", async () => {
    await transaction(async () => {
      await compareEntityMetadataWithTable(BlogPost);
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js tableinfo.e2e.ts
