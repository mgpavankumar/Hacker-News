import { Hono } from 'hono';
import { z } from 'zod';
import { tokenMiddleware, type AuthEnv } from './middleware/token-middleware.js';
import { createPost, getAllPosts, getUserPosts, deletePost } from '../controllers/posts/post-controller.js';

export const postsRoutes = new Hono<AuthEnv>();
postsRoutes.use('*', tokenMiddleware);
postsRoutes.get('/', async c => c.json({ data: await getAllPosts(Number(c.req.query('page') ?? 1), Number(c.req.query('limit') ?? 10)) }));
postsRoutes.get('/me', async c => c.json({ data: await getUserPosts(c.get('userId'), Number(c.req.query('page') ?? 1), Number(c.req.query('limit') ?? 10)) }));
postsRoutes.post('/', async c => {
  const body = z.object({ title: z.string().trim().min(1).max(300), content: z.string().trim().min(1).max(10000) }).strict().parse(await c.req.json());
  return c.json({ data: (await createPost({ ...body, authorId: c.get('userId') })).post }, 201);
});
postsRoutes.delete('/:postId', async c => {
  await deletePost(c.req.param('postId'), c.get('userId'));
  return c.json({ message: 'Post deleted successfully' });
});
