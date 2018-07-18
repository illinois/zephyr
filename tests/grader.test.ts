/* eslint-env jest */
import path from 'path';
import { withDir } from 'tmp-promise';
import MergeTrees from 'merge-trees';
import grader from '../src/grader';

const TEST_TIMEOUT = 15000; // 15 seconds

const getFixtureDirectory = (name: string) => path.join(__dirname, '__fixtures__', 'grader', name);

const withTestFixture = (name: string, fn: (results: Array<TestCaseResult>) => any) => {
  return withDir(async ({ path }) => {
    const mergeTrees = new MergeTrees(
      [getFixtureDirectory('base'), getFixtureDirectory(name)],
      path,
      { overwrite: true }
    );
    mergeTrees.merge();
    const options = { cwd: path };
    const results = await grader(options);
    fn(results);
  }, { unsafeCleanup: true });
};

describe('grader', () => {
  it('grades successful code with one test case', async () => {
    await withTestFixture('passing', (results) => {
      expect(results.length).toBe(2);
      results.forEach(result => expect(result.exitCode).toBe(0));

      // Make phase
      expect(results[0].name).toEqual('make');
      expect(results[0].tags.make).toBe(true);

      // First test case
      expect(results[1].name).toEqual('add_numbers correctly adds two numbers');
      expect(results[1].tags).toEqual({ weight: 1, timeout: 10000 });
    });
  }, TEST_TIMEOUT);

  it('grades code that times out with timeout set via tag', async () => {
    await withTestFixture('timeout-tag', (results) => {
      expect(results.length).toBe(2);

      // Make phase
      expect(results[0].name).toEqual('make');
      expect(results[0].tags.make).toBe(true);
      expect(results[0].exitCode).toBe(0);

      // First test case
      expect(results[1].name).toEqual('add_numbers correctly adds two numbers');
      expect(results[1].tags).toEqual({ weight: 1, timeout: 1000 });
      expect(results[1].exitCode).toBe(null);
      expect(results[1].signal).toEqual('SIGKILL');
      expect(results[1].error.code).toEqual('ETIMEDOUT');
    });
  }, TEST_TIMEOUT);

  it('grades code that produces too much output', async () => {
    await withTestFixture('too-much-output', (results) => {
      expect(results.length).toBe(2);

      // Make phase
      expect(results[0].name).toEqual('make');
      expect(results[0].tags.make).toBe(true);
      expect(results[0].exitCode).toBe(0);

      // First test case
      expect(results[1].name).toEqual('add_numbers correctly adds two numbers');
      expect(results[1].tags).toEqual({ weight: 1, timeout: 10000 });
      expect(results[1].exitCode).toBe(null);
      expect(results[1].signal).toEqual('SIGKILL');
      expect(results[1].error.code).toEqual('ENOBUFS');
    });
  }, TEST_TIMEOUT);
});
