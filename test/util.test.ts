/**
 * Tests Util
 */
import * as util from "../dist/util";

test("pluralises string", () => {
  expect(util.puralize("test")).toBe("tests");
});

test("Capitalises a string", () => {
  expect(util.capitalize("test")).toBe("Test");
});

test("Empty data is grouped correctly", () => {
  const given: any[] = [];
  const expected: any[] = [];
  expect(util.groupData(given)).toEqual(expected);
});

test("Falsey data should show up in grouped data", () => {
  const given = [
    {
      id: 1,
      active: false,
      "child.id": 1,
      "child.active": false
    }
  ];
  const expected = [
    {
      id: 1,
      active: false,
      child: [
        {
          id: 1,
          active: false
        }
      ]
    }
  ];
  expect(util.groupData(given)).toEqual(expected);
});

test("Undefined attributes should not show up in grouped data", () => {
  const given = [
    {
      id: 1,
      active: undefined,
      "child.id": 1,
      "child.active": undefined
    }
  ];
  const expected = [
    {
      id: 1,
      child: [
        {
          id: 1
        }
      ]
    }
  ];
  expect(util.groupData(given)).toEqual(expected);
});

test("Data is grouped correctly", () => {
  const given = [
    {
      id: 1,
      name: "parent1",
      "child.id": 1,
      "child.name": "child1"
    },
    {
      id: 1,
      name: "parent1",
      "child.id": 2,
      "child.name": "child2"
    },
    {
      id: 2,
      name: "parent2",
      "child.id": 1,
      "child.name": "child1"
    },
    {
      id: 2,
      name: "parent2",
      "child.id": 2,
      "child.name": "child2"
    },
    {
      id: 1,
      name: "parent1",
      "child.id": 3,
      "child.name": "child3",
      "child.grandchild.id": 1,
      "child.grandchild.name": "grandchild1"
    }
  ];

  const expected = [
    {
      id: 1,
      name: "parent1",
      child: [
        {
          id: 1,
          name: "child1"
        },
        {
          id: 2,
          name: "child2"
        },
        {
          id: 3,
          name: "child3",
          grandchild: [
            {
              id: 1,
              name: "grandchild1"
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "parent2",
      child: [
        {
          id: 1,
          name: "child1"
        },
        {
          id: 2,
          name: "child2"
        }
      ]
    }
  ];

  expect(util.groupData(given)).toEqual(expected);
});

test("Defines an immutable property", () => {
  const object = {};
  util.defineImmutableProperty(object, "property", "value");
  const expected = {
    value: "value",
    writable: false,
    enumerable: false,
    configurable: false
  };
  // @ts-ignore
  expect(object.property).toBe("value");
  expect(Object.getOwnPropertyDescriptor(object, "property")).toEqual(expected);
});

test("Define a non enumerable property", () => {
  const object = {};
  util.defineNonEnumerableProperty(object, "property", "value");
  const expected = {
    writable: true,
    enumerable: false,
    configurable: true,
    value: "value",
    get: undefined,
    set: undefined
  };
  // @ts-ignore
  expect(object.property).toBe("value");
  expect(Object.getOwnPropertyDescriptor(object, "property")).toEqual(expected);
});

test("Define a non enumerable property", () => {
  const object = {};
  util.defineNonEnumerableProperty(object, "property", "value");
  const expected = {
    writable: true,
    enumerable: false,
    configurable: true,
    value: "value",
    get: undefined,
    set: undefined
  };
  // @ts-ignore
  expect(object.property).toBe("value");
  expect(Object.getOwnPropertyDescriptor(object, "property")).toEqual(expected);
});

test("asyncForEach call callback for each item in array", () => {
  const array = [1, 2, 3];
  const mockCallback = jest.fn(); // mock function

  return util.asyncForEach(array, mockCallback).then(() => {
    expect(mockCallback.mock.calls.length).toBe(array.length);
  });
});

test("asyncForEach returns a promise", () => {
  const array = [1, 2, 3];
  const mockCallback = jest.fn(); // mock function

  const promise = util.asyncForEach(array, mockCallback);
  expect(promise).toBeInstanceOf(Promise);
});

test("defineGetterAndSetter sets an enumerable getter & setter on the objects prototype", () => {
  const object = {};
  // @ts-ignore
  object.prototype = Function;
  // @ts-ignore
  object.prototype.get = jest.fn();
  // @ts-ignore
  object.prototype.set = jest.fn();
  const name = "test";
  // @ts-ignore
  util.defineGetterAndSetter(object, name);

  expect(
    // @ts-ignore
    Object.getOwnPropertyDescriptor(object.prototype, name).configurable
  ).toBe(false);
  expect(
    // @ts-ignore
    Object.getOwnPropertyDescriptor(object.prototype, name).enumerable
  ).toBe(true);
  expect(
    // @ts-ignore
    Object.getOwnPropertyDescriptor(object.prototype, name).get
  ).toBeInstanceOf(Function);
  expect(
    // @ts-ignore
    Object.getOwnPropertyDescriptor(object.prototype, name).set
  ).toBeInstanceOf(Function);

  // @ts-ignore
  object.prototype[name] = true;
  // @ts-ignore
  object.prototype[name];
  // @ts-ignore
  expect(object.prototype.get.mock.calls.length).toBe(1);
  // @ts-ignore
  expect(object.prototype.set.mock.calls.length).toBe(1);
});
