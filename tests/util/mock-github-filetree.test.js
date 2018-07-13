/* eslint-env jest */
const mockGithubFiletree = require('./mock-github-filetree')();

describe('mock-github-filetree', () => {
  it('responds with the root directory (empty string)', async () => {
    const files = await mockGithubFiletree({ path: '' });
    console.log(files);
  });

  it('responds with the root directory (/)', async () => {
    const files = await mockGithubFiletree({ path: '/' });
    console.log(files);
  });
});
