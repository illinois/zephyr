import { Subject } from 'rxjs';
import grader from './grader';
import processCatchResult from './process-catch-result';

// This is just a helpful utility to both grade and process the results at the same time
export default async (
  options: IGraderOptions,
  progressObservable?: Subject<IGraderProgress>,
): Promise<ITestCase[]> => {
  const testCaseResults = await grader(options, progressObservable);
  return await Promise.all(testCaseResults.map(processCatchResult));
};

export { default as grader } from './grader';
export { default as processCatchResult} from './process-catch-result';
export { default as processCatchXml } from './process-catch-xml';
