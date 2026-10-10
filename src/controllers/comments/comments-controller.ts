import { HTTPException } from 'hono/http-exception';
import { getPagination } from '../../extras/pagination.js';
import { prisma } from '../../extras/prisma.js';
import { CommentStatus, type CreatCommentResult } from './comments-type.js';

export async function createComment(params: { content: string; postId: string; userId: string }): Promise<CreatCommentResult> {
  if (!await prisma.post.findUnique({ where: { id: params.postId } })) throw new HTTPException(404, { message: 'Post not found' });
  return { comment: await prisma.comment.create({ data: params }) };
}
export async function getAllComments(params: { postId: string; page: number; limit: number }) {
  const { skip, take } = getPagination(params.page, params.limit);
  if (!await prisma.post.findUnique({ where: { id: params.postId } })) throw new HTTPException(404, { message: 'Post not found' });
  return { comments: await prisma.comment.findMany({ where: { postId: params.postId }, skip, take, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], include: { user: { select: { id: true, username: true } } } }) };
}
export async function deleteComment(params: { commentId: string; userId: string }) {
  const result = await prisma.comment.deleteMany({ where: { id: params.commentId, userId: params.userId } });
  if (!result.count) throw new HTTPException(404, { message: 'Comment not found or not owned by you' });
  return CommentStatus.DELETE_SUCCESS;
}
export async function updateComment(params: { commentId: string; userId: string; content: string }) {
  const result = await prisma.comment.updateMany({ where: { id: params.commentId, userId: params.userId }, data: { content: params.content } });
  if (!result.count) throw new HTTPException(404, { message: 'Comment not found or not owned by you' });
  return CommentStatus.UPDATE_SUCCESS;
}
