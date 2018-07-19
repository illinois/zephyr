/* eslint-env jest */
import mockFsControl, { mock as fs } from 'jest-plugin-fs';
import writeGradebook from '../src/write-gradebook';

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

const makeGradebook = (extra = {}): Gradebook => ({
  nwalter2: {
    score: 0.7,
    extraCredit: 2,
    ...extra,
  } as IScore,
});

const makeCourseConfig = () => ({
  grades: {
    org: 'cs225',
    repo: 'grades_fa18',
  },
});

const makeOptions = (extra = {}) => ({
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

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual('netid,score,error,ec\n');
  });

  it('writes a gradebook without errors', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual('netid,score,error,ec\nnwalter2,70,,2\n');
  });

  it('writes a gradebook with simple error', async () => {
    const gradebook = makeGradebook({ errors: ['testing'] });
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual('netid,score,error,ec\nnwalter2,70,testing,2\n');
  });

  it('writes a gradebook with complex errors', async () => {
    const gradebook = makeGradebook({ errors: ['could not grade, rip', 'please try again'] });
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    const expected = 'netid,score,error,ec\nnwalter2,70,"could not grade, rip;please try again",2\n';
    expect(fs.readFileSync('/testing.csv', 'utf8')).toEqual(expected);
  });

  it('does not upload to GitHub if this is not a graded run', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions();

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    const { __createFileMock } = require('../src/octokit');
    expect(__createFileMock).not.toBeCalled();
  });

  it('uploads to GitHub if this is a graded run', async () => {
    const gradebook = makeGradebook();
    const courseConfig = makeCourseConfig();
    const options = makeOptions({ graded: true });

    await writeGradebook(gradebook, courseConfig as CourseConfig, options as Options);

    const { __createFileMock } = require('../src/octokit');
    expect(__createFileMock).toBeCalled();
  });
});
