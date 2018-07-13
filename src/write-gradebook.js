const fs = require('fs-extra');
const { promisify } = require('util');
const path = require('path');
const debug = require('debug')('zephyr:output-formatter');
const octokit = require('./octokit');
const csvStringify = promisify(require('csv-stringify'));

module.exports = async function(gradebook, courseConfig, options) {
  const csvRows = [];

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
      repo: courseConfig.grades.repo,
      path: `${options.id}.csv`,
      message: 'autograder generated feedback file',
      content: new Buffer(csv).toString('base64')
    });

    debug('Saved gradebook CSV on git.');
  }
};
