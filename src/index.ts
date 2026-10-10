import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { prisma } from './extras/prisma.js';
import { getJwtSecret } from '../environment.js';

getJwtSecret();
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const server = serve({ fetch: createApp().fetch, port: Number(process.env.PORT ?? 3000) }, info => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { server.close(() => { void prisma.$disconnect().finally(() => process.exit(0)); }); });
}
