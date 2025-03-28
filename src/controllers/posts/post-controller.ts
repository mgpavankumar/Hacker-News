// src/controllers/posts/post-controller.ts
import { prisma } from "../../extras/prisma";
import { 
  type CreatePostParameters, //getting error in this line
  type CreatePostResult, //getting error in this line
  CreatePostError,
  type GetPostsResult,//getting error in this line
  GetPostsError,
  DeletePostError
} from "./Post-types";

export const createPost = async (
  parameters: CreatePostParameters & { authorId: string }
): Promise<CreatePostResult> => {
  try {
    const post = await prisma.post.create({
      data: {
        title: parameters.title,
        content: parameters.content,
        authorId: parameters.authorId
      }
    });

    return { post };
  } catch (error) {
    console.error("Error creating post:", error);
    throw CreatePostError.UNKNOWN;
  }
};

export const getAllPosts = async (
  page: number = 1, 
  limit: number = 10
): Promise<GetPostsResult> => {
  try {
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    const totalPosts = await prisma.post.count();

    return {
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw GetPostsError.UNKNOWN;
  }
};

export const getUserPosts = async (
  userId: string,
  page: number = 1, 
  limit: number = 10
): Promise<GetPostsResult> => {
  try {
    const skip = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    const totalPosts = await prisma.post.count({
      where: { authorId: userId }
    });

    return {
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page
    };
  } catch (error) {
    console.error("Error fetching user posts:", error);
    throw GetPostsError.UNKNOWN;
  }
};

export const deletePost = async (
  postId: string, 
  userId: string
): Promise<void> => {
  // First, verify the post exists and belongs to the user
  const post = await prisma.post.findUnique({
    where: { 
      id: postId,
      authorId: userId 
    }
  });

  if (!post) {
    throw DeletePostError.NOT_FOUND;
  }

  // Delete the post
  try {
    await prisma.post.delete({
      where: { id: postId }
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    throw DeletePostError.UNKNOWN;
  }
};