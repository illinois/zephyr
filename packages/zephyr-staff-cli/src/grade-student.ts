import Debug from 'debug';
const debug = Debug('zephyr:grade-student');
import fs from 'fs-extra';
import path from 'path';
import tmp from 'tmp';
import checkout, { ICheckoutOptions } from '@illinois/zephyr-github-checkout';
import grader, { IGraderResults } from '@illinois/zephyr-catch-grader';

import octokit from './octokit';
import loadCourseConfig from './load-course-config';
import mergeIntoDirectory from './merge-into-directory';
import * as slack from './slack';

export interface IStudentResult {
  netid: string;
  timestamp: string;
  success: boolean;
  sha?: string;
  errors?: string[];
  results: IGraderResults;
}

export default async (
  options: IOptions,
  assignmentConfig: IAssignmentConfig,
  netid: string,
): Promise<IStudentResult> => {
  const result: IStudentResult = {
    netid,
    timestamp: options.timestamp,
  } as IStudentResult;

  // Create a temp folder to place all grader files into
  const tempPathObj = tmp.dirSync({ unsafeCleanup: options.cleanup });
  const tempPath = tempPathObj.name;
  debug(`Using temp path for ${netid}: ${tempPath}`);

  // Fetch student files from GitHub
  const tempStudentFiles = tmp.dirSync({ unsafeCleanup: false });
  debug(`Fetching student files to ${tempStudentFiles.name}`);
  const courseConfig = loadCourseConfig();
  try {
    const checkoutOptions: ICheckoutOptions = {
      octokit: octokit(),
      repo: netid,
      repoPath: options.assignment,
      files: assignmentConfig.studentFiles,
      checkoutPath: tempStudentFiles.name,
      owner: courseConfig.submissions.owner,
      ref: options.ref,
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
  sourceDirectories.forEach((directory) => mergeIntoDirectory(directory, tempPath));

  // Time to run some tests
  debug(`> Grading started: ${netid}`);
  try {
    result.results = await grader({ cwd: tempPath });
  } catch (e) {
    debug(`> Grading errored: ${netid}`);
    slack.warning(`Unable to grade submission from ${netid}!`, JSON.stringify(e));
  }

  debug(`Grading succeeded: ${netid}`);

  // Export files:
  assignmentConfig.exportFiles.forEach((exportFileName) => {
    const exportFilePath = path.join(tempPath, exportFileName);
    let exportSavePath = path.join(options.outputPath, 'export');
    fs.ensureDirSync(exportSavePath);
    exportSavePath = path.join(exportSavePath, `${netid}-${exportFileName}`);

    if (fs.existsSync(exportFilePath)) {
      fs.copyFileSync(exportFilePath, exportSavePath);
      debug(`Exported file: ${exportSavePath}`);
    }
  });

  if (options.cleanup) {
    tempPathObj.removeCallback();
  }

  result.success = true;
  return result;
};
