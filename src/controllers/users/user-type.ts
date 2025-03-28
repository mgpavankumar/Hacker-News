import type { User } from "@prisma/client";

export type GetMeResult = {
  user: User;
};

export enum GetMeError {
  BAD_REQUEST,
}

// export interface UserResponse {
//   id: string;
//   username: string;
//   name: string | null;
//   createdAt: Date;
//   updatedAt: Date;
// }

// export interface GetAllUsersResult {
//   users: UserResponse[];
//   totalUsers: number;
//   totalPages: number;
//   currentPage: number;
// }
export type UserResponse = Partial<{
    id: string;
    username: string;
    name: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;

export type GetAllUsersResult = {
  users: UserResponse[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
};

export enum UsersError {
  BAD_REQUEST,
}