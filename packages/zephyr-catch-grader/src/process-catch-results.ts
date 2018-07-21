import processCatchResult from './process-catch-result';
import { ITestCase, ITestCaseResult } from './grader';

export default async function(results: ITestCaseResult[]): Promise<ITestCase[]> {
  return await Promise.all(results.map(processCatchResult));
}
