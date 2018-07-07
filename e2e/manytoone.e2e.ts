import {
  BaseModel,
  Entity,
  Column,
  ManyToOne,
  init,
  end,
  transaction
} from "../dist/orm";
import config from "./config";

@Entity()
class Person extends BaseModel {
  @Column() firstname: string;

  @Column() lastname: string;
}

@Entity()
class PhoneNumber extends BaseModel {
  @Column() number: number;

  @ManyToOne({ type: () => Person, eager: true })
  owner: Person;
}

beforeAll(async () => {
  init(config);
  await transaction(async () => {
    await PhoneNumber.drop();
    await Person.drop();
    await Person.sync();
    await PhoneNumber.sync();
  });
});

afterAll(end);

describe("Basic Entity interaction", () => {
  it("creates a blogpost with the constructor and saves it", async () => {
    await transaction(async () => {
      const person = new Person({ firstname: "Joe", lastname: "Bloggs" });
      await person.save();

      const phoneNumber = new PhoneNumber({
        number: 555,
        owner: person
      });
      await phoneNumber.save();

      const foundPhoneNumber = await PhoneNumber.get<PhoneNumber>(
        phoneNumber.id
      );

      expect(foundPhoneNumber.toJSON()).toEqual(phoneNumber.toJSON());
      expect(foundPhoneNumber.owner.toJSON()).toEqual(
        phoneNumber.owner.toJSON()
      );
    });
  });

  it("creates a phonesnumber and adds the owner", async () => {
    await transaction(async () => {
      const person = new Person({ firstname: "Joe", lastname: "Bloggs" });
      await person.save();

      const phoneNumber = new PhoneNumber({
        number: 555
      });
      phoneNumber.owner = person;
      await phoneNumber.save();

      const foundPhoneNumber = await PhoneNumber.get<PhoneNumber>(
        phoneNumber.id
      );

      expect(foundPhoneNumber).toEqual(phoneNumber);
      expect(foundPhoneNumber.owner).toEqual(person);
    });
  });

  it("saves the person and the phonenumber together", async () => {
    await transaction(async () => {
      const person = new Person({ firstname: "Joe", lastname: "Bloggs" });

      const phoneNumber = new PhoneNumber({
        number: 555
      });
      phoneNumber.owner = person;
      await phoneNumber.save();

      const foundPerson = await Person.get<Person>(person.id);
      expect(foundPerson).toEqual(person);

      const foundPhoneNumber = await PhoneNumber.get<PhoneNumber>(
        phoneNumber.id
      );
      expect(foundPhoneNumber).toEqual(phoneNumber);
      expect(foundPhoneNumber.owner).toEqual(person);
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js manytoone.e2e.ts
