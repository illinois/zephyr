import Debug from 'debug';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';
const debug = Debug('zephyr:output-formatter');
import handlebars from 'handlebars';

import computeScore from './compute-score';
import loadCourseConfig from './load-course-config';
import Octokit from './octokit';
import processCatch from './process-catch-results';
import writeGradebook from './write-gradebook';

const studentReportTemplatePath = path.join(__dirname, 'templates', 'student-report.hbs');
const studentReportTemplate = handlebars.compile(fs.readFileSync(studentReportTemplatePath, 'utf8'));

const generateReportHtml = exports.generateReportHtml = async (result: GraderResult) => {
  // If there's any catch data, process it
  if (result.testCaseResults) {
    result.testCases = await processCatch(result.testCaseResults);
  }

  // Setup variables for the HTML template:
  const output = {
    testCases: result.testCases,
    time: moment(result.timestamp).format('MMMM Do YYYY, h:mm:ss a'),
    sha: result.sha,
    netid: result.netid,
  } as any;

  if (!result.success) {
    output.succeeded = false;
    if (result.errors && result.errors.length === 1 && result.errors[0].includes('"Not Found"')) {
      result.errors = [ 'You made no submissions for this assignment as of this grading report.' ];
    }

    if (result.errors) { output.errors = result.errors; }
  } else {
    output.succeeded = true;

    const score = computeScore(result.testCases);
    output.earnedWeight = output.points = score.totalEarned;
    output.totalWeight = output.max_points = score.totalWeight;
    output.extraCredit = score.extraCredit;
    output.score = (score.score * 100).toFixed(2);
  }

  return studentReportTemplate(output);
};

export default async function(results: StudentGraderResults, options: Options): Promise<Gradebook> {
  const studentFeedbackDir = path.join(options.outputPath, 'studentFeedback');
  fs.ensureDirSync(studentFeedbackDir);
  const courseConfig = loadCourseConfig();

  const gradebook: Gradebook = {};
  const netids = Object.keys(results);
  for (const netid of netids) {
    const result = results[netid];

    const score = computeScore(result.testCases);
    const html = await generateReportHtml(result);

    // Store file to disk
    debug(`Saving student report: ${  path.join( studentFeedbackDir, `${netid  }.html` )}`);
    fs.writeFileSync( path.join( studentFeedbackDir, `${netid  }.html` ), html );

    // Store file on git (graded runs)
    if (options.graded) {
      await Octokit().repos.createFile({
        owner: courseConfig.feedback.owner as string,
        repo: courseConfig.feedback.repo as string,
        path: path.join(options.id, `${netid  }.html`),
        message: 'autograder generated feedback file',
        content: Buffer.from(html).toString('base64'),
      });
    }

    gradebook[netid] = score;
  }

  await writeGradebook(gradebook, courseConfig, options);
  return gradebook;
}
