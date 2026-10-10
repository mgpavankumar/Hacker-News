# Deployment and operations

This repository has deployment safeguards. A public launch still requires hosting, HTTPS, secrets, monitoring, backups, and an application-specific access policy.

## Build and release

Use Node.js 22 or newer. Build from the committed lockfile:

```bash
npm ci
npm run db:generate
npm run build
npm run db:migrate
npm run start:production
```

Run migrations once as a controlled release step with migration credentials, before starting the new application version. Do not use `db push` in production. `start:production` runs compiled JavaScript; `dev` and the existing `start` remain development conveniences. A release build must include generated Prisma Client and the compiled `dist` directory.

Set `NODE_ENV=production`, a PostgreSQL `DATABASE_URL`, and a numeric `PORT` between 1 and 65535. Store secrets in the hosting provider's secret manager. Never commit a real `.env`, put credentials in a URL shared with others, or copy a service key into a frontend bundle. Use encrypted database connections and a runtime database role with only the permissions the application needs; keep schema-changing privileges in the migration role.

## Health and process lifecycle

- `GET /health/live` reports whether the HTTP process is running.
- `GET /health/ready` probes the database and expected tables. It returns 503 when the probe fails or exceeds two seconds; responses omit internal error details. The timeout does not cancel the underlying database query, so configure database connection and query timeouts as well.
- Configure load balancers to send traffic only to ready instances and apply rate limits to health endpoints.
- Responses include a locally generated `X-Request-ID` and `Cache-Control: no-store`. Configure upstream access logs to retain the response request ID without logging credentials, tokens, bodies, or personal records.
- The HTTP server sets a 15-second request timeout and a 10-second header timeout. Put HTTPS and any additional connection/rate controls at the gateway.
- SIGTERM and SIGINT stop accepting connections, drain active requests, and disconnect Prisma. A ten-second shutdown deadline terminates lingering connections with a nonzero exit. Allow at least that much termination grace in the hosting platform.

## Before serving real users

1. Provision hosting and a TLS-terminating gateway. Decide trusted proxy behavior and allowed clients; do not blindly trust forwarded request headers.
2. Configure separate development, test, staging, and production databases. Take an encrypted backup before migrations and rehearse restoration.
3. Run `npm test` after generating the client and building, using `TEST_DATABASE_URL` for a dedicated test database. CI independently tests PostgreSQL 16.
4. Test expected concurrency, pool limits, migrations, and failure recovery in staging. Passing regression tests are not a load or penetration test.
5. Monitor 5xx errors, readiness failures, latency, connection-pool saturation, and storage. Define alert recipients and a response procedure.
6. Review data retention, roles, record-level permissions, pagination, and the actual product workflows. These require deployment and business context.

## Authentication and release compatibility

Set `JWT_SECRET` to a cryptographically random secret containing at least 32 bytes. The `DIRECT_URL` migration connection may differ from a pooled runtime URL. Rotate the previously committed key and require resets for legacy unsalted password hashes before real users are served.

Apply the new sessions/auth-limit migration before switching code. Coordinate the rollout so old stateless-token instances are drained. Existing tokens without tracked sessions stop working and clients must log in again; this is intentional. JWTs retain their one-hour expiry and every protected request additionally validates the database session. Deleting a user removes sessions through the foreign key.

- `POST /auth/logout` with a bearer token invalidates that session and returns 204.
- `POST /auth/logout-all` invalidates every session belonging to that account and returns 204.
- Login and signup allow 60 attempts per connected peer per minute and 10 per username per minute, separately for each action. The counters are atomic PostgreSQL upserts shared by replicas. HTTP 429 includes `Retry-After`.
- Forwarded headers are ignored. Behind a reverse proxy, the peer quota groups clients by the proxy's address. Configure gateway per-client limits before deployment; do not expose an unrestricted origin or enable trust for arbitrary forwarded headers.
- Authentication storage failures stop authentication rather than allowing requests through.
- Run `npm run db:prune-auth` periodically from your deployment scheduler to remove expired sessions and counters using the database clock. This repository does not create a scheduler or production job for you.

Account recovery is still a launch dependency: choose a verified email provider and design single-use, expiring recovery tokens. Do not invent a password-reset route that cannot verify account ownership. Refresh tokens, account verification, abuse controls for other routes, and any moderation policy need product decisions.
