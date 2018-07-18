interface Score {
  totalWeight: number,
  totalEarned: number,
  extraCredit: number,
  score: number,
}

interface GraderResult {
  netid: string,
  timestamp: string,
  sha: string,
  success: boolean,
  testCases: Array<TestCase>,
  testCaseResults: Array<TestCaseResult>
  errors?: Array<string>,
}

interface StudentGraderResults {
  [netid: string]: GraderResult,
}

interface TestCase {
  name: string,
  success: boolean,
  weight: number,
  earned: number,
  extraCredit?: number,
  output?: string,
  message?: string,
}

interface RepoConfig {
  host: string,
  org: string,
  repo?: string
}

interface CourseConfig {
  assignments: RepoConfig,
  submissions: RepoConfig,
  grades: RepoConfig,
  feedback: RepoConfig,
  roster: Array<string>
}

interface AssignmentConfig {
  studentFiles: StudentFile[],
  baseFilePaths: string[],
  exportFiles: string[],
  assignmentPath: string,
}

interface Options {
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

interface StudentFile {
  name: string,
  required: boolean,
}

interface CheckoutOptions {
  org: string,
  repo: string,
  repoPath: string,
  checkoutPath: string,
  files?: StudentFile[],
  ref?: string,
  timestamp?: string,
}

interface GraderOptions {
  cwd: string,
  execCommand?: string,
}

interface Gradebook {
  [netid: string]: Score
}

interface TestCaseTags {
  [name: string]: any
}

interface TestCaseResult {
  name: string,
  tags: TestCaseTags,
  exitCode?: number | null,
  signal?: string,
  error?: any,
  stdout?: string,
  stderr?: string,
}

type GraderProgressEventType = 'start' | 'finish';

interface GraderProgress {
  event: GraderProgressEventType,
  data: any,
}

