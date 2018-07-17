declare module 'jest-plugin-fs' {
  export function restore(): void
  export function files(): {
    [name: string]: string
  }
  export function mock(): void
}