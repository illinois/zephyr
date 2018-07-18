import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
const debug = require('debug')('zephyr:load-assignment-config');

export default async function(options: Options, assignmentPath: string): Promise<AssignmentConfig> {
  // Load the assignment-specific YAML config:
  const assignmentYamlPath = path.join(assignmentPath, 'assignment.yaml');
  if (!fs.existsSync(assignmentYamlPath)) {
    console.log(`Assignment config file ${assignmentYamlPath} does not exist!`);
  }
  debug(`Reading assignment.yaml from: ${assignmentPath}`);
  const assignmentInfo = yaml.safeLoad(fs.readFileSync(assignmentYamlPath, 'utf8'));

  // Ensure our config exists
  if (!assignmentInfo.autograder.run[options.run]) {
    console.log(`Assignment config file ${assignmentYamlPath} has no rule to run "${options.run}".`);
  }

  // Create our assignmentConfig oject:
  const assignmentConfig: AssignmentConfig = {
    baseFilePaths: [],
    studentFiles: [],
    exportFiles: [],
    assignmentPath: assignmentPath,
  };

  // Import global config options:
  if (assignmentInfo.autograder.base) {
    const p = path.join(assignmentPath, assignmentInfo.autograder.base);
    assignmentConfig.baseFilePaths.push(p);
    debug(`Config added base file path: ${p}`);
  }

  const p = path.join(assignmentPath, `autograder-${options.run}`);
  if (fs.existsSync(p)) {
    assignmentConfig.baseFilePaths.push(p);
    debug(`Config added base file path: ${p}`);
  } else {
    debug(`Config SKIPPED base file path (does not exist): ${p}`);
  }

  //
  // Import assignment specific config:
  //
  const runConfig = assignmentInfo.autograder.run[options.run];

  if (runConfig.export) {
    assignmentConfig.exportFiles = assignmentConfig.exportFiles.concat( runConfig.export );
  }
  assignmentConfig.studentFiles = runConfig.studentFiles.map((d: string | StudentFile) => {
    if (typeof(d) === 'string') {
      return { name: d, required: true };
    } else {
      return d;
    }
  });


  return assignmentConfig;
};
