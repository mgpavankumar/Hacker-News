import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../src/controllers/authentication/password.js';
import { getJwtSecret } from '../environment.js';

test('salted hashes differ and verify only the correct password', async () => {
  const first = await hashPassword('Example-Password-1!');
  const second = await hashPassword('Example-Password-1!');
  assert.notEqual(first, second);
  assert.equal(await verifyPassword('Example-Password-1!', first), true);
  assert.equal(await verifyPassword('wrong', first), false);
});
test('invalid and legacy password hashes fail verification', async () => {
  for (const hash of ['not-a-hash', 'f'.repeat(64), 'scrypt$bad$bad']) assert.equal(await verifyPassword('example', hash), false);
});
test('JWT secret has no hardcoded fallback', () => {
  const previous = process.env.JWT_SECRET;
  try {
    delete process.env.JWT_SECRET;
    assert.throws(getJwtSecret, /at least 32 bytes/);
    process.env.JWT_SECRET = 'short';
    assert.throws(getJwtSecret, /at least 32 bytes/);
  } finally {
    if (previous === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previous;
  }
});
