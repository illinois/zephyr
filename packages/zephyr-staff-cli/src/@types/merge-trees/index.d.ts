declare module 'merge-trees' {
    class MergeTrees {
      constructor(srcDirs: string[], destDir: string, opts?: any)
      public merge(): void;
    }
    export = MergeTrees;
  }
