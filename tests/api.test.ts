import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { prisma } from '../src/extras/prisma.js';
import { jwtIssuer, jwtAudience } from '../environment.js';

const app = createApp();
const users: string[] = [];
before(() => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a dedicated test database');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
});
after(async () => {
  await prisma.user.deleteMany({ where: { id: { in: users } } });
  await prisma.$disconnect();
});
const json = (method: string, body: unknown, token?: string) => ({ method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
const auth = (token: string, method = 'GET') => ({ method, headers: { Authorization: `Bearer ${token}` } });
async function account() {
  const username = `test_${randomUUID().replaceAll('-', '')}`;
  const response = await app.request('/auth/signup', json('POST', { username, password: 'Example-Password-1!' }));
  assert.equal(response.status, 201);
  const result = await response.json(); users.push(result.user.id);
  return { ...result, username };
}
test('signup, login, public user responses, and duplicate usernames', async () => {
  const user = await account();
  assert.equal('password' in user.user, false);
  const stored = await prisma.user.findUniqueOrThrow({ where: { id: user.user.id } });
  assert.match(stored.password, /^scrypt\$/);
  const login = await app.request('/auth/login', json('POST', { username: user.username, password: 'Example-Password-1!' }));
  assert.equal(login.status, 200);
  assert.equal('password' in (await login.json()).user, false);
  assert.equal((await app.request('/auth/login', json('POST', { username: user.username, password: 'Wrong-Password!' }))).status, 401);
  assert.equal((await app.request('/auth/signup', json('POST', { username: user.username, password: 'Example-Password-1!' }))).status, 409);
  if (process.env.PGLITE_TEST === '1') await prisma.$disconnect();
  const me = await app.request('/users/me', auth(user.token));
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.id, user.user.id);
  const list = await app.request('/users', auth(user.token));
  assert.equal(list.status, 200);
  for (const listed of (await list.json()).data.users) assert.equal('password' in listed, false);
});
test('missing, forged, expired, and wrong-audience tokens are rejected', async () => {
  const user = await account();
  assert.equal((await app.request('/posts')).status, 401);
  const options = { subject: user.user.id, issuer: jwtIssuer, audience: jwtAudience, algorithm: 'HS256' as const };
  const expired = jwt.sign({}, process.env.JWT_SECRET!, { ...options, expiresIn: -1 });
  const wrongAudience = jwt.sign({}, process.env.JWT_SECRET!, { ...options, audience: 'other-client', expiresIn: '1h' });
  const wrongSignature = jwt.sign({}, randomBytes(32).toString('hex'), { ...options, expiresIn: '1h' });
  for (const token of ['invalid', expired, wrongAudience, wrongSignature]) assert.equal((await app.request('/posts', auth(token))).status, 401);
  assert.equal((await app.request('/posts', { headers: { Authorization: 'Basic abc', token: user.token } })).status, 401);
  // Legacy clients can still send the token header.
  assert.equal((await app.request('/posts', { headers: { token: user.token } })).status, 200);
});
test('posts, comments, likes, and ownership across two users', async () => {
  const owner = await account(), other = await account();
  const response = await app.request('/posts', json('POST', { title: 'Test Post', content: 'Test content' }, owner.token));
  assert.equal(response.status, 201);
  const post = (await response.json()).data;
  assert.equal((await app.request('/posts/me', auth(owner.token))).status, 200);
  const cr = await app.request(`/comments/on/${post.id}`, json('POST', { content: 'Test comment' }, owner.token));
  assert.equal(cr.status, 201); const comment = (await cr.json()).comment;
  assert.equal((await app.request(`/comments/${comment.id}`, json('PATCH', { content: 'Tampered' }, other.token))).status, 404);
  assert.equal((await app.request(`/comments/${comment.id}`, auth(other.token, 'DELETE'))).status, 404);
  assert.equal((await prisma.comment.findUniqueOrThrow({ where: { id: comment.id } })).content, 'Test comment');
  assert.equal((await app.request(`/comments/${comment.id}`, json('PATCH', { content: 'Updated' }, owner.token))).status, 200);
  assert.equal((await app.request(`/comments/on/${post.id}`, auth(owner.token))).status, 200);
  assert.equal((await app.request(`/likes/on/${post.id}`, auth(other.token, 'POST'))).status, 201);
  assert.equal((await app.request(`/likes/on/${post.id}`, auth(other.token, 'POST'))).status, 200);
  if (process.env.PGLITE_TEST === '1') await prisma.$disconnect();
  assert.equal(await prisma.like.count({ where: { postId: post.id, userId: other.user.id } }), 1);
  assert.equal((await app.request(`/likes/on/${post.id}`, auth(owner.token))).status, 200);
  assert.equal((await app.request(`/likes/on/${post.id}`, auth(other.token, 'DELETE'))).status, 200);
  assert.equal((await app.request(`/comments/${comment.id}`, auth(owner.token, 'DELETE'))).status, 200);
  await app.request(`/comments/on/${post.id}`, json('POST', { content: 'Cascade comment' }, owner.token));
  await app.request(`/likes/on/${post.id}`, auth(other.token, 'POST'));
  assert.equal((await app.request(`/posts/${post.id}`, auth(other.token, 'DELETE'))).status, 404);
  assert.equal((await app.request(`/posts/${post.id}`, auth(owner.token, 'DELETE'))).status, 200);
  assert.equal(await prisma.comment.count({ where: { postId: post.id } }), 0);
  assert.equal(await prisma.like.count({ where: { postId: post.id } }), 0);
});
test('invalid bodies, pagination, and missing resources', async () => {
  const user = await account();
  assert.equal((await app.request('/auth/signup', json('POST', { username: 'bad', password: 'short' }))).status, 400);
  assert.equal((await app.request('/posts', json('POST', { title: '', content: 'text' }, user.token))).status, 400);
  assert.equal((await app.request('/posts?page=NaN', auth(user.token))).status, 400);
  assert.equal((await app.request('/users?limit=101', auth(user.token))).status, 400);
  assert.equal((await app.request('/comments/on/missing', auth(user.token))).status, 404);
  assert.equal((await app.request('/likes/on/missing', auth(user.token, 'POST'))).status, 404);
  assert.equal((await app.request('/posts', { ...auth(user.token, 'POST'), body: '{' })).status, 400);
});
