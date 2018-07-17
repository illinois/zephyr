import fs from 'fs-extra';
import { promisify } from 'util';
import path from 'path';
const debug = require('debug')('zephyr:output-formatter');
import octokit from './octokit';
import { Score, Gradebook, CourseConfig, Options } from './types';
const csvStringify = promisify(require('csv-stringify'));

export default async function(gradebook: Gradebook, courseConfig: CourseConfig, options: Options) {
  const csvRows: (string|number)[][] = [];

  // Headers
  csvRows.push(['netid', 'score', 'error', 'ec']);

  Object.keys(gradebook).forEach(netid => {
    const { pct100, errors, extraCredit } = gradebook[netid];
    const joinedErrors = (errors || []).join(';');
    csvRows.push([netid, pct100, joinedErrors, extraCredit]);
  });

  const csv = await csvStringify(csvRows);

  // Write file to disk
  debug(`Saving gradebook report: ${path.join(options.outputPath, `${options.id}.csv`)}`);
  fs.writeFileSync(path.join(options.outputPath, `${options.id}.csv`), csv);

  // Write file to git (graded runs)
  if (options.graded) {
    await octokit().repos.createFile({
      owner: courseConfig.grades.org,
      repo: courseConfig.grades.repo as string,
      path: `${options.id}.csv`,
      message: 'autograder generated feedback file',
      content: Buffer.from(csv).toString('base64')
    });

    debug('Saved gradebook CSV on git.');
  }
};
