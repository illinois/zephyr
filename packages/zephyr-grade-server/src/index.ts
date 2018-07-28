import * as http from 'http';
import micro, { json } from 'micro';
import tmp from 'tmp';
import { spawn } from 'child_process';
import Octokit from '@octokit/rest';
import gradeStudent from '@illinois/zephyr-staff-cli/lib/grade-student';
import checkout from '@illinois/zephyr-github-checkout';
import loadAssignmentConfig from './load-assignment-config';

let dependenciesInstalled = false;

/**
 * Expects a POST request with a json body containing the following properties:
 * netid, assignment, run. Optional: timestamp, ref
 */
const server = micro(async (req: http.IncomingMessage, res: http.ServerResponse) => {
  try {
    const body = await json(req) as any;
    console.log(`Got grading request for ${body.netid} - ${body.assignment} [${body.run}]`)
     
    if (process.env.IN_DOCKER === 'true') {
      console.log('Running in Docker, might need to install dependencies');
      if (!dependenciesInstalled) {
        await new Promise((resolve, reject) => {
          const command = `apt-get update \
          && apt-get install -y make clang-3.9 libc++abi-dev libc++-dev valgrind \
          && sudo update-alternatives --install /usr/bin/clang clang /usr/bin/clang-3.9 100 \
          && sudo update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-3.9 100 \
          && sudo update-alternatives --install /usr/bin/llvm-symbolizer llvm-symbolizer /usr/bin/llvm-symbolizer-3.9 100`
          const command2 = `apk add clang valgrind make libc++-dev libc++`;
          const cp = spawn(command2, [], { shell: true });
          cp.stdout.on('data', (d) => console.log(d.toString()));
          cp.stderr.on('data', (d) => console.log(d.toString()));
          cp.on('exit', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Child process exited with code ${code}`));
            }
          });
        });
      }
    } else {
      console.log('Not in Docker, assuming dependencies are installed')
    }
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
    console.log('Fetching assignment files');
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

    console.log('Grading student code');
    const result = await gradeStudent(gradeStudentOptions, courseConfig, assignmentConfig, body.netid);
    console.log(JSON.stringify(result));
    return JSON.stringify(result);
  } catch (e) {
    console.error(e);
    throw e;
  }
});

server.listen(3000);
console.log('Listening on port 3000');
