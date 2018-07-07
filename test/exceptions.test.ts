import {
  MultipleRecordsFoundException,
  RecordNotFoundException,
  ApplicationException
} from "../dist/exceptions";

describe("Exception", () => {
  const message = "Test Exception";

  describe("ApplicationException", () => {
    class DummyException extends ApplicationException {}

    it("should have a default status of 500", () => {
      const dummyException = new DummyException(message);
      expect(dummyException.status).toEqual(500);
    });

    it("should takes in a message", () => {
      const dummyException = new DummyException(message);
      expect(dummyException.message).toEqual(message);
    });

    it("should have a name", () => {
      const dummyException = new DummyException(message);
      expect(dummyException.name).toEqual("DummyException");
    });

    it("should have a record the stacktrace", () => {
      const dummyException = new DummyException(message);
      expect(dummyException.stack).toBeTruthy();
    });
  });
  describe("MultipleRecordsFoundException", () => {
    it("should have a status of 500", () => {
      const multipleRecordsFoundException = new MultipleRecordsFoundException(
        message
      );
      expect(multipleRecordsFoundException.status).toEqual(500);
    });

    it("should have a name of MultipleRecordsFoundException", () => {
      const multipleRecordsFoundException = new MultipleRecordsFoundException(
        message
      );
      expect(multipleRecordsFoundException.name).toEqual(
        "MultipleRecordsFoundException"
      );
    });
  });

  describe("RecordNotFoundException", () => {
    it("should have a status of 404", () => {
      const multipleRecordsFoundException = new RecordNotFoundException(
        message
      );
      expect(multipleRecordsFoundException.status).toEqual(404);
    });

    it("should have a name of RecordNotFoundException", () => {
      const multipleRecordsFoundException = new RecordNotFoundException(
        message
      );
      expect(multipleRecordsFoundException.name).toEqual(
        "RecordNotFoundException"
      );
    });
  });
});

// ../node_modules/jest/bin/jest.js exceptions.test.ts
