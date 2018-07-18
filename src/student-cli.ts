#!/usr/bin/env node

import 'babel-polyfill';
import grader from './grader';
import { Subject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import processCatchResult from './process-catch-result';
import processCatchResults from './process-catch-results';
import computeScore from './compute-score';

// Top-level async/await hack
(async () => {
  const options: GraderOptions = { cwd: '.' };
  const progressObservable = new Subject<GraderProgress>();

  progressObservable.pipe(
    filter(p => p.event === 'start'),
    map(p => p.data.name)
  ).subscribe((name) => console.log(`Start ${name}`));

  progressObservable.pipe(
    filter(p => p.event === 'finish'),
    map(p => processCatchResult(p.data))
  ).subscribe((data) => console.log(`Finish ${data.name}`));

  const results = await grader(options, progressObservable);
  const processedResults = await processCatchResults(results);
  const score = computeScore(processedResults);
  console.log(`Score: ${(score.score * 100).toFixed(2)}%`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
