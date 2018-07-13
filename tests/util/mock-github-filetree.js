const { get: lodashGet } = require('lodash');

const FILE = 'content';
const DEFAULT_FILES = {
  'mp1': {
    'tests': {
      'test1.cpp': FILE,
      'test2.cpp': FILE,
    },
    'mp1.cpp': FILE,
  },
  'mp2': {
    'file.txt': FILE,
  },
  '.gitignore': FILE,
};

// Wrapper around lodash get to return the object if the path is falsey
const get = (object, path) => path ? lodashGet(object, path) : object;

const makeFile = (path, contents) => ({
  name: path.split('/').slice(-1)[0],
  path,
  size: contents.length,
  type: 'file',
});

const makeDir = (path) => ({
  name: path.split('/').slice(-1)[0],
  path,
  size: 0,
  type: 'dir',
});

const getFileInfo = (files, path) => {
  // Resolve "/" to the root, aka empty string
  const objectPath = path === '/' ? '' : path.split('/').join('.');
  const resolvedFile = get(files, objectPath);
  if (!resolvedFile) throw new Error(`File ${path} not found`);
  if (typeof resolvedFile === 'string') {
    return [makeFile(path, resolvedFile)];
  } else {
    // Assume object
    return Object.keys(resolvedFile).map(name => {
      const f = resolvedFile[name];
      if (typeof f === 'string') {
        return makeFile(`${path}/${name}`, f);
      } else {
        return makeDir(`${path}/${name}`);
      }
    });
  }
};

module.exports = (files = DEFAULT_FILES) => async ({ path }) => getFileInfo(files, path);
