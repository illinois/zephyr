const fs = require('fs-extra');
const yaml = require('js-yaml');
const SimpleSchema = require('simpl-schema').default;

// We'll cache the loaded config here
let config = null;

const makeGithubSchema = (name, repo = true) => {
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

module.exports = function() {
  if (!config) {
    if (!fs.existsSync('config.yml')) {
      throw new Error('config.yml not found! Please review Prerequisites.md to get started.');
    }

    config = yaml.safeLoad(fs.readFileSync('config.yml'));

    // This will throw an error if the schema is invalid
    schema.validate(config);
  }

  return config;
};
