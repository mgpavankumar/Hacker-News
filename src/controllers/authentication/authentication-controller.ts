import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { HTTPException } from 'hono/http-exception';
import { prisma } from '../../extras/prisma.js';
import { getJwtSecret, jwtIssuer, jwtAudience } from '../../../environment.js';
import { hashPassword, verifyPassword } from './password.js';
import type { PublicUser, SignUpWithUsernameAndPasswordResult } from './authentication-types.js';

export const publicUserSelect = { id: true, username: true, name: true, createdAt: true, updatedAt: true } as const;
async function resultFor(user: PublicUser, database: Prisma.TransactionClient = prisma): Promise<SignUpWithUsernameAndPasswordResult> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 3600000);
  const token = jwt.sign({ username: user.username }, getJwtSecret(), { algorithm: 'HS256', subject: user.id, jwtid: id, issuer: jwtIssuer, audience: jwtAudience, expiresIn: '1h' });
  await database.session.create({ data: { id, userId: user.id, expiresAt } });
  return { user, token };
}

export async function signUpWithUsernameAndPassword(parameters: { username: string; password: string }): Promise<SignUpWithUsernameAndPasswordResult> {
  // Check configuration before creating the account.
  getJwtSecret();
  const password = await hashPassword(parameters.password);
  return prisma.$transaction(async tx => {
    const user = await tx.user.create({ data: { username: parameters.username, password }, select: publicUserSelect });
    return resultFor(user, tx);
  });
}

export async function logInWithUsernameAndPassword(parameters: { username: string; password: string }): Promise<SignUpWithUsernameAndPasswordResult> {
  const stored = await prisma.user.findUnique({ where: { username: parameters.username } });
  // Spend the same password-derivation work for absent accounts. This is not an accepted account hash.
  const candidate = stored?.password ?? `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;
  const valid = await verifyPassword(parameters.password, candidate);
  if (!stored || !valid) throw new HTTPException(401, { message: 'Incorrect username or password' });
  const { password: _password, ...user } = stored;
  return resultFor(user);
}
