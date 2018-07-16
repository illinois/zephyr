const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const debug = require('debug')('zephyr:output-formatter');
const handlebars = require('handlebars');

const octokit = require('./octokit')();
const computeScore = require('./compute-score');
const writeGradebook = require('./write-gradebook');
const processCatch = require('./process-catch-results');

const studentReportTemplatePath = path.join(__dirname, 'templates', 'student-report.hbs');
const studentReportTemplate = handlebars.compile(fs.readFileSync(studentReportTemplatePath, 'utf8'));

const generateReportHtml = exports.generateReportHtml = function(result) {
  // If there's any catch data, process it
  if (result.grader_output) {
    result.testCases = processCatch(result.grader_output);
  }

  //
  // Setup variables for the HTML template:
  //
  const output = {
    testCases: result.testCases,
    time: moment(result.timestamp).format('MMMM Do YYYY, h:mm:ss a'),
    sha: result.sha,
    netid: result.netid
  };


  if (!result.success) {
    output.succeeded = false;
    if (result.errors.length == 1 && result.errors[0].includes('"Not Found"')) {
      result.errors = [ 'You made no submissions for this assignment as of this grading report.' ];
    }

    if (result.errors) { output.errors = result.errors; }
  } else {
    output.succeeded = true;

    const score = computeScore(result);
    output.earnedWeight = output.points = score.earned;
    output.totalWeight = output.max_points = score.weight;
    output.extraCredit = score.extraCredit;
    output.score = score.pct100;
  }

  return studentReportTemplate(output);
};

module.exports = async function(argv, resultsDict) {
  const studentFeedbackDir = path.join( argv.outputPath, 'studentFeedback');
  fs.ensureDirSync(studentFeedbackDir);

  const gradebook = {};
  const keys = Object.keys(resultsDict);
  for (let i = 0; i < keys.length; i++) {
    const netid = keys[i];
    const result = resultsDict[netid];

    const score = computeScore(result);
    const html = generateReportHtml(result);

    // Store file to disk
    debug(`Saving student report: ${  path.join( studentFeedbackDir, `${netid  }.html` )}`);
    fs.writeFileSync( path.join( studentFeedbackDir, `${netid  }.html` ), html );

    // Store file on git (graded runs)
    if (argv.graded) {
      await octokit.repos.createFile({
        owner: org,
        repo: 'sp18-studentFeedback',
        path: path.join(argv.id, `${netid  }.html`),
        message: 'autograder generated feedback file',
        content: Buffer.from(html).toString('base64')
      });
    }

    gradebook[netid] = score;
  }

  await writeGradebook(argv, gradebook);
  return gradebook;
};
