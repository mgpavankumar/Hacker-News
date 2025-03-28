// src/routes/posts-routes.ts
import { Hono } from "hono";
import { tokenMiddleware } from "./middlewares/token-middleware";
import { 
  createPost, 
  getAllPosts, 
  getUserPosts, 
  deletePost 
} from "../controllers/posts/Post-controller";
import { 
  CreatePostError, 
  GetPostsError,
  DeletePostError
} from "../controllers/posts/Post-types";

export const postsRoutes = new Hono();

// GET all posts
postsRoutes.get("", tokenMiddleware, async (context) => {
  try {
    const page = parseInt(context.req.query("page") || "1", 10);
    const limit = parseInt(context.req.query("limit") || "10", 10);

    if (page < 1 || limit < 1) {
      return context.json({
        message: "Invalid page or limit"
      }, 400);
    }

    const posts = await getAllPosts(page, limit);

    return context.json(
      {
        data: posts,
      },
      200
    );
  } catch (e) {
    if (e === GetPostsError.UNAUTHORIZED) {
      return context.json(
        {
          message: "Unauthorized",
        },
        401
      );
    }

    return context.json(
      {
        message: "Internal Server Error",
      },
      500
    );
  }
});

// GET current user's posts
postsRoutes.get("/me", tokenMiddleware, async (context) => {
  try {
    const userId = context.get("userId");
    const page = parseInt(context.req.query("page") || "1", 10);
    const limit = parseInt(context.req.query("limit") || "10", 10);

    if (page < 1 || limit < 1) {
      return context.json({
        message: "Invalid page or limit"
      }, 400);
    }

    const posts = await getUserPosts(userId, page, limit);

    return context.json(
      {
        data: posts,
      },
      200
    );
  } catch (e) {
    if (e === GetPostsError.UNAUTHORIZED) {
      return context.json(
        {
          message: "Unauthorized",
        },
        401
      );
    }

    return context.json(
      {
        message: "Internal Server Error",
      },
      500
    );
  }
});

// CREATE a post
postsRoutes.post("", tokenMiddleware, async (context) => {
  try {
    const userId = context.get("userId");
    const { title, content } = await context.req.json();

    // Validate input
    if (!title || !content) {
      return context.json(
        {
          message: "Title and content are required",
        },
        400
      );
    }

    const result = await createPost({
      title,
      content,
      authorId: userId
    });

    return context.json(
      {
        data: result.post,
      },
      201
    );
  } catch (e) {
    if (e === CreatePostError.UNAUTHORIZED) {
      return context.json(
        {
          message: "Unauthorized",
        },
        401
      );
    }

    return context.json(
      {
        message: "Internal Server Error",
      },
      500
    );
  }
});

// DELETE a post
postsRoutes.delete("/:postId", tokenMiddleware, async (context) => {
  try {
    const userId = context.get("userId");
    const postId = context.req.param("postId");

    await deletePost(postId, userId);

    return context.json(
      {
        message: "Post deleted successfully",
      },
      200
    );
  } catch (e) {
    if (e === DeletePostError.NOT_FOUND) {
      return context.json(
        {
          message: "Post not found or unauthorized",
        },
        404
      );
    }

    return context.json(
      {
        message: "Internal Server Error",
      },
      500
    );
  }
});