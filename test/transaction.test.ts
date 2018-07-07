import Transaction, { createPGPool } from "../dist/transaction";
import { Pool } from "pg";
import * as http from "http";

// Create mocked client
const mockedClient = {
  query: jest.fn(),
  release: jest.fn()
};

// Create mocked pool
const mockedPool = new Pool();
mockedPool.connect = jest.fn().mockReturnValue(mockedClient);

describe("Transaction", () => {
  beforeEach(() => {
    // Clear mocks
    mockedClient.query.mockClear();
    mockedClient.release.mockClear();
    (<jest.Mock<{}>>mockedPool.connect).mockClear();
  });

  it("can be started & retrived from within callback", async done => {
    await Transaction.startTransaction(mockedPool, () => {
      const transaction = Transaction.get();
      expect(transaction.client).toBe(mockedClient);
      expect(transaction.id.length).toEqual(36);
      done();
    });
  });

  it("can be started & retrived from deep within callback", async done => {
    const expectations = () => {
      const transaction = Transaction.get();
      expect(transaction.client).toBe(mockedClient);
      expect(transaction.id.length).toEqual(36);
      done();
    };

    await Transaction.startTransaction(mockedPool, () => {
      Promise.resolve().then(() => {
        setTimeout(() => {
          process.nextTick(() => {
            Promise.resolve().then(() => {
              setTimeout(() => {
                process.nextTick(expectations);
              }, 0);
            });
          });
        }, 0);
      });
    });
  });

  it("should COMMIT on a successfully finishing callback", async () => {
    await Transaction.startTransaction(mockedPool, () => {});

    expect(mockedClient.query).toHaveBeenCalledTimes(2);
    expect(mockedClient.query.mock.calls[0][0]).toEqual("BEGIN"); // first arguement of the first call
    expect(mockedClient.query).lastCalledWith("COMMIT");
  });

  it("should ROLLBACK when an error is thrown from the callback", async () => {
    await expect(
      Transaction.startTransaction(mockedPool, () => {
        throw new Error("Expected Test Error");
      })
    ).rejects.toThrow("Expected Test Error");

    expect(mockedClient.query).toHaveBeenCalledTimes(2);
    expect(mockedClient.query.mock.calls[0][0]).toEqual("BEGIN"); // first arguement of the first call
    expect(mockedClient.query).lastCalledWith("ROLLBACK");
  });

  describe("ResponseManagedTransaction", () => {
    it("should COMMIT when a response successfully finishes", async done => {
      // Create a server & start a ResponseManagedTransaction on request
      const server = http.createServer(async (req, res) => {
        Transaction.startResponseManagedTransaction(
          mockedPool,
          res,
          () => {}
        ).then(() => {
          res.end();
        });
      });

      // Make a request to the server
      server.listen(function onListening() {
        const port = this.address().port;
        http.get("http://localhost:" + port, function onResponse(res) {
          server.close();
          expect(mockedClient.query).toHaveBeenCalledTimes(2);
          expect(mockedClient.query.mock.calls[0][0]).toEqual("BEGIN"); // first arguement of the first call
          expect(mockedClient.query).lastCalledWith("COMMIT");
          done();
        });
      });
    });

    it("should ROLLBACK when a response finishes with a 400+ status code", async done => {
      // Create a server & start a ResponseManagedTransaction on request
      const server = http.createServer(async (req, res) => {
        Transaction.startResponseManagedTransaction(
          mockedPool,
          res,
          () => {}
        ).then(() => {
          res.statusCode = 400;
          res.end();
        });
      });

      // Make a request to the server
      server.listen(function onListening() {
        const port = this.address().port;
        http.get("http://localhost:" + port, function onResponse(res) {
          server.close();
          expect(mockedClient.query).toHaveBeenCalledTimes(2);
          expect(mockedClient.query.mock.calls[0][0]).toEqual("BEGIN"); // first arguement of the first call
          expect(mockedClient.query).lastCalledWith("ROLLBACK");
          done();
        });
      });
    });
  });

  describe("createPGPool", () => {
    it("should create a PG Pool", () => {
      const consoleSpy = jest.spyOn(global.console, "error");
      const pool = createPGPool({});
      pool.emit("error", "Expected Test Error");
      expect(consoleSpy).toBeCalled();
    });
  });
});

// yarn build && ../node_modules/jest/bin/jest.js transaction.test.ts
