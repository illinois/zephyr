const fs = require("fs-extra");
const path = require("path");
const debug = require('debug')('zephyr:code-runner:fetchAssignment');
const rp = require('request-promise-native');
const Octokit = require('@octokit/rest');

const doDownload = async (downloadUrl, localSavePath) => {
  const body = await rp({ uri: downloadUrl, encoding: null });
  fs.ensureDirSync(path.join(localSavePath, ".."));
  fs.writeFileSync(localSavePath, body, {encoding: 'binary'});
  debug("Saved: " + localSavePath);
};

const fetchDirectory = async (repoPath, localSavePath, options) => {
  const res = await options.octokit.repos.getContent({
    owner: options.org,
    repo: options.repo,
    path: repoPath,
    ref: options.ref,
  });

  const promises = res.data.map(d => {
    if (d.type == "file" && d.size > 0) {
      // standard file
      return doDownload(d.download_url, path.join(localSavePath, d.name), );
    } else if (d.type == "file" && d.size == 0) {
      // submodule
      // - d.submodule_git_url
      if (d.name == "cs225") {
        const newOptions = {
          ...options,
          repo: 'libcs225'
        };
        return fetchDirectory('.', path.join(localSavePath, d.name), newOptions);
      } else {
        fs.ensureDirSync(path.join(path.join(localSavePath, d.name), ".."));
        fs.writeFileSync(path.join(localSavePath, d.name), '', {encoding: 'binary'});
      }
    } else if (d.type == "dir") {
      return fetchDirectory(d.path, path.join(localSavePath, d.name), options);
    }
    else {
      console.error("Unknown git response: " + d);
    }
  });
  await Promise.all(promises);
};


module.exports = async (checkoutPath, repoPath, host, org, repo, ref = 'master') => {
  const octokit = Octokit({
    timeout: 5000,
    baseUrl: host,
  });

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GHE_TOKEN
  });

  const fetchContext = {
    octokit,
    org,
    repo,
    ref,
  };

  await fetchDirectory(repoPath, checkoutPath, fetchContext);
};
