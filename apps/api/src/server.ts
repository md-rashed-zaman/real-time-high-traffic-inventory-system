import { createServer } from 'node:http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { createSocketServer } from './realtime/socket.js';
import { startExpirationWorker } from './jobs/expire-reservations.js';

const app = createApp();
const server = createServer(app);

createSocketServer(server);
startExpirationWorker();

server.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});
