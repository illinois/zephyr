const rp = require('request-promise-native');

let enabled = false;

const sendMessage = (prefix = '') => (message, attachment = null) => {
  if (!enabled) return;
  rp({
    method: 'POST',
    uri: 'https://hooks.slack.com/services/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',
    body: {
      text: `${prefix} ${message}`,
      attachments: attachment && [{ text: attachment }],
    },
    json: true
  });
};

module.exports = {
  enable: () => { enabled = true; },
  success: sendMessage(':heavy_check_mark:'),
  failure:sendMessage(':x:'),
  unknown: sendMessage(':question:'),
  start: sendMessage(':arrow_forward:'),
  warning: sendMessage(':warning:'),
  error: sendMessage(':heavy_exclamation_mark: <!channel>'),
  message: sendMessage(),
  finished: sendMessage(':tada:'),
};
