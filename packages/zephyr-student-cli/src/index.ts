#!/usr/bin/env node

import 'babel-polyfill';

import grader, { IGraderOptions, IGraderProgress, IGraderProgressFinish, ITestCase, IGraderProgressStart, processCatchResult } from '@illinois/zephyr-catch-grader';
import chalk from 'chalk';
import ora from 'ora';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';


import { indentWithString } from './indent-string';

// Top-level async/await hack
(async () => {
  const options: IGraderOptions = { cwd: '.' };
  const progressObservable = new Subject<IGraderProgress>();

  // No Ora type was exported, so we have to be a bit hacky
  const typedOra = ora();
  let spinner: typeof typedOra;

  progressObservable.pipe<string>(
    filter((p) => p.event === 'start'),
    map((p: IGraderProgressStart) => p.data.name),
  ).subscribe((name) => {
    spinner = ora(name).start();
  });

  const indent = indentWithString('  > ');

  progressObservable.pipe<ITestCase>(
    filter((p) => p.event === 'finish'),
    map((p: IGraderProgressFinish) => processCatchResult(p.data)),
  ).subscribe((data) => {
    if (spinner) {
      const spinnerMethod = data.success ? spinner.succeed : spinner.fail;
      const color = data.success ? chalk.green : chalk.red;
      spinnerMethod.call(spinner, color(`[${data.earned}/${data.weight}] ${data.name}`));

      if (!data.success && data.output) {
        console.error(indent(data.output));
      }
    }
  });

  const { score } = await grader(options, progressObservable);
  const percentScore = (score.score * 100).toFixed(2);
  console.log();
  console.log(`Score: ${score.totalEarned}/${score.totalWeight} (${percentScore}%)`);

  if (score.totalEarned !== score.totalWeight) {
    console.log();
    console.log(chalk.bold('Please run the Catch tests directly for more detailed info on failing tests!'));
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
