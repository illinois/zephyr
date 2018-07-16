/* eslint-env jest */

const { default: mockFs } = require('jest-plugin-fs');
const octokit = require('../src/octokit');
const checkout = require('../src/checkout');

const MOCK_COMMITS_SHA = 'fedcba';
const MOCK_REFERENCE_SHA = 'abcdef';

jest.mock('fs', () => require('jest-plugin-fs/mock'));
jest.mock('request-promise-native', () => {
  return jest.fn(() => Promise.resolve('content'));
});
jest.mock('../src/octokit', () => {
  const mockGithubFiletree = require('./util/mock-github-filetree')();
  const getContentMock = jest.fn().mockImplementation(async (opts) => {
    const data = await mockGithubFiletree(opts);
    return Promise.resolve({ data });
  });
  const getCommitsMock = () => Promise.resolve({
    data: [{ sha: MOCK_COMMITS_SHA }]
  });
  const getReferenceMock = () => Promise.resolve({
    data: { object: { sha: MOCK_REFERENCE_SHA } }
  });
  const mock = jest.fn(() => {
    return {
      repos: {
        getContent: getContentMock,
        getCommits: getCommitsMock,
      },
      gitdata: {
        getReference: getReferenceMock,
      }
    };
  });
  return mock;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.mock();
});

afterEach(() => {
  mockFs.restore();
});

// We need a fake github to respond to our requests!
// We'll build a fake file tree and then mock the GitHub API to "serve" it to us


describe('checkout', () => {
  it('checks out the entire repo', async () => {
    const options = {
      repoPath: '',
      checkoutPath: '/test',
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/.gitignore': 'content',
      '/test/mp1/mp1.cpp': 'content',
      '/test/mp1/tests/test1.cpp': 'content',
      '/test/mp1/tests/test2.cpp': 'content',
      '/test/mp2/file.txt': 'content'
    });
  });

  it('checks out the .gitignore file', async () => {
    const options = {
      repoPath: '',
      checkoutPath: '/test',
      files: ['.gitignore'],
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/.gitignore': 'content',
    });
  });

  it('checks out the mp1 directory', async () => {
    const options = {
      repoPath: 'mp1',
      checkoutPath: '/test',
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/mp1.cpp': 'content',
      '/test/tests/test1.cpp': 'content',
      '/test/tests/test2.cpp': 'content',
    });
  });

  it('checks out specific files in the mp1 directory', async () => {
    const options = {
      repoPath: 'mp1',
      checkoutPath: '/test',
      files: ['mp1.cpp'],
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/mp1.cpp': 'content',
    });
  });

  it ('uses the provided timestamp to determine which revision to fetch', async () => {
    const options = {
      repoPath: 'mp1',
      checkoutPath: '/test',
      timestamp: '2017-10-01T01:54:55+00:00'
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_COMMITS_SHA);
    expect(mockFs.files()).toEqual({
      '/test/mp1.cpp': 'content',
      '/test/tests/test1.cpp': 'content',
      '/test/tests/test2.cpp': 'content',
    });
  });

  it('pins all request to the same ref (no timestamp)', async () => {
    const options = {
      repoPath: 'mp1',
      checkoutPath: '/test',
    };

    await checkout(options);
    octokit().repos.getContent.mock.calls.forEach(call => {
      expect(call[0].ref).toEqual(MOCK_REFERENCE_SHA);
    });
  });

  it('pins all request to the same ref (with timestamp)', async () => {
    const options = {
      repoPath: 'mp1',
      checkoutPath: '/test',
      timestamp: '2017-10-01T01:54:55+00:00'
    };

    await checkout(options);
    octokit().repos.getContent.mock.calls.forEach(call => {
      expect(call[0].ref).toEqual(MOCK_COMMITS_SHA);
    });
  });
});
