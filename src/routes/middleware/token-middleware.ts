import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { getJwtSecret, jwtIssuer, jwtAudience } from '../../../environment.js';

export type AuthEnv = { Variables: { userId: string } };

export const tokenMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const authorization = c.req.header('Authorization');
  const token = authorization ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1] : c.req.header('token');
  if (!token) return c.json({ error: 'Missing or invalid token' }, 401);
  const secret = getJwtSecret();
  let payload: jwt.JwtPayload;
  try {
    const verified = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: jwtIssuer, audience: jwtAudience });
    if (typeof verified === 'string' || typeof verified.sub !== 'string' || !verified.sub) return c.json({ error: 'Unauthorized' }, 401);
    payload = verified;
  } catch {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', payload.sub!);
  // Downstream exceptions belong to the API error handler, not token validation.
  await next();
});
