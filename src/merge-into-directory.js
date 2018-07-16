const path = require('path');
const fs = require('fs-extra');

function mergeIntoDirectory(srcPath, destPath) {
  fs.readdirSync(srcPath).forEach(function (fileName) {
    const src = path.join(srcPath, fileName);
    const dest = path.join(destPath, fileName);
    let isSame;

    if ( fs.lstatSync(src).isDirectory() ) {
      fs.ensureDirSync(dest);
      isSame = mergeIntoDirectory(src, dest);
    } else {
      if (fs.existsSync(dest)) {
        const src_str = fs.readFileSync(src, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');
        const dest_str = fs.readFileSync(dest, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');
        isSame = src_str == dest_str;
      } else {
        isSame = false;
      }

      if (!isSame) { fs.copySync(src, dest); }
    }
  });
}

module.exports = mergeIntoDirectory;
