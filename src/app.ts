import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authenticationRoutes } from './routes/authentication-routes.js';
import { usersRoutes } from './routes/user-routes.js';
import { postsRoutes } from './routes/post-routes.js';
import { commentRoutes } from './routes/comments-routes.js';
import { likeRoutes } from './routes/likes-routes.js';

export function createApp() {
  const app = new Hono();
  app.use('*', secureHeaders());
  app.use('*', bodyLimit({ maxSize: 64 * 1024, onError: c => c.json({ error: 'Request body exceeds 64 KiB' }, 413) }));
  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store');
    await next();
  });
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return c.json({ error: 'Invalid request body' }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return c.json({ error: 'Record already exists' }, 409);
      if (error.code === 'P2025') return c.json({ error: 'Record not found' }, 404);
      if (error.code === 'P2003') return c.json({ error: 'Related record not found' }, 400);
    }
    console.error('Request failed:', error instanceof Error ? error.name : 'Unknown error');
    return c.json({ error: 'Internal server error' }, 500);
  });
  app.get('/', c => c.text('Hacker News API'));
  app.route('/auth', authenticationRoutes);
  app.route('/users', usersRoutes);
  app.route('/posts', postsRoutes);
  app.route('/comments', commentRoutes);
  app.route('/likes', likeRoutes);
  return app;
}
