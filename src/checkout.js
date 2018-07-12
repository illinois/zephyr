const fs = require('fs-extra');
const path = require('path');
const debug = require('debug')('zephyr:code-runner:fetchAssignment');
const rp = require('request-promise-native');
const Octokit = require('@octokit/rest');
const moment = require('moment');

const host = 'https://github-dev.cs.illinois.edu/api/v3';

const doDownload = async (downloadUrl, localSavePath) => {
  const body = await rp({ uri: downloadUrl, encoding: null });
  fs.ensureDirSync(path.join(localSavePath, '..'));
  fs.writeFileSync(localSavePath, body, {encoding: 'binary'});
  debug(`Saved: ${  localSavePath}`);
};

const fetchDirectory = async (repoPath, localSavePath, context) => {
  const res = await context.octokit.repos.getContent({
    owner: context.org,
    repo: context.repo,
    path: repoPath,
    ref: context.ref,
  });

  const promises = res.data.map(d => {
    if (d.type == 'file' && d.size > 0) {
      // standard file
      return doDownload(d.download_url, path.join(localSavePath, d.name), );
    } else if (d.type == 'file' && d.size == 0) {
      // submodule
      // - d.submodule_git_url
      if (d.name == 'cs225') {
        const newContext = {
          ...context,
          repo: 'libcs225'
        };
        return fetchDirectory('.', path.join(localSavePath, d.name), newContext);
      } else {
        fs.ensureDirSync(path.join(path.join(localSavePath, d.name), '..'));
        fs.writeFileSync(path.join(localSavePath, d.name), '', {encoding: 'binary'});
      }
    } else if (d.type == 'dir') {
      return fetchDirectory(d.path, path.join(localSavePath, d.name), context);
    } else {
      console.error(`Unknown git response: ${  d}`);
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

module.exports = async ({ repoPath, checkoutPath, timestamp, ...options }) => {
  const octokit = Octokit({
    timeout: 5000,
    baseUrl: options.host || host,
  });

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GHE_TOKEN
  });

  const fetchContext = {
    octokit,
    ...options,
  };

  if (timestamp) {
    fetchContext.ref = await fetchTimestampedSha();
  } else {
    // Even if a timestamp isn't specified, we should still pin all requests to
    // a specific commit so that we don't have a condition where someone
    // pushes code in the middle of a checkout process
    fetchContext.ref = await fetchMasterSha();
  }

  await fetchDirectory(repoPath, checkoutPath, fetchContext);
};
