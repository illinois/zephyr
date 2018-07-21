import Octokit from '@octokit/rest';
import Debug from 'debug';
import fs from 'fs-extra';
import moment from 'moment';
import path from 'path';
import rp from 'request-promise-native';

const debug = Debug('zephyr:checkout');

export interface ICheckoutOptions {
  octokit: Octokit;
  owner: string;
  repo: string;
  repoPath: string;
  checkoutPath: string;
  files?: IFile[];
  ref?: string;
  timestamp?: string;
}

export interface IFile {
  name: string;
  required:boolean;
}

interface ICheckoutContext {
  owner: string;
  repo: string;
  ref: string;
  octokit: Octokit;
  files?: string[];
}

interface IGithubFile {
  name: string;
  size: number;
  type: 'file' | 'dir';
  path: string;
  download_url: string;
}

const doDownload = async (downloadUrl: string, checkoutPath: string) => {
  const body = await rp({ uri: downloadUrl, encoding: null });
  fs.ensureDirSync(path.join(checkoutPath, '..'));
  fs.writeFileSync(checkoutPath, body, {encoding: 'binary'});
  debug(`Saved: ${checkoutPath}`);
};

// If the files list is empty, we always need this file/directory
const needsFile = (filePath: string, files?: string[]) => !files || files.some((f) => f === filePath);
const needsDirectory = (filePath: string, files?: string[]) => !files || files.some((f) => f.startsWith(filePath));

const fetchDirectory = async (repoPath: string, checkoutPath: string, context: ICheckoutContext) => {
  const { files } = context;
  const res = await context.octokit.repos.getContent({
    owner: context.owner,
    repo: context.repo,
    path: repoPath,
    ref: context.ref,
  });

  const promises = res.data.map((d: IGithubFile) => {
    if (d.type === 'file' && d.size > 0) {
      // standard file
      if (needsFile(d.path, files)) {
        return doDownload(d.download_url, path.join(checkoutPath, d.name));
      }
    } else if (d.type === 'file' && d.size === 0) {
      // submodule? ignore for now
    } else if (d.type === 'dir') {
      if (needsDirectory(d.path, files)) {
        return fetchDirectory(d.path, path.join(checkoutPath, d.name), context);
      }
    } else {
      throw new Error(`Unknown git response: ${d}`);
    }
  });
  await Promise.all(promises);
};

const fetchMasterSha = async (context: ICheckoutContext) => {
  debug(`Fetching SHA of master for ${context.repo}`);

  const res = await context.octokit.gitdata.getReference({
    owner: context.owner,
    repo: context.repo,
    ref: 'heads/master',
  });
  return res.data.object.sha;
};

const fetchTimestampedSha = async (timestamp: string, context: ICheckoutContext) => {
  const commits = await context.octokit.repos.getCommits({
    owner: context.owner,
    repo: context.repo,
    per_page: 100,
    until: moment(timestamp).toISOString(),
  });

  return commits.data[0].sha;
};

export default async (options: ICheckoutOptions) => {
  const { repoPath, files, checkoutPath, timestamp, ...rest } = options;
  const checkoutContext: ICheckoutContext = {
    // If files were specified, we need to transform them to be prefixed with the repo path
    files: files && files.map((f: IFile) => path.join(repoPath, f.name)),
    ...rest,
  } as ICheckoutContext;

  if (timestamp) {
    checkoutContext.ref = await fetchTimestampedSha(timestamp, checkoutContext);
  } else if (!options.ref) {
    // Even if a timestamp isn't specified, we should still pin all requests to
    // a specific commit so that we don't have a condition where someone
    // pushes code in the middle of a checkout process
    checkoutContext.ref = await fetchMasterSha(checkoutContext);
  }

  await fetchDirectory(repoPath, checkoutPath, checkoutContext);
  return checkoutContext.ref;
};
