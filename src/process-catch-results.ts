import processCatchResult from './process-catch-result';

export default async function(results: ITestCaseResult[]): Promise<ITestCase[]> {
  return await Promise.all(results.map(processCatchResult));
}
