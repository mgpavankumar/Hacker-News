# Hacker News–Style Backend · Hono & Prisma

[![CI](https://github.com/mgpavankumar/Hacker-News/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mgpavankumar/Hacker-News/actions/workflows/ci.yml)

An authenticated PostgreSQL-backed API for users, posts, comments, and likes.

**Author:** [M. G. Pavan Kumar](https://github.com/mgpavankumar)
**Status:** Educational project

## Features

- Sign up and log in using salted scrypt password hashes
- Use signed, expiring JWTs for protected routes
- Create posts and manage owned posts/comments
- Enforce one like per user per post
- Paginate records without exposing password hashes

## Getting started

Install Node.js 22 or newer and npm. Clone this repository:

```bash
git clone https://github.com/mgpavankumar/Hacker-News.git
cd Hacker-News
```

```bash
npm ci
```

Copy `.env.example` to `.env` and set `DATABASE_URL` for a dedicated local PostgreSQL database. Set `DIRECT_URL` to the direct database connection and generate a random `JWT_SECRET` of at least 32 bytes using the command in `.env.example`. Keep `.env` out of version control. Then run:

```bash
npm run db:generate
npm run db:migrate
npm run build
npm start
```

`npm start` runs the TypeScript entry point with the Node.js `tsx` loader. `npm run build` emits JavaScript into `dist/src`. `npm run dev` watches source files. The server listens on port 3000 unless `PORT` is set.

## Tests

Use a dedicated test database with the migrations applied. Set `TEST_DATABASE_URL` to its connection URL before running `npm test`. Tests create synthetic records and clean up only their own records. The integration tests generate a temporary JWT key. GitHub Actions provisions PostgreSQL 16 and runs migrations, compilation, and tests.

```bash
npm run typecheck
npm test
```

See [TEST_RESULTS.md](TEST_RESULTS.md) for recorded local verification and its limits.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app.ts` | HTTP application, routes, and request validation |
| `src/index.ts` | Server entry point |
| `tests/` | Automated regression checks |
| `tsconfig.json` | Strict ESM compilation settings |
| `prisma/schema.prisma` | Database models |
| `prisma/migrations/` | Versioned SQL migrations |
| `.env.example` | Placeholder local configuration |
| `src/controllers/` | Authentication and feature operations |
| `src/routes/` | HTTP routes and token middleware |
| `environment.ts` | JWT configuration without a hardcoded key |

## Current behavior and limitations

JWTs expire after one hour and validate signature, algorithm, issuer, and audience. Rotate the previously committed JWT key. Existing unsalted SHA-256 password hashes require a password reset; the new verifier deliberately rejects them. Before applying the unique-like migration to an existing database, review and resolve any duplicate likes; the migration does not delete rows. Add rate limiting, account recovery, and token revocation before production use.

## HTTP routes

| Method | Path |
| --- | --- |
| POST | `/auth/signup` |
| POST | `/auth/login` |
| GET | `/users/me` |
| GET | `/users` |
| GET | `/posts` |
| GET | `/posts/me` |
| POST | `/posts` |
| DELETE | `/posts/:postId` |
| POST | `/comments/on/:postId` |
| GET | `/comments/on/:postId` |
| DELETE | `/comments/:commentId` |
| PATCH | `/comments/:commentId` |
| POST | `/likes/on/:postId` |
| GET | `/likes/on/:postId` |
| DELETE | `/likes/on/:postId` |

Use `Authorization: Bearer <token>` on protected routes. The older `token` header is supported for compatibility. `/auth/signup` and `/auth/login` accept JSON with `username` and `password`.

## Try the API

Use a disposable local account. The password below is example data:

```bash
curl -i http://localhost:3000/auth/signup -H 'Content-Type: application/json' -d '{"username":"demo_reader","password":"Example-Password-1!"}'
curl -i http://localhost:3000/auth/login -H 'Content-Type: application/json' -d '{"username":"demo_reader","password":"Example-Password-1!"}'
```

Copy the returned token into the following request, replacing `YOUR_TOKEN`:

```bash
curl -i http://localhost:3000/users/me -H 'Authorization: Bearer YOUR_TOKEN'
curl -i http://localhost:3000/posts -H 'Authorization: Bearer YOUR_TOKEN' -H 'Content-Type: application/json' -d '{"title":"My first demo post","content":"Exploring a tested TypeScript backend."}'
```

The authenticated profile omits the password hash. Requests without a valid token return 401. [Integration tests](tests/api.test.ts) demonstrate posts, comments, likes, and ownership checks. On Windows PowerShell use `curl.exe`.

## Contributing

Keep changes focused, use synthetic data, and include steps or tests demonstrating the fix. Do not commit local configuration or credentials.

## HTTP safeguards

Requests are limited to 64 KiB and oversized payloads return JSON with HTTP 413. Responses include Hono security headers. Responses use `Cache-Control: no-store` to discourage caching tokens and personal records.
