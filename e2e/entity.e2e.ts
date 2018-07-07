import {
  BaseModel,
  Entity,
  Column,
  DerivedColumn,
  init,
  end,
  transaction
} from "../dist/orm";
import config from "./config";

@Entity()
class Programmer extends BaseModel {
  @Column() firstname: string;

  @Column() lastname: string;

  @DerivedColumn({
    get: function() {
      return `${this.firstname} ${this.lastname}`;
    }
  })
  fullname: string;
}

beforeAll(() => {
  init(config);
});

afterAll(end);

beforeEach(async () => {
  await transaction(async () => {
    await Programmer.drop();
    await Programmer.sync();
  });
});

describe("Basic Entity interaction", () => {
  it("saves a programmer and reads it back", async () => {
    await transaction(async () => {
      const programmer = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      await programmer.save();

      const gottenProgrammer = await Programmer.get<Programmer>(programmer.id);
      expect(gottenProgrammer).toEqual(programmer);

      const searchedProgrammer = await Programmer.findOne<Programmer>({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      expect(searchedProgrammer).toEqual(programmer);
    });
  });

  it("saves a programmer, reads it back & modifies it", async () => {
    await transaction(async () => {
      const programmer = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      await programmer.save();

      const gottenProgrammer = await Programmer.get<Programmer>(programmer.id);
      expect(gottenProgrammer).toEqual(programmer);

      gottenProgrammer.firstname = "Joseph";
      gottenProgrammer.save();

      const BloggsPeople = await Programmer.findAll<Programmer>({
        lastname: "Bloggs"
      });

      expect(BloggsPeople.length).toBe(1);
      expect(BloggsPeople[0]).toEqual(gottenProgrammer);
    });
  });

  it("saves a programmer then deletes it", async () => {
    await transaction(async () => {
      const programmer = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      await programmer.save();

      const gottenProgrammer = await Programmer.get<Programmer>(programmer.id);
      expect(gottenProgrammer).toEqual(programmer);

      await programmer.delete();

      const allPeople = await Programmer.findAll<Programmer>();
      expect(allPeople.length).toBe(0);
    });
  });

  it("saves a few people then counts them", async () => {
    await transaction(async () => {
      const programmer1 = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      const programmer2 = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      const programmer3 = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      await programmer1.save();
      await programmer2.save();
      await programmer3.save();

      const numPeople = await Programmer.count();
      expect(numPeople).toBe(3);
    });
  });

  it("saves a few people then finds some", async () => {
    await transaction(async () => {
      const JoeBloggs = new Programmer({
        firstname: "Joe",
        lastname: "Bloggs"
      });
      const JaneBloggs = new Programmer({
        firstname: "Jane",
        lastname: "Bloggs"
      });
      const JohnSnow = new Programmer({ firstname: "John", lastname: "Snow" });
      await JoeBloggs.save();
      await JaneBloggs.save();
      await JohnSnow.save();

      const BloggsPeople = await Programmer.findAll<Programmer>({
        lastname: "Bloggs"
      });
      expect(BloggsPeople.length).toBe(2);
      expect(BloggsPeople).toContainEqual(JoeBloggs);
      expect(BloggsPeople).toContainEqual(JaneBloggs);
    });
  });

  it("has a dervived column", () => {
    const programmer = new Programmer({ firstname: "Joe", lastname: "Bloggs" });
    expect(programmer.fullname).toEqual("Joe Bloggs");
  });
});

// yarn build && ../node_modules/jest/bin/jest.js entity.e2e.ts
