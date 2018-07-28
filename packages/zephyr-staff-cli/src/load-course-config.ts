import fs from 'fs-extra';
import yaml from 'js-yaml';
import SimpleSchema from 'simpl-schema';

export interface IGithubConfig {
  host: string;
  owner: string;
}

export interface IRepoConfig extends IGithubConfig {
  repo: string;
}

export interface ICourseConfig {
  assignments: IRepoConfig;
  submissions: IGithubConfig;
  grades: IRepoConfig;
  feedback: IRepoConfig;
  roster: string[];
}

// We'll cache the loaded config here
let config: ICourseConfig | null = null;

const makeGithubSchema = (name: string, repo = true): any => {
  const githubSchema = {
    [name]: Object,
    [`${name}.host`]: String,
    [`${name}.owner`]: String,
  };
  if (repo) { githubSchema[`${name}.repo`] = String; }
  return githubSchema;
};

const schema = new SimpleSchema({
  ...makeGithubSchema('assignments'),
  ...makeGithubSchema('submissions', false),
  ...makeGithubSchema('grades'),
  ...makeGithubSchema('feedback'),
  roster: [String],
});

export default function(): ICourseConfig {
  if (!config) {
    if (!fs.existsSync('config.yml')) {
      throw new Error('config.yml not found! Please review Prerequisites.md to get started.');
    }

    config = yaml.safeLoad(fs.readFileSync('config.yml', {encoding: 'utf8'}));

    // This will throw an error if the schema is invalid
    schema.validate(config);
  }

  return config as ICourseConfig;
}
