import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
const debug = require('debug')('zephyr:grade-student');

import mergeIntoDirectory from './merge-into-directory';
const courseConfig = require('./load-course-config')();
import checkout from './checkout';
import grader from './grader';
import * as slack from './slack';
import { Options, GraderResult, AssignmentConfig, TestCaseResult } from './types';

export default async (options: Options, assignmentConfig: AssignmentConfig, netid: string) => {
  const result: GraderResult = {
    netid: netid,
    timestamp: options.timestamp
  } as GraderResult;

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
  let testCaseResults: Array<TestCaseResult> = [];
  try {
    testCaseResults = await grader({ cwd: tempPath });
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
  result.testCaseResults = testCaseResults;

  if (options.cleanup) {
    tempPathObj.removeCallback();
  }
  return result;
};
