import fs from 'fs-extra';
import yaml from 'js-yaml';
import path from 'path';

export interface IStudentFile {
  name: string;
  required: boolean;
}

export interface IAssignmentConfig {
  studentFiles: IStudentFile[];
  baseFilePaths: string[];
  exportFiles: string[];
  assignmentPath: string;
}

export default async function(assignmentPath: string, run: string): Promise<IAssignmentConfig> {
  // Load the assignment-specific YAML config:
  const assignmentYamlPath = path.join(assignmentPath, 'assignment.yaml');
  const assignmentInfo = yaml.safeLoad(fs.readFileSync(assignmentYamlPath, 'utf8'));

  // Ensure our config exists
  if (!assignmentInfo.autograder.run[run]) {
    console.log(`Assignment config file ${assignmentYamlPath} has no rule to run "${run}".`);
  }

  // Create our assignmentConfig oject:
  const assignmentConfig: IAssignmentConfig = {
    baseFilePaths: [],
    studentFiles: [],
    exportFiles: [],
    assignmentPath,
  };

  // Import global config options:
  if (assignmentInfo.autograder.base) {
    const basePath = path.join(assignmentPath, assignmentInfo.autograder.base);
    assignmentConfig.baseFilePaths.push(basePath);
  }

  const p = path.join(assignmentPath, `autograder-${run}`);
  if (fs.existsSync(p)) {
    assignmentConfig.baseFilePaths.push(p);
  }

  // Import assignment specific config:
  const runConfig = assignmentInfo.autograder.run[run];

  if (runConfig.export) {
    assignmentConfig.exportFiles = assignmentConfig.exportFiles.concat( runConfig.export );
  }
  assignmentConfig.studentFiles = runConfig.studentFiles.map((d: string | IStudentFile) => {
    if (typeof(d) === 'string') {
      return { name: d, required: true };
    } else {
      return d;
    }
  });

  return assignmentConfig;
}