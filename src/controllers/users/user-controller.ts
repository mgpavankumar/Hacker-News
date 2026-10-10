import { HTTPException } from 'hono/http-exception';
import { prisma } from '../../extras/prisma.js';
import { publicUserSelect } from '../authentication/authentication-controller.js';
import { getPagination } from '../../extras/pagination.js';

export async function getMe({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
  if (!user) throw new HTTPException(404, { message: 'User not found' });
  return { user };
}
export async function getAllUsers(page: number, limit: number) {
  const { skip, take } = getPagination(page, limit);
  const [users, totalUsers] = await Promise.all([prisma.user.findMany({ select: publicUserSelect, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip, take }), prisma.user.count()]);
  return { users, totalUsers, totalPages: Math.ceil(totalUsers / limit), currentPage: page };
}
