import Octokit from '@octokit/rest';

const DEFAULT_HOST = 'https://github-dev.cs.illinois.edu/api/v3';

export default (host: string = DEFAULT_HOST) => {
  const octokit = new Octokit({
    timeout: 5000,
    baseUrl: host,
  });

  octokit.authenticate({
    type: 'oauth',
    token: process.env.GHE_TOKEN as string,
  });

  return octokit;
};
