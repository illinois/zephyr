/* eslint-env jest */

const computeScore = require('../src/compute-score');

const testCase = (success, weight, extraCredit = undefined) => ({ success, weight, extraCredit });

describe('compute-score', () => {
  it('handles empty test cases', () => {
    const result = {
      testCases: [],
    };
    const score = computeScore(result);
    expect(score.pct).toBe(0);
    expect(score.earned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case', () => {
    const result = { testCases: [testCase(true, 1)] };
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(1);
    expect(score.extraCredit).toBe(0);
  });

  it('handles multiple successful test cases', () => {
    const result = { testCases: [testCase(true, 1), testCase(true, 5)] };
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(6);
    expect(score.earned).toBe(6);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case with extra credit', () => {
    const result = { testCases: [testCase(true, 1, 2)] };
    const score = computeScore(result);
    expect(score.pct).toBe(1);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(1);
    expect(score.extraCredit).toBe(2);
  });

  it('handles a single failed test case', () => {
    const result = { testCases: [testCase(false, 1)] };
    const score = computeScore(result);
    expect(score.pct).toBe(0);
    expect(score.weight).toBe(1);
    expect(score.earned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });
});
