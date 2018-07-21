/* eslint-env jest */

import mockFs from 'jest-plugin-fs';
import Octokit from '@octokit/rest';
import checkout, { ICheckoutOptions } from '../src/index';

const MOCK_COMMITS_SHA = 'fedcba';
const MOCK_REFERENCE_SHA = 'abcdef';

jest.mock('fs', () => require('jest-plugin-fs/mock'));
jest.mock('request-promise-native', () => {
  return jest.fn(() => Promise.resolve('content'));
});

const mockOctokit = (): Octokit => {
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
  // @ts-ignore: We don't need to mock out all of GitHub
  return {
    repos: {
      getContent: getContentMock,
      getCommits: getCommitsMock,
    },
    gitdata: {
      getReference: getReferenceMock,
    }
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockFs.mock();
});

afterEach(() => {
  mockFs.restore();
});

const REPO_OPTIONS = { owner: 'test', repo: 'test' };

describe('checkout', () => {
  it('checks out the entire repo', async () => {
    const options: ICheckoutOptions = {
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
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
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
      repoPath: '',
      checkoutPath: '/test',
      files: [{ name: '.gitignore', required: true }],
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/.gitignore': 'content',
    });
  });

  it('checks out the mp1 directory', async () => {
    const options = {
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
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
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
      repoPath: 'mp1',
      checkoutPath: '/test',
      files: [{ name: 'mp1.cpp', required: true }],
    };

    const sha = await checkout(options);
    expect(sha).toEqual(MOCK_REFERENCE_SHA);
    expect(mockFs.files()).toEqual({
      '/test/mp1.cpp': 'content',
    });
  });

  it ('uses the provided timestamp to determine which revision to fetch', async () => {
    const options = {
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
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

  it ('uses the provided timestamp to determine which revision to fetch', async () => {
    const options = {
      ...REPO_OPTIONS,
      octokit: mockOctokit(),
      repoPath: 'mp1',
      checkoutPath: '/test',
      ref: 'deadbeef'
    };

    const sha = await checkout(options);
    expect(sha).toEqual('deadbeef');
    expect(mockFs.files()).toEqual({
      '/test/mp1.cpp': 'content',
      '/test/tests/test1.cpp': 'content',
      '/test/tests/test2.cpp': 'content',
    });
  });

  it('pins all request to the same ref', async () => {
    const octokit = mockOctokit();
    const options = {
      ...REPO_OPTIONS,
      octokit,
      repoPath: 'mp1',
      checkoutPath: '/test',
    };

    await checkout(options);
    (octokit as any).repos.getContent.mock.calls.forEach((call: any) => {
      expect(call[0].ref).toEqual(MOCK_REFERENCE_SHA);
    });
  });

  it('pins all request to the same ref (with timestamp)', async () => {
    const octokit = mockOctokit();
    const options = {
      ...REPO_OPTIONS,
      octokit,
      repoPath: 'mp1',
      checkoutPath: '/test',
      timestamp: '2017-10-01T01:54:55+00:00'
    };

    await checkout(options);
    (octokit as any).repos.getContent.mock.calls.forEach((call: any) => {
      expect(call[0].ref).toEqual(MOCK_COMMITS_SHA);
    });
  });

  it('pins all request to the same ref (with ref)', async () => {
    const octokit = mockOctokit();
    const options = {
      ...REPO_OPTIONS,
      octokit,
      repoPath: 'mp1',
      checkoutPath: '/test',
      ref: 'deadbeef'
    };

    await checkout(options);
    (octokit as any).repos.getContent.mock.calls.forEach((call: any) => {
      expect(call[0].ref).toEqual('deadbeef');
    });
  });
});
