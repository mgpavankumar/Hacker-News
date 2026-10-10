-- Reject duplicate likes at the database boundary. Existing duplicates must be
-- reviewed and resolved before deploying this migration; no rows are deleted.
CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like"("postId", "userId");
