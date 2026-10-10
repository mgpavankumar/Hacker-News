import 'dotenv/config';

export const jwtIssuer = 'hacker-news-api';
export const jwtAudience = 'hacker-news-client';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes');
  }
  return secret;
}
