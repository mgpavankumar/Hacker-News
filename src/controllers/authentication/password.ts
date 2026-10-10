import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const deriveKey = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const key = await deriveKey(password, salt, 64) as Buffer;
  return `scrypt$${salt}$${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, key, extra] = stored.split('$');
  // Legacy unsalted SHA-256 hashes require a password reset; never treat them as scrypt.
  if (algorithm !== 'scrypt' || extra !== undefined || !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(key ?? '')) return false;
  const actual = await deriveKey(password, salt, 64) as Buffer;
  return timingSafeEqual(Buffer.from(key, 'hex'), actual);
}
