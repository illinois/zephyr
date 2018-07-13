const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const debug = require('debug')('zephyr:load-assignment-config');

module.exports = async function(argv, assignmentPath) {
  // Load the assignment-specific YAML config:
  const assignmentYamlPath = path.join(assignmentPath, 'assignment.yaml');
  if (!fs.existsSync(assignmentYamlPath)) {
    console.log(`Assignment config file ${assignmentYamlPath} does not exist!`);
  }
  debug(`Reading assignment.yaml from: ${assignmentPath}`);
  const assignmentInfo = yaml.safeLoad(fs.readFileSync(assignmentYamlPath, 'utf8'));

  // Ensure our config exists
  if (!assignmentInfo.autograder.run[argv.run]) {
    console.log(`Assignment config file ${assignmentYamlPath} has no rule to run "${argv.run}".`);
  }

  // Create our assignmentConfig oject:
  const assignmentConfig = {
    baseFilePaths: [],
    studentFiles: [],
    exportFiles: [],
    assignmentPath: assignmentPath
  };

  //
  // Import global config options:
  //
  if (assignmentInfo.autograder.base) {
    const p = path.join(assignmentPath, assignmentInfo.autograder.base);
    assignmentConfig.baseFilePaths.push(p);
    debug(`Config added base file path: ${p}`);
  }

  const p = path.join(assignmentPath, `autograder-${argv.run}`);
  if (fs.existsSync(p)) {
    assignmentConfig.baseFilePaths.push(p);
    debug(`Config added base file path: ${p}`);
  } else {
    debug(`Config SKIPPED base file path (does not exist): ${p}`);
  }

  //
  // Import assignment specific config:
  //
  const runConfig = assignmentInfo.autograder.run[argv.run];

  if (runConfig.export) {
    assignmentConfig.exportFiles = assignmentConfig.exportFiles.concat( runConfig.export );
  }
  assignmentConfig.studentFiles = runConfig.studentFiles.map(function (d) {
    if (typeof(d) === 'string') {
      return { name: d, required: true };
    } else {
      return d;
    }
  });


  return assignmentConfig;
};
