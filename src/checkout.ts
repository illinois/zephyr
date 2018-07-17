import fs from 'fs-extra';
import path from 'path';
const debug = require('debug')('zephyr:checkout');
import rp from 'request-promise-native';
import Octokit from './octokit';
import moment from 'moment';
import Github from '@octokit/rest';
import { StudentFile, CheckoutOptions } from './types';

interface CheckoutContext {
  files: string[],
  org: string,
  repo: string,
  ref: string,
  octokit: Github
}

interface GithubFile {
  name: string,
  size: number,
  type: 'file' | 'dir',
  path: string,
  download_url: string,
}

const doDownload = async (downloadUrl: string, checkoutPath: string) => {
  const body = await rp({ uri: downloadUrl, encoding: null });
  fs.ensureDirSync(path.join(checkoutPath, '..'));
  fs.writeFileSync(checkoutPath, body, {encoding: 'binary'});
  debug(`Saved: ${checkoutPath}`);
};

// If the files list is empty, we always need this file/directory
const needsFile = (path: string, files: string[]) => !files.length || files.some(f => f == path);
const needsDirectory = (path: string, files: string[]) => !files.length || files.some(f => f.startsWith(path));

const fetchDirectory = async (repoPath: string, checkoutPath: string, context: CheckoutContext) => {
  const { files } = context;
  const res = await context.octokit.repos.getContent({
    owner: context.org,
    repo: context.repo,
    path: repoPath,
    ref: context.ref,
  });

  const promises = res.data.map((d: GithubFile) => {
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

const fetchMasterSha = async (context: CheckoutContext) => {
  debug(`Fetching SHA of master for ${context.repo}`);

  const res = await context.octokit.gitdata.getReference({
    owner: context.org,
    repo: context.repo,
    ref: 'heads/master',
  });
  return res.data.object.sha;
};

const fetchTimestampedSha = async (timestamp: string, context: CheckoutContext) => {
  const commits = await context.octokit.repos.getCommits({
    owner: context.org,
    repo: context.repo,
    per_page: 100,
    until: moment(timestamp).toISOString()
  });

  return commits.data[0].sha;
};

export default async (options: CheckoutOptions) => {
  const { repoPath, files, checkoutPath, timestamp, ...rest } = options;
  const checkoutContext: CheckoutContext = {
    octokit: Octokit(),
    // If files were specified, we need to transform them to be prefixed with the repo path
    files: files && files.map((f: StudentFile) => path.join(repoPath, f.name)),
    ...rest,
  } as CheckoutContext;

  if (timestamp) {
    checkoutContext.ref = await fetchTimestampedSha(timestamp, checkoutContext);
  } else {
    // Even if a timestamp isn't specified, we should still pin all requests to
    // a specific commit so that we don't have a condition where someone
    // pushes code in the middle of a checkout process
    checkoutContext.ref = await fetchMasterSha(checkoutContext);
  }

  await fetchDirectory(repoPath, checkoutPath, checkoutContext);
  return checkoutContext.ref;
};
