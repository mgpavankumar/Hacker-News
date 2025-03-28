
// src/controllers/posts/post-types.ts
import type { Post, User } from "@prisma/client";

export type CreatePostParameters = {
  title: string;
  content: string;
};

export type CreatePostResult = {
  post: Post;
};

export enum CreatePostError {
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN = "UNKNOWN"
}

export type GetPostsResult = {
  posts: Post[];
  totalPosts: number;
  totalPages: number;
  currentPage: number;
};

export enum GetPostsError {
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN = "UNKNOWN"
}

export enum DeletePostError {
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  UNKNOWN = "UNKNOWN"
}
