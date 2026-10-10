import { prisma } from './prisma.js';

try {
  const [sessions, limits] = await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "Session" WHERE "expiresAt" <= CURRENT_TIMESTAMP`,
    prisma.$executeRaw`DELETE FROM "AuthRateLimit" WHERE "expiresAt" <= CURRENT_TIMESTAMP`,
  ]);
  console.log(JSON.stringify({ deletedSessions: sessions, deletedRateLimits: limits }));
} finally { await prisma.$disconnect(); }
