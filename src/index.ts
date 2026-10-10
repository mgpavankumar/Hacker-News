import { Server } from 'node:http';
import { getPort, requireDatabase, registerShutdown } from './operations.js';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { prisma } from './extras/prisma.js';
import { getJwtSecret } from '../environment.js';

getJwtSecret();
requireDatabase();
const server = serve({ fetch: createApp().fetch, port: getPort() }, info => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
if (!(server instanceof Server)) throw new Error('Expected an HTTP/1 server');
server.requestTimeout = 15000;
server.headersTimeout = 10000;
registerShutdown(server, () => prisma.$disconnect());
