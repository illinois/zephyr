import * as http from 'http';
import grade from '@illinois/zephyr-staff-cli/lib/grade';

export default ((req: http.IncomingMessage, res: http.ServerResponse) => {
  res.end('hello, world!');
});