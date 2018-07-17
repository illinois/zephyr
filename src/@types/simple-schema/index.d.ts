declare module 'simpl-schema' {
  class SimpleSchema {
    constructor(schema: any)
    validate(object: any): void
  }
  export = SimpleSchema;
}