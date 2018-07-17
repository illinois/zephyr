import fs from 'fs-extra';
import path from 'path';
import moment from 'moment';
const debug = require('debug')('zephyr:output-formatter');
import handlebars from 'handlebars';

const courseConfig = require('./load-course-config')();
const octokit = require('./octokit')();
import computeScore from './compute-score';
import writeGradebook from './write-gradebook';
import processCatch from './process-catch-results';
import { GraderResult, StudentGraderResults, Options, Gradebook } from './types';

const studentReportTemplatePath = path.join(__dirname, 'templates', 'student-report.hbs');
const studentReportTemplate = handlebars.compile(fs.readFileSync(studentReportTemplatePath, 'utf8'));

const generateReportHtml = exports.generateReportHtml = async function(result: GraderResult) {
  // If there's any catch data, process it
  if (result.testCaseResults) {
    result.testCases = await processCatch(result.testCaseResults);
  }

  // Setup variables for the HTML template:
  const output = {
    testCases: result.testCases,
    time: moment(result.timestamp).format('MMMM Do YYYY, h:mm:ss a'),
    sha: result.sha,
    netid: result.netid
  } as any;

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

export default async function(results: StudentGraderResults, options: Options): Promise<Gradebook> {
  const studentFeedbackDir = path.join(options.outputPath, 'studentFeedback');
  fs.ensureDirSync(studentFeedbackDir);

  const gradebook: Gradebook = {};
  const keys = Object.keys(results);
  for (let i = 0; i < keys.length; i++) {
    const netid = keys[i];
    const result = results[netid];

    const score = computeScore(result);
    const html = await generateReportHtml(result);

    // Store file to disk
    debug(`Saving student report: ${  path.join( studentFeedbackDir, `${netid  }.html` )}`);
    fs.writeFileSync( path.join( studentFeedbackDir, `${netid  }.html` ), html );

    // Store file on git (graded runs)
    if (options.graded) {
      await octokit.repos.createFile({
        owner: courseConfig.feedback.owner,
        repo: courseConfig.feedback.repo,
        path: path.join(options.id, `${netid  }.html`),
        message: 'autograder generated feedback file',
        content: Buffer.from(html).toString('base64')
      });
    }

    gradebook[netid] = score;
  }

  await writeGradebook(gradebook, courseConfig, options);
  return gradebook;
};
