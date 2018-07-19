import processCatchResult from './process-catch-result';

export default async function(results: TestCaseResult[]): Promise<TestCase[]> {
  return await Promise.all(results.map(processCatchResult));
}
