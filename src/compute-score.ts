export default (results: TestCase[]): Score => {
  const score = {
    totalWeight: 0,
    totalEarned: 0,
    extraCredit: 0,
    score: 0,
  } as Score;

  results.forEach((testCase) => {
    score.totalWeight += testCase.weight;
    if (testCase.success) {
      score.totalEarned += testCase.weight;
    }
    if (testCase.extraCredit) {
      score.extraCredit += testCase.extraCredit;
    }
  });

  if (score.totalWeight > 0) {
    score.score = score.totalEarned / score.totalWeight;
  }

  return score;
};
