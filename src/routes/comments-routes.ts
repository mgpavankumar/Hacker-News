import { Hono } from 'hono';
import { z } from 'zod';
import { tokenMiddleware, type AuthEnv } from './middleware/token-middleware.js';
import { createComment, deleteComment, getAllComments, updateComment } from '../controllers/comments/comments-controller.js';

const bodySchema = z.object({ content: z.string().trim().min(1).max(5000) }).strict();
export const commentRoutes = new Hono<AuthEnv>();
commentRoutes.use('*', tokenMiddleware);
commentRoutes.post('/on/:postId', async c => c.json(await createComment({ ...bodySchema.parse(await c.req.json()), postId: c.req.param('postId'), userId: c.get('userId') }), 201));
commentRoutes.get('/on/:postId', async c => c.json(await getAllComments({ postId: c.req.param('postId'), page: Number(c.req.query('page') ?? 1), limit: Number(c.req.query('limit') ?? 10) })));
commentRoutes.delete('/:commentId', async c => c.json({ status: await deleteComment({ commentId: c.req.param('commentId'), userId: c.get('userId') }) }));
commentRoutes.patch('/:commentId', async c => c.json({ status: await updateComment({ ...bodySchema.parse(await c.req.json()), commentId: c.req.param('commentId'), userId: c.get('userId') }) }));
