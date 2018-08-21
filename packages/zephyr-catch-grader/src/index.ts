import { IGraderOptions, IGraderProgress, IGraderResults } from '@illinois/zephyr-grader-base';
import { Subject } from 'rxjs';
import grader from './grader';
import processCatchResult from './process-catch-result';
import computeScore from './compute-score';

export { ICatchTestCaseResult } from './grader';

// This is just a helpful utility to both grade and process the results at the same time
export default async (
  options: IGraderOptions,
  progressObservable?: Subject<IGraderProgress>,
): Promise<IGraderResults> => {
  const testCaseResults = await grader(options, progressObservable);
  const tests =  await Promise.all(testCaseResults.map(processCatchResult));
  const score = computeScore(tests);
  return { score, tests };
};

export { default as computeScore } from './compute-score';
export { default as grader } from './grader';
export { default as processCatchResult} from './process-catch-result';
export { default as processCatchXml } from './process-catch-xml';
