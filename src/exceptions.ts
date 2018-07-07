export abstract class ApplicationException extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.status = 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class MultipleRecordsFoundException extends ApplicationException {
  constructor(message: string) {
    super(message);
    this.status = 500;
  }
}

export class RecordNotFoundException extends ApplicationException {
  constructor(message: string) {
    super(message);
    this.status = 404;
  }
}
