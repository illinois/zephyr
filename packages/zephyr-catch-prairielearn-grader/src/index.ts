import catchGrade from '@illinois/zephyr-catch-grader'

(async () => {
  const graderOptions = {
    cwd: '/grade/run/',
    execCommand: './tests',
  };

  const res = await catchGrade(graderOptions);

  // We need to massage the results into PrairieLearn's expected format
  let gradingResult;

  // If the first test case has the tag "make" and it failed, we'll special-case it
  // to display an error message
  const firstTest = res.tests[0];
  if (firstTest.tags.make === true && firstTest.success === false) {
    // Rip, compilation failed
    gradingResult = {
      succeeded: false,
      score: 0.0,
      message: 'Compilation failed',
      output: firstTest.output,
    }
  } else {
    gradingResult = {
      succeeded: true,
      score: res.score.score || 0,
      tests: res.tests.map((test) => {
        return {
          name: test.name,
          max_points: test.weight,
          points: test.earned,
          output: test.output,
          message: test.message,
          success: test.success,
        }
      })
    };
  }

  console.error(res)
  console.error(gradingResult);

  console.log(JSON.stringify(gradingResult));
})();
