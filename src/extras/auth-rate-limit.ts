import { createHash } from 'node:crypto';
import { prisma } from './prisma.js';

export function authLimitKey(kind: string, value: string): string {
  return createHash('sha256').update(`${kind}:${value}`).digest('hex');
}

// A single PostgreSQL upsert serializes increments across every application replica.
export async function consumeAuthLimit(key: string, limit: number): Promise<{ allowed: boolean; retryAfter: number }> {
  const [row] = await prisma.$queryRaw<Array<{ count: number; expiresAt: Date; now: Date }>>`
    INSERT INTO "AuthRateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, CURRENT_TIMESTAMP + INTERVAL '1 minute')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "AuthRateLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN 1 ELSE LEAST("AuthRateLimit"."count" + 1, ${limit + 1}) END,
      "expiresAt" = CASE WHEN "AuthRateLimit"."expiresAt" <= CURRENT_TIMESTAMP THEN CURRENT_TIMESTAMP + INTERVAL '1 minute' ELSE "AuthRateLimit"."expiresAt" END
    RETURNING "count", "expiresAt", CURRENT_TIMESTAMP AS "now"
  `;
  return { allowed: row.count <= limit, retryAfter: Math.max(1, Math.ceil((row.expiresAt.getTime() - row.now.getTime()) / 1000)) };
}
