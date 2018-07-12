const fs = require('fs-extra');
const path = require('path');
const debug = require('debug')('zephyr:output-formatter');
const octokit = require('./octokit');

module.exports = async function(gradebook, courseConfig, options) {
  let csv = 'netid,score,error,ec\n';

  const keys = Object.keys(gradebook);
  for (let i = 0; i < keys.length; i++) {
    const netid = keys[i];
    const score = gradebook[netid];

    csv += `${netid},${score.pct100},`;

    if (score.errors) {
      csv += `"${score.errors.join(';').replace('"', '""')}",`;
    } else {
      csv += ',';
    }

    csv += score.extraCredit;
    csv += '\n';
  }

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
