import { Hono } from 'hono';
import { tokenMiddleware, type AuthEnv } from './middleware/token-middleware.js';
import { createLike, deleteLikeOnPost, getLikesOnPost } from '../controllers/likes/like-controllers.js';
import { LikeStatus } from '../controllers/likes/like-types.js';

export const likeRoutes = new Hono<AuthEnv>();
likeRoutes.use('*', tokenMiddleware);
likeRoutes.post('/on/:postId', async c => {
  const result = await createLike({ postId: c.req.param('postId'), userId: c.get('userId') });
  return c.json(result, result.status === LikeStatus.ALREADY_LIKED ? 200 : 201);
});
likeRoutes.get('/on/:postId', async c => c.json(await getLikesOnPost({ postId: c.req.param('postId'), page: Number(c.req.query('page') ?? 1), limit: Number(c.req.query('limit') ?? 10) })));
likeRoutes.delete('/on/:postId', async c => c.json({ status: await deleteLikeOnPost({ postId: c.req.param('postId'), userId: c.get('userId') }) }));
