/**
 * Defines the Attribute storage class that is used by each Model.
 * Allows for dirty checking.
 */
class Attribute {
  name: string;
  isDirty: boolean;
  private _value: any;

  constructor(name: string, value: any) {
    this.name = name;
    this._value = value;
    this.isDirty = true;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    if (value !== this._value) {
      this.isDirty = true;
      this._value = value;
    }
  }
}

export default Attribute;
