import { Hono } from 'hono';
import { z } from 'zod';
import { signUpWithUsernameAndPassword, logInWithUsernameAndPassword } from '../controllers/authentication/authentication-controller.js';

const credentials = z.object({ username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/), password: z.string().min(8).max(128) }).strict();
export const authenticationRoutes = new Hono();
authenticationRoutes.post('/signup', async c => c.json(await signUpWithUsernameAndPassword(credentials.parse(await c.req.json())), 201));
authenticationRoutes.post('/login', async c => c.json(await logInWithUsernameAndPassword(credentials.parse(await c.req.json()))));
