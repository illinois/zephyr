import fs from 'fs-extra';
import yaml from 'js-yaml';
import SimpleSchema from 'simpl-schema';
import { CourseConfig } from './types';

// We'll cache the loaded config here
let config: CourseConfig | null = null;

const makeGithubSchema = (name: string, repo = true) => {
  const schema = {
    [name]: Object,
    [`${name}.host`]: String,
    [`${name}.org`]: String,
  };
  if (repo) schema[`${name}.repo`] = String;
  return schema;
};

const schema = new SimpleSchema({
  ...makeGithubSchema('assignments'),
  ...makeGithubSchema('submissions', false),
  ...makeGithubSchema('grades'),
  ...makeGithubSchema('feedback'),
  'roster': [String],
});

export default function(): CourseConfig {
  if (!config) {
    if (!fs.existsSync('config.yml')) {
      throw new Error('config.yml not found! Please review Prerequisites.md to get started.');
    }

    config = yaml.safeLoad(fs.readFileSync('config.yml', {encoding: 'utf8'}));

    // This will throw an error if the schema is invalid
    schema.validate(config);
  }

  return config as CourseConfig;
};
