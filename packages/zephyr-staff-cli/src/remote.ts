import { IOptions } from './index';
import rp from 'request-promise-native';
import loadCourseConfig from './load-course-config';

export default async (options: IOptions) => {
  // For now, we'll require a netid
  if (!options.netid) {
    throw new Error('--netid must be specified!');
  }

  const requestBody = {
    githubToken: process.env.GHE_TOKEN,
    assignment: options.assignment,
    run: options.run,
    netid: options.netid,
    courseConfig: loadCourseConfig(),
  }

  const requestOptions = {
    method: 'POST',
    uri: 'http://localhost:3000',
    body: requestBody,
    json: true,
  }

  console.log('posting...')

  const results = await rp(requestOptions);

  console.log(JSON.stringify(results, undefined, 2));
}