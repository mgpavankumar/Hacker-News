import { HTTPException } from 'hono/http-exception';

export const getPagination = (page: number, limit: number) => {
  if (!Number.isSafeInteger(page) || !Number.isSafeInteger(limit) || page < 1 || limit < 1 || limit > 100 || !Number.isSafeInteger((page - 1) * limit)) {
    throw new HTTPException(400, { message: 'Invalid pagination: page must be positive and limit between 1 and 100' });
  }
  return { skip: (page - 1) * limit, take: limit };
};
