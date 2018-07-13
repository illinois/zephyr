const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const spawnSync = require('child_process').spawnSync;
const debug = require('debug')('zephyr:grade-student');

const checkout = require('./checkout');
const slack = require('./slack');

const copyAllFilesInDir = (srcPath, destPath) => {
  let allFilesSame = true;

  debug(`Copying: ${srcPath}`);
  fs.readdirSync(srcPath).forEach(function (fileName) {
    const src = path.join(srcPath, fileName);
    const dest = path.join(destPath, fileName);
    let isSame;

    if ( fs.lstatSync(src).isDirectory() ) {
      fs.ensureDirSync(dest);
      isSame = copyAllFilesInDir(src, dest);
    } else {
      debug(`--> Copying: ${src} => ${dest}`);

      if (fs.existsSync(dest)) {
        const src_str = fs.readFileSync(src, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');
        const dest_str = fs.readFileSync(dest, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');

        isSame = src_str == dest_str;

        if (isSame) { debug(`SKIP: ${src} (file not changed)`); }
        else        { debug(`NEW: ${src} (file changed)`); }
      } else {
        debug(`NEW: ${dest} (file did not exist)`);
        isSame = false;
      }

      if (!isSame) { fs.copySync(src, dest); }
    }

    if (!isSame) { allFilesSame = false; }
  });

  return allFilesSame;
};

/* runOneStudent */
module.exports = async function (options, assignmentConfig, netid) {
  //
  // Create the result object:
  //
  const result = {
    netid: netid,
    timestamp: options.timestamp
  };


  //
  // Create a temp folder to place all grader into:
  //
  const tempPathObj = tmp.dirSync({ unsafeCleanup: options.cleanup });
  const tempPath = tempPathObj.name;
  debug(`Using temp path for ${netid}: ${tempPath}`);


  //
  // Fetch student files (from git)
  //
  const temp_fetchStudentFiles = tmp.dirSync({ unsafeCleanup: true });
  try {
    const checkoutOptions = {
      repoPath: assignmentConfig
    }
    result.sha = await checkout(argv, assignmentConfig, netid, temp_fetchStudentFiles.name);
  } catch (e) {
    temp_fetchStudentFiles.removeCallback();

    if (argv.cleanup) { tempPathObj.removeCallback(); }
    else { console.log(`No --cleanup, files remain at ${tempPath}`); }

    debug(`Failed to fetch files for ${netid}`, e);
    result.success = false;
    result.errors = [e.message];
    return result;
  }


  //
  // Copy all files
  //
  // 1. Copy base files
  assignmentConfig.baseFilePaths.forEach(function (folder) {
    copyAllFilesInDir(folder, tempPath);
  });

  // 2. Add (overwriting base files, if needed) student files
  copyAllFilesInDir(temp_fetchStudentFiles.name, tempPath);
  temp_fetchStudentFiles.removeCallback();

  // 3. Add required grader files for the autograder
  assignmentConfig.autograderFilePaths.forEach(function (folder) {
    copyAllFilesInDir(folder, tempPath);
  });


  //
  // Run
  //
  debug(`GRADING STARTED : ${netid}`);
  // This node process will compute its own timeout based on the timeout of
  // all test cases
  const p = spawnSync('node', assignmentConfig.autograderArgs, {
    'cwd': tempPath,
    'shell': true,
    'stdio': ['pipe', 'pipe', 'pipe', 'pipe']
  });
  debug(`GRADING FINISHED : ${netid}`);

  // Export files:
  assignmentConfig.exportFiles.forEach(function (exportFileName) {
    console.log(exportFileName);
    const exportFilePath = path.join(tempPath, exportFileName);
    let exportSavePath = path.join(argv.outputPath, 'export');
    fs.ensureDirSync(exportSavePath);
    exportSavePath = path.join(exportSavePath, `${netid}-${exportFileName}`);

    if (fs.existsSync(exportFilePath)) {
      fs.copyFileSync(exportFilePath, exportSavePath);
      debug(`Exported file: ${exportSavePath}`);
    }
  });

  // Capture output:
  try {
    const grader_output = JSON.parse(p.output[3].toString());
    result.success = true;
    result.grader_output = grader_output;
  } catch (e) {
    slack.warning(`Unable to capture grader result for ${netid}!`, JSON.stringify(e));
    const logIfPresent = str => {
      if (!str) return;
      // Remove trailing newline since console.log adds one anyways
      if (str[str.length - 1] === '\n') str = str.slice(0, -1);
      console.log(str);
    };
    console.log('===BEGIN STDOUT===');
    logIfPresent(p.output[1].toString());
    console.log('===END STDOUT===');
    console.log('===BEGIN STDERR===');
    logIfPresent(p.output[2].toString());
    console.log('===END STDERR===');
    console.warn(`Unable to capture grader result for ${netid}!`);
    console.warn(e);
    result.success = false;
    result.errors = ['Unable to capture grader output.'];

    if (argv.cleanup) { tempPathObj.removeCallback(); }
    else { console.log(`No --cleanup, files remain at ${tempPath}`); }

    return result;
  }



  if (argv.cleanup) { tempPathObj.removeCallback(); }
  else { console.log(`No --cleanup, files remain at ${tempPath}`); }
  return result;
};
