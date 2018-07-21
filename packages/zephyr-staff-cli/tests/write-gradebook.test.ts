/* eslint-env jest */
import mockFsControl, { mock as fs } from 'jest-plugin-fs';
import writeGradebook from '../src/write-gradebook';
import { IGradebook } from '../src/generate-reports';
import { IScore } from '@illinois/zephyr-catch-grader';

jest.mock('fs', () => require('jest-plugin-fs/mock'));
jest.mock('../src/octokit', () => {
  const createFileMock = jest.fn(() => Promise.resolve());
  const mock = jest.fn(() => {
    return {
      repos: {
        createFile: createFileMock,
      },
    };
  });
  (mock as any).__createFileMock = createFileMock;
  return mock;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFsControl.mock();
});

afterEach(() => {
  mockFsControl.restore();
});

const makeGradebook = (extra = {}): IGradebook => ({
  nwalter2: {
    score: 0.7,
    extraCredit: 2,
    ...extra,
  } as IScore,
});

// @ts-ignore: I know what I'm doing!
const makeCourseConfig = (): ICourseConfig => ({
  grades: {
    org: 'cs225',
    repo: 'grades_fa18',
  },
});

// @ts-ignore: I know what I'm doing!
const makeOptions = (extra = {}): IOptions => ({
  outputPath: '/',
  id: 'testing',
  graded: false,
  ...extra,
});

describe('writeGradebook', () => {
  it('writes an empty gradebook', async () => {
    const gradebook = {};
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as ICourseConfig, options as IOptions);

    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual('netid,score,ec\n');
  });

  it('writes a gradebook without errors', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as ICourseConfig, options as IOptions);

    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual('netid,score,ec\nnwalter2,70.00,2\n');
  });

  it('does not upload to GitHub if this is not a graded run', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as ICourseConfig, options as IOptions);

    const { __createFileMock } = require('../src/octokit');
    expect(__createFileMock).not.toBeCalled();
  });

  it('uploads to GitHub if this is a graded run', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions({ graded: true });

    await writeGradebook(gradebook, courseConfig as ICourseConfig, options as IOptions);

    const { __createFileMock } = require('../src/octokit');
    expect(__createFileMock).toBeCalled();
  });
});
