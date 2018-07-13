const Octokit = require('@octokit/rest');

const octokits = {};
const DEFAULT_HOST = 'https://github-dev.cs.illinois.edu/api/v3';

module.exports = (host = DEFAULT_HOST) => {
  if (octokits[host]) return octokits[host];

  const octokit = Octokit({
    timeout: 5000,
    baseUrl: host,
  });

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GHE_TOKEN
  });

  octokits[host] = octokit;

  return octokit;
};
