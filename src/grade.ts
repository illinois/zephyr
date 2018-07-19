import Debug from 'debug';
import fs from 'fs-extra';
import ora from 'ora';
import path from 'path';
import tmp from 'tmp';

import checkout from './checkout';
import computeScore from './compute-score';
import gradeStudent from './grade-student';
import loadAssignmentConfig from './load-assignment-config';
import loadCourseConfig from './load-course-config';
import processCatchResults from './process-catch-results';
import * as slack from './slack';

const debug = Debug('zephyr:grade');

export default async (options: IOptions): Promise<IStudentGraderResults> => {
  slack.start(`Starting grading for *${options.assignment}* with config *${options.run}* as \`${options.id}\``);

  // Load configuration for the current course
  const courseConfig = loadCourseConfig();

  // Fetch the assignment from git
  let assignmentDir: string;
  let assignmentTmpDir: tmp.SynchrounousResult | undefined;
  if (options.assignmentRoot) {
    debug(`Using local assignment root ${options.assignmentRoot}...`);
    assignmentDir = path.join(options.assignmentRoot, options.assignment);
  } else {
    const spinner = ora(`Fetching ${options.assignment} from git`).start();
    // console.log(`Fetching ${options.assignment} from git...`);
    assignmentTmpDir = tmp.dirSync({ unsafeCleanup: options.cleanup });
    assignmentDir = assignmentTmpDir.name;
    await checkout({
      checkoutPath: assignmentDir,
      repoPath: options.assignment,
      owner: courseConfig.assignments.owner,
      repo: courseConfig.assignments.repo,
    });
    spinner.succeed();
  }

  // Read the assignments.yaml file in the `assignmentRoot` directory to find
  // the available run configurations (eg: which files are student files / grader files)
  debug(`Loading assignment.yaml config for ${options.assignment}...`);
  const assignmentConfig = await loadAssignmentConfig(options, assignmentDir);

  // Find the list of NetIDs to grade:
  let netids;
  if (options.netid) {
    debug(`Running for student: ${options.netid}`);
    netids = [ options.netid ];
  } else {
    debug('Using netids from course config');
    netids = courseConfig.roster;

    // --run-one option, selecting a random student:
    if (options['run-one']) {
      const index = Math.floor( Math.random() * netids.length );
      netids = [ netids[index] ] ;
      console.log(`--run-one selected a random student: ${netids[0]}`);
    }
  }

  // Run the autograder
  slack.message(`Grading ${netids.length} submissions.`);
  debug('Running student code...');
  const autograderResults: IStudentGraderResults = {};
  for (const netid of netids) {
    if (options.resume) {
      const outputFile = path.join(options.outputPath, `${netid}.json`);
      if (fs.existsSync(outputFile)) {
        debug(`--resume: skipping ${netid}`);
        autograderResults[netid] = JSON.parse(fs.readFileSync(outputFile, {encoding: 'utf-8'}));
        continue;
      }
    }

    const spinner = ora(`Grading submission from ${netid}`).start();

    const result = await gradeStudent(options, assignmentConfig, netid);
    result.testCases = await processCatchResults(result.testCaseResults);

    const outputFilee = path.join(options.outputPath, `${netid}.json`);
    fs.writeFileSync(outputFilee, JSON.stringify(result));
    autograderResults[netid] = result;

    const grade = computeScore(result.testCases);
    if (result.success) {
      spinner.succeed(`Graded ${netid}: ${(grade.score * 100).toFixed()}%`);
    } else {
      spinner.fail(`Could not grade submission from ${netid}`);
    }
  }

  // Cleanup
  if (assignmentTmpDir) {
    if (options.cleanup) {
      assignmentTmpDir.removeCallback();
    } else {
      console.log(`No --cleanup, assignment files remain at ${assignmentTmpDir.name}`);
    }
  }

  return autograderResults;
};
