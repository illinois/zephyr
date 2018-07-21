/*interface IScore {
    totalWeight: number;
    totalEarned: number;
    extraCredit: number;
    score: number;
  }
  
  interface IGraderResult {
    netid: string;
    timestamp: string;
    sha: string;
    success: boolean;
    testCases: ITestCase[];
    testCaseResults: ITestCaseResult[];
    errors?: string[];
  }
  
  interface IStudentGraderResults {
    [netid: string]: IGraderResult;
  }
  
  interface ITestCase {
    name: string;
    success: boolean;
    weight: number;
    earned: number;
    extraCredit?: number;
    output?: string;
    message?: string;
  }
  

  

  

  

  

  
  interface ICheckoutOptions {
    owner: string;
    repo: string;
    repoPath: string;
    checkoutPath: string;
    files?: IStudentFile[];
    ref?: string;
    timestamp?: string;
  }
  
  interface IGraderOptions {
    cwd: string;
    execCommand?: string;
  }
  
  interface IGradebook {
    [netid: string]: IScore;
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
  */

interface IOptions {
  graded: boolean;
  assignment: string;
  run: string;
  id: string;
  assignmentRoot: string;
  cleanup: boolean;
  netid?: string;
  ['run-one']: boolean;
  ['skip-ews-check']: boolean;
  resume: boolean;
  outputPath: string;
  timestamp: string;
  ref: string;
}

interface IStudentFile {
  name: string;
  required: boolean;
}

interface IAssignmentConfig {
  studentFiles: IStudentFile[];
  baseFilePaths: string[];
  exportFiles: string[];
  assignmentPath: string;
}

interface IGithubConfig {
  host: string;
  owner: string;
}

interface IRepoConfig extends IGithubConfig {
  repo: string;
}

interface ICourseConfig {
  assignments: IRepoConfig;
  submissions: IGithubConfig;
  grades: IRepoConfig;
  feedback: IRepoConfig;
  roster: string[];
}