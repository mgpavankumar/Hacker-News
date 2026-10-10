import { prisma } from '../../extras/prisma.js';
import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { getJwtSecret, jwtIssuer, jwtAudience } from '../../../environment.js';

export type AuthEnv = { Variables: { userId: string; sessionId: string } };

export const tokenMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  const token = authorization ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] : c.req.header('token');
  if (!token) return c.json({ error: 'Missing or invalid token' }, 401);
  const secret = getJwtSecret();
  let payload: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: jwtIssuer, audience: jwtAudience });
    if (typeof verified === 'string' || typeof verified.sub !== 'string' || !verified.sub || typeof verified.jti !== 'string' || typeof verified.exp !== 'number') return c.json({ error: 'Unauthorized' }, 401);
    payload = verified;
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const session = await prisma.session.findUnique({ where: { id: payload.jti! } });
  if (!session || session.userId !== payload.sub || session.expiresAt.getTime() <= Date.now()) return c.json({ error: 'Unauthorized' }, 401);
  c.set('userId', payload.sub!);
  c.set('sessionId', session.id);
  // Downstream exceptions belong to the API error handler, not token validation.
  await next();
});
