/* eslint-env jest */

import computeScore from '../src/compute-score';
import { GraderResult, TestCase } from '../src/types';

const testCase = (success: boolean, weight: number, extraCredit?: number) => ({
  name: 'test',
  earned: success ? weight: 0,
  success,
  weight,
  extraCredit
});

const makeGraderResult = (...testCases: Array<TestCase>): GraderResult => ({
  netid: 'waf',
  timestamp: 'now',
  sha: 'deadbeef',
  success: true,
  testCases,
  testCaseResults: [],
  errors: [],
})

describe('compute-score', () => {
  it('handles empty test cases', () => {
    const result = makeGraderResult();
    const score = computeScore(result);
    expect(score.pct).toBe(0);
    expect(score.earned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case', () => {
    const result = makeGraderResult(testCase(true, 1));
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(1);
    expect(score.extraCredit).toBe(0);
  });

  it('handles multiple successful test cases', () => {
    const result = makeGraderResult(testCase(true, 1), testCase(true, 5));
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(6);
    expect(score.earned).toBe(6);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case with extra credit', () => {
    const result = makeGraderResult(testCase(true, 1, 2));
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(1);
    expect(score.extraCredit).toBe(2);
  });

  it('handles a single failed test case', () => {
    const result = makeGraderResult(testCase(false, 1));
    const score = computeScore(result);
    expect(score.pct).toBe(0);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });
});
