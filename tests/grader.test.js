/* eslint-env jest */
const path = require('path');
const { withDir } = require('tmp-promise');
const MergeTrees = require('merge-trees');
const grader = require('../src/grader');

const getFixtureDirectory = (name) => path.join(__dirname, '__fixtures__', 'grader', name);

const withTestFixture = (name, fn) => {
  return withDir(async ({ path }) => {
    const mergeTrees = new MergeTrees(
      [getFixtureDirectory('base'), getFixtureDirectory(name)],
      path
    );
    mergeTrees.merge();
    const options = { cwd: path };
    const results = await grader(options);
    await fn({ results, path });
  }, { unsafeCleanup: true });
};

describe('grader', () => {
  it('grades successful code with one test case', async () => {
    await withTestFixture('passing', ({ results }) => {
      expect(results.length).toBe(2);
      results.forEach(result => expect(result.exitCode).toBe(0));

      // Make phase
      expect(results[0].name).toEqual('make');
      expect(results[0].tags.make).toBe(true);

      // First test case
      expect(results[1].name).toEqual('add_numbers correctly adds two numbers');
      expect(results[1].tags).toEqual({ weight: 1, timeout: 10000 });
    });
  }, 10000);

  it.only('grades code that times out with timeout set via tag', async () => {
    await withTestFixture('timeout-tag', async ({ results }) => {
      console.log(results);
    });
  }, 10000);
});
