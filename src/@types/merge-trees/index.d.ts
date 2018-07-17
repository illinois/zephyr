declare module 'merge-trees' {
    class MergeTrees {
      constructor(srcDirs: Array<string>, destDir: string, opts?: any)
      merge(): void
    }
    export = MergeTrees;
  }