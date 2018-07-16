const fs = require('fs-extra');
const path = require('path');
const debug = require('debug')('zephyr:checkout');
const rp = require('request-promise-native');
const Octokit = require('./octokit');
const moment = require('moment');

const doDownload = async (downloadUrl, checkoutPath) => {
  const body = await rp({ uri: downloadUrl, encoding: null });
  fs.ensureDirSync(path.join(checkoutPath, '..'));
  fs.writeFileSync(checkoutPath, body, {encoding: 'binary'});
  debug(`Saved: ${checkoutPath}`);
};

// If the files list is empty, we always need this file/directory
const needsFile = (path, files) => !files.length || files.some(f => f == path);
const needsDirectory = (path, files) => !files.length || files.some(f => f.startsWith(path));

const fetchDirectory = async (repoPath, checkoutPath, context) => {
  const { files } = context;
  const res = await context.octokit.repos.getContent({
    owner: context.org,
    repo: context.repo,
    path: repoPath,
    ref: context.ref,
  });


  const promises = res.data.map(d => {
    if (d.type == 'file' && d.size > 0) {
      // standard file
      if (needsFile(d.path, files)) {
        return doDownload(d.download_url, path.join(checkoutPath, d.name));
      }
    } else if (d.type == 'file' && d.size == 0) {
      // submodule? ignore for now
    } else if (d.type == 'dir') {
      if (needsDirectory(d.path, files)) {
        return fetchDirectory(d.path, path.join(checkoutPath, d.name), context);
      }
    } else {
      console.error(`Unknown git response: ${d}`);
    }
  });
  await Promise.all(promises);
};

const fetchMasterSha = async (context) => {
  debug(`Fetching SHA of master for ${context.repo}`);

  const res = await context.octokit.gitdata.getReference({
    owner: context.org,
    repo: context.repo,
    ref: 'heads/master',
  });
  return res.data.object.sha;
};

const fetchTimestampedSha = async (timestamp, context) => {
  const commits = await context.octokit.repos.getCommits({
    owner: context.org,
    repo: context.repo,
    per_page: 100,
    until: moment(timestamp).toISOString()
  });

  return commits.data[0].sha;
};

module.exports = async ({ repoPath, files = [], checkoutPath, timestamp, ...options }) => {
  const fetchContext = {
    octokit: Octokit(),
    // If files were specified, we need to transform them to be prefixed with the repo path
    files: files.map(f => path.join(repoPath, f)),
    ...options,
  };

  if (timestamp) {
    fetchContext.ref = await fetchTimestampedSha(timestamp, fetchContext);
  } else {
    // Even if a timestamp isn't specified, we should still pin all requests to
    // a specific commit so that we don't have a condition where someone
    // pushes code in the middle of a checkout process
    fetchContext.ref = await fetchMasterSha(fetchContext);
  }

  await fetchDirectory(repoPath, checkoutPath, fetchContext);
  return fetchContext.ref;
};
