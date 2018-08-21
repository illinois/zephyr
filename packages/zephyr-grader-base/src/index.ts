import { Subject } from "rxjs";

export interface ITestCaseInfo {
  name: string;
  tags: {
    [name: string]: any;
  }
}

export interface ITestCaseResult {
  name: string;
  tags: {
    [name: string]: any;
  }
  success: boolean;
  weight: number;
  earned: number;
  extraCredit?: number;
  output?: string;
  message?: string;
}

export interface IScore {
  totalWeight: number;
  totalEarned: number;
  extraCredit: number;
  score: number;
}

export interface IGraderOptions {
  cwd: string;
  execCommand?: string;
}

export interface IGraderResults {
  score: IScore;
  tests: ITestCaseResult[];
}

export interface IGraderProgress {
  event: IGraderProgressEventType;
  data: any;
}

export interface IGraderProgressStart extends IGraderProgress {
  event: "start";
  data: ITestCaseInfo;
}

export interface IGraderProgressFinish extends IGraderProgress {
  event: "finish";
  data: ITestCaseResult;
}

export type IGraderProgressEventType = "start" | "finish";

export type Grader = (options: IGraderOptions, progressObservable?: Subject<IGraderProgress>) => Promise<IGraderResults[]>;
