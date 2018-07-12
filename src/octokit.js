const Octokit = require('@octokit/rest');

let octokit;
const host = 'https://github-dev.cs.illinois.edu/api/v3';

module.exports = () => {
  if (octokit) return octokit;

  octokit = Octokit({
    timeout: 5000,
    baseUrl: host,
  });

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GHE_TOKEN
  });

  return octokit;
};
