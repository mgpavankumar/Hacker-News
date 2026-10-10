import { getConnInfo } from '@hono/node-server/conninfo';
import { prisma } from '../extras/prisma.js';
import { authLimitKey, consumeAuthLimit } from '../extras/auth-rate-limit.js';
import { tokenMiddleware, type AuthEnv } from './middleware/token-middleware.js';
import { Hono } from 'hono';
import { z } from 'zod';
import { signUpWithUsernameAndPassword, logInWithUsernameAndPassword } from '../controllers/authentication/authentication-controller.js';

const credentials = z.object({ username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/), password: z.string().min(8).max(128) }).strict();
export const authenticationRoutes = new Hono<AuthEnv>();
for (const action of ['signup', 'login'] as const) {
  authenticationRoutes.post(`/${action}`, async c => {
    let peer = 'unknown';
    try { peer = getConnInfo(c).remote.address ?? peer; } catch { /* In-process test requests have no socket. */ }
    // Ignore all forwarded headers. Behind a proxy this conservatively limits the proxy address.
    const clientLimit = await consumeAuthLimit(authLimitKey(`client:${action}`, peer), 60);
    if (!clientLimit.allowed) {
      c.header('Retry-After', String(clientLimit.retryAfter));
      return c.json({ error: 'Too many authentication requests' }, 429);
    }
    const body = credentials.parse(await c.req.json());
    const accountLimit = await consumeAuthLimit(authLimitKey(`account:${action}`, body.username.toLowerCase()), 10);
    if (!accountLimit.allowed) {
      c.header('Retry-After', String(accountLimit.retryAfter));
      return c.json({ error: 'Too many authentication requests' }, 429);
    }
    const result = action === 'signup' ? await signUpWithUsernameAndPassword(body) : await logInWithUsernameAndPassword(body);
    return c.json(result, action === 'signup' ? 201 : 200);
  });
}
authenticationRoutes.post('/logout', tokenMiddleware, async c => {
  await prisma.session.deleteMany({ where: { id: c.get('sessionId'), userId: c.get('userId') } });
  return c.body(null, 204);
});
authenticationRoutes.post('/logout-all', tokenMiddleware, async c => {
  await prisma.session.deleteMany({ where: { userId: c.get('userId') } });
  return c.body(null, 204);
});
