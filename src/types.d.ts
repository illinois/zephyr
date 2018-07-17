export interface Score {
  weight: number,
  earned: number,
  extraCredit: number,
  pct: number,
  pct100: string,
  errors: Array<string>
}

export interface GraderResult {
  netid: string,
  timestamp: string,
  sha: string,
  success: boolean,
  testCases: Array<TestCase>,
  testCaseResults: Array<TestCaseResult>
  errors: Array<string>,
}

export interface StudentGraderResults {
  [netid: string]: GraderResult,
}

export interface TestCase {
  name: string,
  success: boolean,
  weight: number,
  earned: number,
  extraCredit?: number,
  output?: string,
  message?: string,
}

export interface RepoConfig {
  host: string,
  org: string,
  repo?: string
}

export interface CourseConfig {
  assignments: RepoConfig,
  submissions: RepoConfig,
  grades: RepoConfig,
  feedback: RepoConfig,
  roster: Array<string>
}

export interface AssignmentConfig {
  studentFiles: StudentFile[],
  baseFilePaths: string[],
  exportFiles: string[],
  assignmentPath: string,
}

export interface Options {
  graded: boolean,
  assignment: string,
  run: string,
  id: string,
  assignmentRoot: string,
  cleanup: boolean,
  netid?: string,
  ['run-one']: boolean,
  ['skip-ews-check']: boolean,
  resume: boolean,
  outputPath: string,
  timestamp: string,
  ref: string,
}

export interface StudentFile {
  name: string,
  required: boolean,
}

export interface CheckoutOptions {
  org: string,
  repo: string,
  repoPath: string,
  checkoutPath: string,
  files?: StudentFile[],
  ref?: string,
  timestamp?: string,
}

export interface GraderOptions {
  cwd: string,
  execCommand?: string,
}

export interface Gradebook {
  [netid: string]: Score
}

export interface TestCaseTags {
  [name: string]: any
}

export interface TestCaseResult {
  exitCode: number | null,
  signal: string,
  error?: any,
  name: string,
  tags: TestCaseTags,
  stdout: string,
  stderr: string,
}

