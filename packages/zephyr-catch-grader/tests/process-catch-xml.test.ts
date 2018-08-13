/* eslint-env jest */
import { readFileSync } from 'fs-extra';
import { ITestCaseResult } from '@illinois/zephyr-grader-base';
import { ICatchTestCaseResult } from '../src/grader';
import path from 'path';
import processCatchXml from '../src/process-catch-xml';

const NAME = 'process-catch-xml-test';

const fixturesPath = path.join(__dirname, '__fixtures__', 'process-catch-xml');
const loadFixture = (name: string): string => {
  return readFileSync(path.join(fixturesPath, `${name}.xml`), { encoding: 'utf8' });
};

const makeResult = (xml: string) => ({
  name: NAME,
  tags: { weight: 1 },
  stdout: xml,
});

const checkFailedResult = (result: ITestCaseResult) => {
  expect(result.name).toEqual(NAME);
  expect(result.success).toEqual(false);
  expect(result.weight).toEqual(1);
  expect(result.earned).toEqual(0);
};

describe('process-catch-results', () => {
  it('parses a successful result', async () => {
    const xml = loadFixture('successful');
    const result = await processCatchXml(makeResult(xml) as ICatchTestCaseResult);
    expect(result.name).toEqual(NAME);
    expect(result.success).toEqual(true);
    expect(result.weight).toEqual(1);
    expect(result.earned).toEqual(1);
  });

  it('fails for invalid XML', async () => {
    const xml = loadFixture('invalid');
    const result = await processCatchXml(makeResult(xml));
    checkFailedResult(result);
    expect(result.output).toEqual('Error: Unable to read buffer.');
  });

  it('handles a missing test case', async () => {
    const xml = loadFixture('missing-test-case');
    const result = await processCatchXml(makeResult(xml));
    checkFailedResult(result);
    expect(result.output).toEqual('Error: No `catch` TestCase found.');
  });

  it('parses a result with a fatal error', async () => {
    const xml = loadFixture('fatal-error');
    const result = await processCatchXml(makeResult(xml));
    checkFailedResult(result);
    expect(result.output).toEqual('Fatal Error: SIGSEGV - Segmentation violation signal');
  });

  it('parses a result with an exception', async () => {
    const xml = loadFixture('exception');
    const result = await processCatchXml(makeResult(xml));
    checkFailedResult(result);
    expect(result.output).toEqual('Exception: std::bad_alloc');
  });

  it('formats the failing expression in the output', async () => {
    const original = '*actualOutput == solnImage';
    const expanded = `PNG(w=5001, h=5001, hash=3fe0000000000000)
==
PNG(w=5001, h=5001, hash=3fe0000000000000)`;
    const xml = loadFixture('failing-expression');
    const result = await processCatchXml(makeResult(xml));
    checkFailedResult(result);
    expect(result.output).toEqual(`Original: ${original}\nExpanded: ${expanded}`);
  });
});
