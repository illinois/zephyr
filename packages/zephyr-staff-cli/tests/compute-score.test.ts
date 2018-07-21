/* eslint-env jest */

import computeScore from '../src/compute-score';

const testCase = (success: boolean, weight: number, extraCredit?: number) => ({
  name: 'test',
  earned: success ? weight: 0,
  success,
  weight,
  extraCredit
});

describe('compute-score', () => {
  it('handles empty test cases', () => {
    const score = computeScore([]);
    expect(score.score).toBe(0);
    expect(score.totalEarned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case', () => {
    const score = computeScore([testCase(true, 1)]);
    expect(score.score).toBe(1);
    expect(score.totalWeight).toBe(1);
    expect(score.totalEarned).toBe(1);
    expect(score.extraCredit).toBe(0);
  });

  it('handles multiple successful test cases', () => {
    const score = computeScore([testCase(true, 1), testCase(true, 5)]);
    expect(score.score).toBe(1);
    expect(score.totalWeight).toBe(6);
    expect(score.totalEarned).toBe(6);
    expect(score.extraCredit).toBe(0);
  });

  it('handles a single successful test case with extra credit', () => {
    const score = computeScore([testCase(true, 1, 2)]);
    expect(score.score).toBe(1);
    expect(score.totalWeight).toBe(1);
    expect(score.totalEarned).toBe(1);
    expect(score.extraCredit).toBe(2);
  });

  it('handles a single failed test case', () => {
    const score = computeScore([testCase(false, 1)]);
    expect(score.score).toBe(0);
    expect(score.totalWeight).toBe(1);
    expect(score.totalEarned).toBe(0);
    expect(score.extraCredit).toBe(0);
  });
});
