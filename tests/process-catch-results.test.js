/* eslint-env jest */
const processCatchResults = require('../src/process-catch-results');

describe('process-catch-results', () => {
  it('returns an empty array for no results', async () => {
    expect(await processCatchResults({})).toEqual([]);
  });
});
