import { HTTPException } from 'hono/http-exception';
import { Prisma } from '@prisma/client';
import { getPagination } from '../../extras/pagination.js';
import { prisma } from '../../extras/prisma.js';
import { LikeStatus, type LikeCreate } from './like-types.js';

export async function createLike(params: { postId: string; userId: string }): Promise<LikeCreate> {
  if (!await prisma.post.findUnique({ where: { id: params.postId } })) throw new HTTPException(404, { message: 'Post not found' });
  try {
    await prisma.like.create({ data: params });
    return { status: LikeStatus.LIKE_SUCCESS };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return { status: LikeStatus.ALREADY_LIKED };
    throw error;
  }
}
export async function getLikesOnPost(params: { postId: string; page: number; limit: number }) {
  const { skip, take } = getPagination(params.page, params.limit);
  if (!await prisma.post.findUnique({ where: { id: params.postId } })) throw new HTTPException(404, { message: 'Post not found' });
  return { likes: await prisma.like.findMany({ where: { postId: params.postId }, skip, take, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { user: { select: { id: true, username: true } } } }) };
}
export async function deleteLikeOnPost(params: { postId: string; userId: string }): Promise<LikeStatus> {
  const result = await prisma.like.deleteMany({ where: params });
  if (!result.count) throw new HTTPException(404, { message: 'Like not found' });
  return LikeStatus.LIKE_DELETED;
}
