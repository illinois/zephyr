import processCatchXML from './process-catch-xml';
import { TestCaseResult, TestCase } from './types';

export default async function (results: Array<TestCaseResult>) {
  const testCases: Array<TestCase> = [];

  for (const result of results) {
    if (result.tags.make) {
      // Record `make` output:
      testCases.push({
        name: 'Output from `make`',
        success: (result.exitCode == 0),
        weight: 0,
        earned: 0,
        output: result.stdout,
        message: result.stderr
      });
    } else if (result.tags.valgrind) {
      // Record `valgrind` output:
      testCases.push({
        name: result.name,
        success: (result.exitCode == 0),
        weight: result.tags.weight,
        earned: (result.exitCode == 0) ? result.tags.weight : 0,
        output: result.stdout,
        message: result.stderr
      });
    } else if (result.error) {
      let error;
      if (result.error.code === 'ETIMEDOUT') {
        error = `Unable to Grade (ETIMEDOUT): Your code did not finish within ${result.tags.timeout}ms.`;
      } else if (result.error.code === 'ENOBUFS') {
        error = 'Unable to Grade (ENOBUFS): Your code had over 1 MB of output, exceeding the allowed buffer space.';
      } else {
        error = `Unable to Grade (error): ${JSON.stringify(result.error)}`;
      }

      testCases.push({
        name: result.name,
        success: false,
        weight: result.tags.weight,
        earned: 0,
        output: error,
        message: result.stderr
      });

    } else {
      const testCase = await processCatchXML(result);
      if (testCase) {
        testCase.name = result.name;

        if (result.tags.extraCredit && testCase.success) {
          testCase.extraCredit = 1;
        } else {
          testCase.extraCredit = 0;
        }
        testCases.push(testCase);
      }
    }
  }

  return testCases;
};
