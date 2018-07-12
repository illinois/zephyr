const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const debug = require('debug')('zephyr:code-runner');

const checkout = require('./checkout');
const loadAssignmentConfig = require('./load-assignment-config');
const gradeStudent = require('./grade-student');
const computeScore = require('./compute-score');
const slack = require('./slack');

module.exports = async (options) => {
  slack.start(`Starting grading for *${options.assignment}* with config *${options.run}* as \`${options.id}\``);

  // Fetch the assignment from git
  let assignmentDir;
  let assignmentTmpDir;
  if (options.assignmentRoot) {
    debug(`Using local assignment root ${options.assignmentRoot}...`);
    assignmentDir = path.join(options.assignmentRoot, options.assignment);
  } else {
    console.log(`Fetching ${options.assignment} from git...`);
    assignmentTmpDir = tmp.dirSync({ unsafeCleanup: options.cleanup });
    assignmentDir = assignmentTmpDir.name;
    await checkout({
      checkoutPath: assignmentDir,
      repoPath: options.assignment,
      org: 'cs225-staff',
      repo: 'assignment',
    });
  }

  // Read the assignments.yaml file in the `assignmentRoot` directory to find
  // the available run configurations (eg: which files are student files / grader files)
  debug(`Loading assignment.yaml config for ${options.assignment}...`);
  const assignmentConfig = await loadAssignmentConfig(options, assignmentDir);
  assignmentConfig.autograderFilePaths = [path.join('graderFiles', 'catch')]; // autograderStaticFilesPath
  assignmentConfig.autograderArgs = ['grader.js', 'test'];

  // Find the list of NetIDs to grade:
  let studentFolders;
  if (options.netid) {
    console.log(`--netid used, using student: ${options.netid}`);
    studentFolders = [ options.netid ];
  } else {
    console.error('TODO: support student roster');
    process.exit(1);

    debug('Fetching the list of student NetIDs...');
    studentFolders = await require('./fetchStudentRoster.js')();

    // --run-one option, selecting a random student:
    if (options['run-one']) {
      const index = Math.floor( Math.random() * studentFolders.length );
      studentFolders = [ studentFolders[index] ] ;
      console.log(`--run-one selected a random student: ${studentFolders[0]}`);
    }
  }

  // Run the autograder
  slack.message(`Grading ${studentFolders.length} submissions.`);
  debug('Running student code...');
  const autograderResults = {};
  for (let i = 0; i < studentFolders.length; i++) {
    const netid = studentFolders[i];

    if (options.resume) {
      const outputFile = path.join(options.outputPath, `${netid}.json`);
      if (fs.existsSync(outputFile)) {
        debug(`--resume: skipping ${netid}`);
        autograderResults[netid] = JSON.parse(fs.readFileSync(outputFile, {encoding: 'utf-8'}));
        continue;
      }
    }

    const result = await gradeStudent(options, assignmentConfig, netid);
    result.testCases = require('../zephyr-catch-parser/process_catch.js')(result.grader_output);

    const outputFile = path.join(options.outputPath, `${netid}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(result));
    autograderResults[netid] = result;

    const grade = computeScore(result);
    console.log(`Graded: ${netid} - ${grade.pct100}%`);
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
