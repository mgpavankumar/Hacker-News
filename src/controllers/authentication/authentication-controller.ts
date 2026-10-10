import jwt from 'jsonwebtoken';
import { HTTPException } from 'hono/http-exception';
import { prisma } from '../../extras/prisma.js';
import { getJwtSecret, jwtIssuer, jwtAudience } from '../../../environment.js';
import { hashPassword, verifyPassword } from './password.js';
import type { PublicUser, SignUpWithUsernameAndPasswordResult } from './authentication-types.js';

export const publicUserSelect = { id: true, username: true, name: true, createdAt: true, updatedAt: true } as const;
const resultFor = (user: PublicUser): SignUpWithUsernameAndPasswordResult => ({
  user,
  token: jwt.sign({ username: user.username }, getJwtSecret(), { algorithm: 'HS256', subject: user.id, issuer: jwtIssuer, audience: jwtAudience, expiresIn: '1h' }),
});

export async function signUpWithUsernameAndPassword(parameters: { username: string; password: string }): Promise<SignUpWithUsernameAndPasswordResult> {
  // Check configuration before creating the account.
  getJwtSecret();
  const password = await hashPassword(parameters.password);
  const user = await prisma.user.create({ data: { username: parameters.username, password }, select: publicUserSelect });
  return resultFor(user);
}

export async function logInWithUsernameAndPassword(parameters: { username: string; password: string }): Promise<SignUpWithUsernameAndPasswordResult> {
  const stored = await prisma.user.findUnique({ where: { username: parameters.username } });
  if (!stored || !await verifyPassword(parameters.password, stored.password)) throw new HTTPException(401, { message: 'Incorrect username or password' });
  const { password: _password, ...user } = stored;
  return resultFor(user);
}
