import type { User } from '@prisma/client';

export type PublicUser = Pick<User, 'id' | 'username' | 'name' | 'createdAt' | 'updatedAt'>;
export type SignUpWithUsernameAndPasswordResult = { token: string; user: PublicUser };
export type LogInWithUsernameAndPasswordResult = SignUpWithUsernameAndPasswordResult;
