import Debug from 'debug';
import fs from 'fs-extra';
import path from 'path';
import { promisify } from 'util';
const debug = Debug('zephyr:output-formatter');
import csvStringify from 'csv-stringify/lib/sync';
import octokit from './octokit';

export default async function(gradebook: IGradebook, courseConfig: ICourseConfig, options: IOptions) {
  const csvRows: Array<Array<string|number>> = [];

  // Headers
  csvRows.push(['netid', 'score', 'ec']);

  Object.keys(gradebook).forEach((netid) => {
    const { score, extraCredit } = gradebook[netid];
    csvRows.push([netid, (score * 100).toFixed(2), extraCredit]);
  });

  const csv = csvStringify(csvRows);

  // Write file to disk
  debug(`Saving gradebook report: ${path.join(options.outputPath, `${options.id}.csv`)}`);
  fs.writeFileSync(path.join(options.outputPath, `${options.id}.csv`), csv);

  // Write file to git (graded runs)
  if (options.graded) {
    await octokit().repos.createFile({
      owner: courseConfig.grades.owner,
      repo: courseConfig.grades.repo as string,
      path: `${options.id}.csv`,
      message: 'autograder generated feedback file',
      content: Buffer.from(csv).toString('base64'),
    });

    debug('Saved gradebook CSV on git.');
  }
}
