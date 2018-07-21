declare module 'simpl-schema' {
  class SimpleSchema {
    constructor(schema: any)
    public validate(object: any): void;
  }
  export = SimpleSchema;
}
