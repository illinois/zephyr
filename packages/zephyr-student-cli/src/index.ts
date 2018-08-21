#!/usr/bin/env node

import 'babel-polyfill';

import grader, { processCatchResult } from '@illinois/zephyr-catch-grader';
import { 
  IGraderOptions, IGraderProgress, IGraderProgressStart, IGraderProgressFinish, ITestCaseResult 
} from '@illinois/zephyr-grader-base';
import chalk from 'chalk';
import ora from 'ora';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';


import { indentWithPad } from './indent-string';

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

  const indent2 = indentWithPad(2);
  const indent4 = indentWithPad(4);

  progressObservable.pipe<ITestCaseResult>(
    filter((p) => p.event === 'finish'),
    map((p: IGraderProgressFinish) => processCatchResult(p.data)),
  ).subscribe((data) => {
    if (spinner) {
      const spinnerMethod = data.success ? spinner.succeed : spinner.fail;
      const color = data.success ? chalk.green : chalk.red;
      spinnerMethod.call(spinner, color(`[${data.earned}/${data.weight}] ${data.name}`));

      if (!data.success) {
        if (data.output) {
          console.error(indent2(chalk.bold('Output')))
          console.error(indent4(data.output));
        }
        if (data.message) {
          console.error(indent2(chalk.bold('Message')))
          console.error(indent4(data.message));
        }
      }
    }
  });

  const { score } = await grader(options, progressObservable);
  const percentScore = (score.score * 100).toFixed(2);
  console.log();
  console.log(`Score: ${score.totalEarned}/${score.totalWeight} (${percentScore}%)`);

  if (score.totalEarned !== score.totalWeight) {
    console.log();
    console.log(`Please run ${chalk.bold('make test')} and ${chalk.bold('test')} directly for more detailed info!`);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
