const fs = require('fs-extra');
const yaml = require('js-yaml');
const SimpleSchema = require('simpl-schema').default;

// We'll cache the loaded config here
let config = null;

const schema = new SimpleSchema({
  'assignments': Object,
  'assignments.host': String,
  'assignments.org': String,
  'assignments.repo': String,
  'submissions': Object,
  'submissions.host': String,
  'submissions.org': String,
  'grades': Object,
  'grades.host': String,
  'grades.org': String,
  'grades.repo': String,
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
