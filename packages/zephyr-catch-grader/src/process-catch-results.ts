import { ITestCaseResult } from '@illinois/zephyr-grader-base';
import { ICatchTestCaseResult } from './grader';
import processCatchResult from './process-catch-result';

export default async function(results: ICatchTestCaseResult[]): Promise<ITestCaseResult[]> {
  return await Promise.all(results.map(processCatchResult));
}
