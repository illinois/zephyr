import Debug from 'debug';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';
const debug = Debug('zephyr:output-formatter');
import handlebars from 'handlebars';
import { IScore } from '@illinois/zephyr-grader-base';

import loadCourseConfig from './load-course-config';
import Octokit from './octokit';
import writeGradebook from './write-gradebook';
import { IStudentResults } from './grade';
import { IStudentResult } from './grade-student';

const studentReportTemplatePath = path.join(__dirname, 'templates', 'student-report.hbs');
const studentReportTemplate = handlebars.compile(fs.readFileSync(studentReportTemplatePath, 'utf8'));

export interface IGradebook {
  [netid: string]: IScore;
}

const generateReportHtml = exports.generateReportHtml = async (result: IStudentResult) => {
  // Setup variables for the HTML template:
  const output = {
    testCases: result.results && result.results.tests,
    time: moment(result.timestamp).format('MMMM Do YYYY, h:mm:ss a'),
    sha: result.sha,
    netid: result.netid,
  } as any;

  if (!result.success || !result.results) {
    output.succeeded = false;
    if (result.errors && result.errors.length === 1 && result.errors[0].includes('"Not Found"')) {
      result.errors = [ 'You made no submissions for this assignment as of this grading report.' ];
    }

    if (result.errors) { output.errors = result.errors; }
  } else {
    output.succeeded = true;
    const { totalWeight, totalEarned, extraCredit, score } = result.results.score;

    output.earnedWeight = output.points = totalEarned;
    output.totalWeight = output.max_points = totalWeight;
    output.extraCredit = extraCredit;
    output.score = (score * 100).toFixed(2);
  }

  return studentReportTemplate(output);
};

export default async function(results: IStudentResults, options: IOptions): Promise<IGradebook> {
  const studentFeedbackDir = path.join(options.outputPath, 'studentFeedback');
  fs.ensureDirSync(studentFeedbackDir);
  const courseConfig = loadCourseConfig();

  const gradebook: IGradebook = {};
  const netids = Object.keys(results);
  for (const netid of netids) {
    const result = results[netid];

    const html = await generateReportHtml(result);

    // Store file to disk
    debug(`Saving student report: ${path.join( studentFeedbackDir, `${netid}.html` )}`);
    fs.writeFileSync( path.join( studentFeedbackDir, `${netid}.html` ), html );

    // Store file on git (graded runs)
    if (options.graded) {
      await Octokit().repos.createFile({
        owner: courseConfig.feedback.owner as string,
        repo: courseConfig.feedback.repo as string,
        path: path.join(options.id, `${netid}.html`),
        message: 'autograder generated feedback file',
        content: Buffer.from(html).toString('base64'),
      });
    }

    let score: IScore = result.results && result.results.score;
    if (!score) {
      score = {
        totalWeight: 0,
        totalEarned: 0,
        extraCredit: 0,
        score: 0,
      }
    }

    gradebook[netid] = score;
  }

  await writeGradebook(gradebook, courseConfig, options);
  return gradebook;
}
