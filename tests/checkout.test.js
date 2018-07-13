/* eslint-env jest */

const { default: mockFsControl, mock: fs } = require('jest-plugin-fs');
const checkout = require('../src/checkout');

jest.mock('fs', () => require('jest-plugin-fs/mock'));
jest.mock('../src/octokit', () => {

  const mock = jest.fn(() => {
    return {
      repos: {
        getContents: getContentsMock,
      },
      gitdata: {
        getReference: getReferenceMock,
        getCommits: getCommitsMock,
      }
    };
  });
  mock.__createFileMock = createFileMock;
  return mock;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFsControl.mock();
});

afterEach(() => {
  mockFsControl.restore();
});

// We need a fake github to respond to our requests!
// We'll build a fake file tree and then mock the GitHub API to "serve" it to us


describe('checkout', () => {
  it
});
