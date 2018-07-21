interface ITestCase {
  name: string;
  tags: {
    [name: string]: any;
  };
  success: boolean;
  weight: number;
  earned: number;
  extraCredit?: number;
  output?: string;
  message?: string;
}

interface IGraderOptions {
  cwd: string;
  execCommand?: string;
}

interface ITestCaseResult {
  name: string;
  tags: {
    [name: string]: any;
  };
  exitCode?: number | null;
  signal?: string;
  error?: any;
  stdout?: string;
  stderr?: string;
}

type IGraderProgressEventType = 'start' | 'finish';

interface IGraderProgress {
  event: IGraderProgressEventType;
  data: any;
}