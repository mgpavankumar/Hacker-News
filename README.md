# Hacker News–Style Backend · Work in Progress

A TypeScript backend learning project with Hono, Prisma, and source modules for authentication, posts, comments, and likes. The currently wired server exposes a greeting endpoint only.

**Author:** [M. G. Pavan Kumar](https://github.com/mgpavankumar)  
**Status:** Educational project · incomplete backend

## Features

- Hono server entry point on port 3000
- Draft controllers and routes for posts, comments, likes, and users
- Draft JWT token middleware
- Prisma PostgreSQL configuration and historical migrations

## Getting started

Install Node.js and npm. Clone this repository:

```bash
git clone https://github.com/mgpavankumar/Hacker-News.git
cd Hacker-News
```

```bash
npm install
npm run dev
```

## Project structure

| Path | Purpose |
| --- | --- |
| `src/index.ts` | Active greeting server |
| `src/controllers/` | Draft feature logic and types |
| `src/routes/` | Draft HTTP routes and JWT middleware |
| `src/extras/` | Prisma client and pagination helpers |
| `prisma/schema.prisma` | Database configuration; application models missing |
| `prisma/migrations/` | Historical schema changes |
| `environment.ts` | Current JWT configuration |

## Current behavior and limitations

The command starts the greeting server only; the feature routes are not mounted in src/index.ts. The current Prisma schema has no application models, while controllers expect User, Post, Comment, and Like models. Several imports use filenames or directories that do not exist, authentication-types.ts and user-controller.ts are empty, and JWT dependencies are absent from package.json. These modules require repairs before the full backend can run. Existing authentication code uses plain SHA-256 password hashes and a secret defined in source; replace these before enabling authentication. Do not return password hashes in user responses.

## Planned improvements

- Restore application models and align them with migration history
- Repair missing types, controllers, imports, and dependencies
- Move secrets to environment variables and use salted password hashing
- Mount feature routes and add integration tests

## Contributing

Open an issue describing the problem or proposed improvement. Keep pull requests focused and include the steps used to verify changes. Use sample data and keep credentials out of commits.

## Verification

This documentation was checked against the committed source files, dependency declarations, and route definitions. Installation, compilation, database setup, and runtime behavior have not been verified by this documentation update. There is no automated test suite in the current repository.
