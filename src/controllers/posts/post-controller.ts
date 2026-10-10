import { HTTPException } from 'hono/http-exception';
import { prisma } from '../../extras/prisma.js';
import { getPagination } from '../../extras/pagination.js';
import type { CreatePostParameters, CreatePostResult, GetPostsResult } from './post-type.js';

export async function createPost(parameters: CreatePostParameters & { authorId: string }): Promise<CreatePostResult> {
  return { post: await prisma.post.create({ data: parameters }) };
}
export async function getAllPosts(page = 1, limit = 10): Promise<GetPostsResult> {
  const { skip, take } = getPagination(page, limit);
  const [posts, totalPosts] = await Promise.all([prisma.post.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take, include: { author: { select: { id: true, username: true } } } }), prisma.post.count()]);
  return { posts, totalPosts, totalPages: Math.ceil(totalPosts / limit), currentPage: page };
}
export async function getUserPosts(userId: string, page = 1, limit = 10): Promise<GetPostsResult> {
  const { skip, take } = getPagination(page, limit);
  const where = { authorId: userId };
  const [posts, totalPosts] = await Promise.all([prisma.post.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take }), prisma.post.count({ where })]);
  return { posts, totalPosts, totalPages: Math.ceil(totalPosts / limit), currentPage: page };
}
export async function deletePost(postId: string, userId: string): Promise<void> {
  const deleted = await prisma.post.deleteMany({ where: { id: postId, authorId: userId } });
  if (!deleted.count) throw new HTTPException(404, { message: 'Post not found or not owned by you' });
}
