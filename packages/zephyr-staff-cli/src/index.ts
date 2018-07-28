#!/usr/bin/env node

import 'babel-polyfill';
import Debug from 'debug';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import yargs from 'yargs';
import generateReports from './generate-reports';
import grade, { IStudentResults } from './grade';
import * as slack from './slack';

dotenv.load();
const debug = Debug('zephyr:staff-cli');

export interface IOptions {
  graded: boolean;
  assignment: string;
  run: string;
  id: string;
  assignmentRoot: string;
  cleanup: boolean;
  netid?: string;
  ['run-one']: boolean;
  ['skip-ews-check']: boolean;
  resume: boolean;
  outputPath: string;
  timestamp: string;
  ref: string;
}

const argv = yargs
  .option('assignment', {
    describe: 'Assignment name',
    demandOption: 'An assignment is required',
  })
  .option('run', {
    describe: 'Specify the grading scheme to run',
    required: true,
  })
  .option('assignment-root', {
    describe: 'Use a local assignment root instead of using git',
  })
  .option('output-path', {
    alias: 'o',
    describe: 'Output path for grader output',
  })
  .option('run-one', {
    describe: 'Run only a single student (at random)',
    boolean: true,
    default: false,
  })
  .option('netid', {
    describe: 'Run only a single student (given by netid)',
  })
  .option('timestamp', {
    alias: 't',
    describe: 'Use code submissions made before a given time',
  })
  .option('ref', {
    describe: 'Use a specific revision for grading',
  })
  .option('resume', {
    describe: 'Resume a previous grading run (skip if output exists)',
  })
  .option('id', {
    describe: 'Provide a unique ID for this run (for files/logs)',
  })
  .option('cleanup', {
    describe: 'Clean up temp files/directories',
    boolean: true,
    default: undefined,
  })
  .option('graded', {
    describe: 'Run as a graded run',
    boolean: true,
    default: false,
  })
  .option('assignments-ref', {
    describe: 'The commit/branch/tag of the assignments repo to pull from',
    default: 'master',
  })
  .option('skip-ews-check', {
    describe: 'Used to skip safety check to make sure grader is run on EWS.',
    boolean: true,
    default: false,
  })
  .implies('graded', 'id')
  .implies('ref', 'netid')
  .help()
  .argv as any;

// Let's validate some stuff
const fatal = (msg: string, exitCode = 1) => {
  console.error(msg);
  process.exit(exitCode);
};

if (argv.ref && argv.timestamp) {
  fatal('Either a ref or a timestamp can be given -- not both.');
}

if (!process.env.GHE_TOKEN) {
  fatal('You must provide a GitHub token via the GHE_TOKEN environment variable');
}

if (!argv['skip-ews-check'] && (process.platform !== 'linux' || !os.hostname().includes('ews.illinois.edu'))) {
  fatal('You should be running the grader in an EWS Linux machine for '
        + 'actual grading.\n'
        + 'Even testing should be done on EWS, but if needed locally, '
        + 'use --skip-ews-check.');
}

if (argv.cleanup === undefined) {
  if (argv.netid || argv['run-one']) {
    debug('--cleanup is not set; defaulting to --cleanup false since --netid or --run-one is used');
    argv.cleanup = false;
  } else {
    debug('--cleanup is not set; defaulting to --cleanup true');
    argv.cleanup = true;
  }
}

// graded
if (argv.graded) {
  console.log(' ============================================================================= ');
  console.log(' = This is a GRADED run -- feedback will be reported to students at the end. = ');
  console.log(' ============================================================================= ');
  console.log(` * Assignment: ${argv.assignment}`);
  console.log(` * Run: ${argv.run}`);
  console.log();

  slack.enable();
}

// ensure id exists
if (!argv.id) {
  argv.id = `${argv.assignment}_${(new Date()).getTime()}`;
}
debug(`Run ID: ${argv.id}`);

// output path
if (!argv.outputPath) {
  argv.outputPath = path.join('out', argv.id);
}
fs.ensureDirSync(argv.outputPath);

// Top-level async/await hack
(async () => {
  const results: IStudentResults = await grade(argv);
  await generateReports(results, argv);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
