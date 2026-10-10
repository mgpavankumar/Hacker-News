import { Hono } from 'hono';
import { tokenMiddleware, type AuthEnv } from './middleware/token-middleware.js';
import { getAllUsers, getMe } from '../controllers/users/user-controller.js';

export const usersRoutes = new Hono<AuthEnv>();
usersRoutes.use('*', tokenMiddleware);
usersRoutes.get('/me', async c => c.json({ data: await getMe({ userId: c.get('userId') }) }));
usersRoutes.get('/', async c => c.json({ data: await getAllUsers(Number(c.req.query('page') ?? 1), Number(c.req.query('limit') ?? 10)) }));
