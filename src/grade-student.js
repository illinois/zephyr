const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const debug = require('debug')('zephyr:grade-student');

const mergeIntoDirectory = require('./merge-into-directory');
const courseConfig = require('./load-course-config')();
const checkout = require('./checkout');
const grader = require('./grader');
const slack = require('./slack');

module.exports = async (options, assignmentConfig, netid) => {
  const result = {
    netid: netid,
    timestamp: options.timestamp
  };

  // Create a temp folder to place all grader files into
  const tempPathObj = tmp.dirSync({ unsafeCleanup: options.cleanup });
  const tempPath = tempPathObj.name;
  debug(`Using temp path for ${netid}: ${tempPath}`);

  // Fetch student files from GitHub
  const tempStudentFiles = tmp.dirSync({ unsafeCleanup: false });
  debug(`Fetching student files to ${tempStudentFiles.name}`);
  try {
    const checkoutOptions = {
      repo: netid,
      repoPath: options.assignment,
      files: assignmentConfig.studentFiles,
      checkoutPath: tempStudentFiles.name,
      org: courseConfig.submissions.org,
    };
    result.sha = await checkout(checkoutOptions);
  } catch (e) {
    console.error(`Failed to fetch files for ${netid}`, e);
    tempStudentFiles.removeCallback();
    tempPathObj.removeCallback();

    result.success = false;
    result.errors = [e.message];
    return result;
  }

  // We'll need to merge several sets of files
  const sourceDirectories = [
    ...assignmentConfig.baseFilePaths,
    tempStudentFiles.name,
  ];
  sourceDirectories.forEach(directory => mergeIntoDirectory(directory, tempPath));

  // Time to run some tests
  debug(`> Grading started: ${netid}`);
  let graderResults;
  try {
    graderResults = await grader({ cwd: tempPath });
  } catch (e) {
    debug(`> Grading errored: ${netid}`);
    slack.warning(`Unable to grade submission from ${netid}!`, JSON.stringify(e));
  }

  debug(`Grading succeeded: ${netid}`);

  // Export files:
  assignmentConfig.exportFiles.forEach((exportFileName) => {
    console.log(exportFileName);
    const exportFilePath = path.join(tempPath, exportFileName);
    let exportSavePath = path.join(options.outputPath, 'export');
    fs.ensureDirSync(exportSavePath);
    exportSavePath = path.join(exportSavePath, `${netid}-${exportFileName}`);

    if (fs.existsSync(exportFilePath)) {
      fs.copyFileSync(exportFilePath, exportSavePath);
      debug(`Exported file: ${exportSavePath}`);
    }
  });

  result.success = true;
  result.graderResults = graderResults;

  if (options.cleanup) {
    tempPathObj.removeCallback();
  }
  return result;
};
