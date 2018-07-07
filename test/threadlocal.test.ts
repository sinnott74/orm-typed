import { get, set, size, enable, disable } from "../dist/threadlocal";
import fs = require("fs");

describe("ThreadLocal", () => {
  beforeEach(enable);

  afterEach(disable);

  test("can set & get a value in same context", () => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";
    set(key, value);
    expect(get(key)).toBe(value);
  });

  test("can set a value & get it from an async context", async () => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";

    const getFromAsyncContext = async () => {
      return get(key);
    };

    set(key, value);
    const returnedValue = await getFromAsyncContext();
    expect(returnedValue).toBe(value);
  });

  test("can set a value & get it in an async context", async done => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";

    const getInAsyncContext = async () => {
      expect(get(key)).toBe(value);
      done();
    };

    set(key, value);
    getInAsyncContext();
  });

  test("can't get a value from child context when parent has no context set", async () => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";

    const getInAsyncContext = async () => {
      set(key, value);
      expect(get(key)).toBe(value);
    };

    await getInAsyncContext();
    expect(get(key)).toBeUndefined();
  });

  test("can get a value from within chained promise", async done => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";
    const anotherKey = "anotherKey";
    const anotherValue = "anotherValue";
    const key3 = "cKey30";
    const value3 = "value3";

    const getInAsyncContext = function() {
      set(key, value);
      expect(get(key)).toBe(value);
      expect(get(anotherKey)).toBe(anotherValue);
      return Promise.resolve();
    };

    set(anotherKey, anotherValue); // creates the parent context

    getInAsyncContext()
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        set(key3, value3);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        expect(get(key3)).toBe(value3);
        return Promise.resolve();
      })
      .then(() => {
        expect(get(key)).toBe(value);
        expect(get(anotherKey)).toBe(anotherValue);
        done();
      });
  });

  test("can retrieve the total size of all threadlocals", async () => {
    const key = "test";
    const value = "ThreadLocal is will change javascript dev forever";

    const getInAsyncContext = async () => {
      const anotherKey = "anotherKey";
      set(anotherKey, value);
      expect(get(anotherKey)).toBe(value);
      expect(size()).toBe(2);
    };

    set(key, value);
    expect(get(key)).toBe(value);
    expect(size()).toBe(1);
    await getInAsyncContext();
  });
});
