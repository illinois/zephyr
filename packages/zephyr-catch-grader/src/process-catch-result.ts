import { ITestCaseResult } from '@illinois/zephyr-grader-base';
import { ICatchTestCaseResult } from './grader';
import processCatchXML from './process-catch-xml';

export default function(result: ICatchTestCaseResult): ITestCaseResult {
    if (result.tags.make) {
      // Record `make` output:
      return {
        name: 'Output from `make`',
        tags: result.tags,
        success: (result.exitCode === 0),
        weight: 0,
        earned: 0,
        output: result.stdout,
        message: result.stderr,
      };
    } else if (result.error) {
      let error;
      if (result.error.code === 'ETIMEDOUT') {
        error = `Unable to Grade (ETIMEDOUT): Your code did not finish within ${result.tags.timeout}ms.`;
      } else if (result.error.code === 'ENOBUFS') {
        error = 'Unable to Grade (ENOBUFS): Your code had over 1 MB of output, exceeding the allowed buffer space.';
      } else {
        error = `Unable to Grade (error): ${JSON.stringify(result.error)}`;
      }

      return {
        name: result.name,
        tags: result.tags,
        success: false,
        weight: result.tags.weight,
        earned: 0,
        output: error,
      };
    } else if (result.tags.valgrind) {
      // Record `valgrind` output:
      return {
        name: result.name,
        tags: result.tags,
        success: (result.exitCode === 0),
        weight: result.tags.weight,
        earned: (result.exitCode === 0) ? result.tags.weight : 0,
        output: result.stderr,
      };
    } else {
      const testCase = processCatchXML(result);
      if (testCase) {
        testCase.name = result.name;

        if (result.tags.extraCredit && testCase.success) {
          testCase.extraCredit = 1;
        } else {
          testCase.extraCredit = 0;
        }
      }
      return testCase;
    }
}
