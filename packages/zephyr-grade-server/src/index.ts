import * as http from 'http';
import { json } from 'micro';
import tmp from 'tmp';
import Octokit from '@octokit/rest';
import gradeStudent from '@illinois/zephyr-staff-cli/lib/grade-student';
import checkout from '@illinois/zephyr-github-checkout';
import loadAssignmentConfig from './load-assignment-config';

/**
 * Expects a POST request with a json body containing the following properties:
 * netid, assignment, run. Optional: timestamp, ref
 */
export default async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    const body = await json(req) as any;
    console.log(`Got grading request for ${body.netid} - ${body.assignment} [${body.run}]`)
    process.env.GHE_TOKEN = body.githubToken;
    const courseConfig = body.courseConfig;

    const octokit = new Octokit({
      timeout: 5000,
      baseUrl: 'https://github-dev.cs.illinois.edu/api/v3',
    });

    octokit.authenticate({
      type: 'oauth',
      token: process.env.GHE_TOKEN as string,
    });

    // Fetch the assignment from git
    let assignmentDir: string;
    let assignmentTmpDir: tmp.SynchrounousResult;
    assignmentTmpDir = tmp.dirSync({ unsafeCleanup: true });
    assignmentDir = assignmentTmpDir.name;
    await checkout({
      octokit: octokit,
      repo: courseConfig.assignments.repo,
      owner: courseConfig.assignments.owner,
      checkoutPath: assignmentDir,
      repoPath: body.assignment,
    });

    // Read the assignments.yaml file in the `assignmentRoot` directory to find
    // the available run configurations (eg: which files are student files / grader files)
    const assignmentConfig = await loadAssignmentConfig(assignmentDir, body.run);

    // Run the autograder
    const gradeStudentOptions = {
      cleanup: true,
      timestamp: body.timestamp,
      assignment: body.assignment,
      ref: body.ref,
      outputPath: './out',
    }
    const result = await gradeStudent(gradeStudentOptions, courseConfig, assignmentConfig, body.netid);
    return JSON.stringify(result);
  } catch (e) {
    console.error(e);
    throw e;
  }
};
