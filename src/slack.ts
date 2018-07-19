import rp from 'request-promise-native';

let enabled = false;

type SendMessage = (prefix?: string) => (msg: string, attachment?: string) => void;

const sendMessage: SendMessage = (prefix = '') => (msg: string, attachment = undefined) => {
  if (!enabled) { return; }
  rp({
    method: 'POST',
    uri: 'https://hooks.slack.com/services/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',
    body: {
      text: `${prefix} ${msg}`,
      attachments: attachment && [{ text: attachment }],
    },
    json: true,
  });
};

export const enable = () => { enabled = true; };
export const success = sendMessage(':heavy_check_mark:');
export const failure = sendMessage(':x:');
export const unknown = sendMessage(':question:');
export const start = sendMessage(':arrow_forward:');
export const warning = sendMessage(':warning:');
export const error = sendMessage(':heavy_exclamation_mark: <!channel>');
export const message = sendMessage();
export const finished = sendMessage(':tada:');
