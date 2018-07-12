require('dotenv').load();
const fs = require('fs-extra');
const debug = require('debug')('zephyr');
const path = require('path');
const os = require('os');
const grade = require('./grade');
const processResults = require('./process-results');
const argv = require('yargs')
  .option('assignment', {
    describe: 'Assignment name',
    demandOption: 'An assignment is required'
  })
  .option('run', {
    describe: 'Specify the grading scheme to run',
    required: true
  })
  .option('assignment-root', {
    describe: 'Use a local assignment root instead of using git',
  })
  .option('output-path', {
    alias: 'o',
    describe: 'Output path for grader output'
  })
  .option('run-one', {
    describe: 'Run only a single student (at random)',
    boolean: true,
    default: false
  })
  .option('netid', {
    describe: 'Run only a single student (given by netid)',
  })
  .option('timestamp', {
    alias: 't',
    describe: 'Use code submissions made before a given time'
  })
  .option('ref', {
    describe: 'Use a specific revision for grading'
  })
  .option('resume', {
    describe: 'Resume a previous grading run (skip if output exists)'
  })
  .option('id', {
    describe: 'Provide a unique ID for this run (for files/logs)'
  })
  .option('cleanup', {
    describe: 'Clean up temp files/directories',
    boolean: true,
    default: undefined
  })
  .option('graded', {
    describe: 'Run as a graded run',
    boolean: true,
    default: false
  })
  .option('assignments-ref', {
    describe: 'The commit/branch/tag of the assignments repo to pull from',
    default: 'master'
  })
  .option('skip-ews-check', {
    describe: 'Used to skip safety check to make sure grader is run on EWS.',
    boolean: true,
    default: false
  })
  .implies('graded', 'id')
  .implies('ref', 'netid')
  .help()
  .argv;

console.log(Object.keys(argv));
process.exit(0);

// Let's validate some stuff
const fatal = (msg, exitCode = 1) => {
  console.error(msg);
  process.exit(exitCode);
};

if (argv.ref && argv.timestamp) {
  fatal('Either a ref or a timestamp can be given -- not both.');
}

if (!process.env.GHE_TOKEN) {
  fatal('You must provide a GitHub token via the GHE_TOKEN environment variable');
}

if (!argv['skip-ews-check']
    && (process.platform != 'linux' || !os.hostname().includes('ews.illinois.edu'))
    && !argv.containerize) {
  fatal('You should be running the grader in an EWS Linux machine for '
        + 'actual grading.\n'
        + 'Even testing should be done on EWS, but if needed locally, '
        + 'use --skip-ews-check.\n'
        + 'Either way, it\'s better to use --containerize on local machines.');
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

  require('./slack').enable();
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
  const results = await grade(argv);
  await processResults(results, argv);
})();



console.log('Starting [code-runner]...');
require('./zephyr-code-runner')(argv).then((results) => {
  console.log('Starting [output-formatter]...');
  require('./zephyr-output-formatter').processReportDictionary(argv, results).then(() => {
    console.log('Done!');
  });

  console.log('Autograder complete!');
});
