import { Entity } from "../dist/entity";
import { OneToMany, ManyToOne, ManyToMany } from "../dist/associations";
import BaseModel from "../dist/basemodel";
import metadata from "../dist/metadata";
import modelmanager from "../dist/modelmanager";

/**
 * Many To One
 */
@Entity()
class M2OOne extends BaseModel {}

@Entity()
class M2OMany extends BaseModel {
  @ManyToOne({ type: () => M2OOne })
  oneAssociation: M2OOne;
}

/**
 * Many To Many
 */
@Entity()
class M2MTarget extends BaseModel {}

@Entity()
class M2MSource extends BaseModel {
  @ManyToMany({ type: () => M2MTarget, throughName: "M2MSourceTarget" })
  manyAssociation: M2MTarget[];
}

metadata.build();

describe("Associations", () => {
  describe("ManyToOne", () => {
    it("store the metadata for the association", () => {
      const returnedMetadata = metadata.getEntityMetadata(M2OMany);
      const associationColumnMetadata = returnedMetadata.columns["m2oone_id"];
      expect(associationColumnMetadata).toBeTruthy();
    });
  });

  describe("ManyToMany", () => {
    it("create join table", () => {
      const JoinEntity = modelmanager.getModel("M2MSourceTarget");
      expect(JoinEntity).toBeTruthy();
      const JoinEntityMetadata = metadata.getEntityMetadata(JoinEntity);
      const sourceForeignKey = JoinEntityMetadata.columns["m2msource_id"];
      expect(sourceForeignKey).toBeTruthy();
      const targetForeignKey = JoinEntityMetadata.columns["m2mtarget_id"];
      expect(targetForeignKey).toBeTruthy();
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js associations.test.ts
