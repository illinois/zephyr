import fs from 'fs-extra';
import path from 'path';

export default function mergeIntoDirectory(srcPath: string, destPath: string) {
  fs.readdirSync(srcPath).forEach((fileName) => {
    const src = path.join(srcPath, fileName);
    const dest = path.join(destPath, fileName);
    let isSame;

    if ( fs.lstatSync(src).isDirectory() ) {
      fs.ensureDirSync(dest);
      isSame = mergeIntoDirectory(src, dest);
    } else {
      if (fs.existsSync(dest)) {
        const srcContents = fs.readFileSync(src, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');
        const destContents = fs.readFileSync(dest, {encoding: 'utf8'}).replace(/[\n\r]/gm, '');
        isSame = srcContents === destContents;
      } else {
        isSame = false;
      }
      if (!isSame) { fs.copySync(src, dest); }
    }
  });
}
