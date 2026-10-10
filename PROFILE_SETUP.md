# GitHub profile setup

## Profile README

Create a public repository named `mgpavankumar` under the `mgpavankumar` account and use [PROFILE_README.md](PROFILE_README.md) as its root `README.md`. This will display the introduction on your GitHub profile.

Suggested bio: **M.Tech student at SRM | TypeScript backend projects | Learning data engineering, PySpark & Airflow**

## Featured repository order

Pin Hacker-News, nitrogen, carbon, as5, ASSIGNMENT-4, and fitness, in that order. These demonstrate authentication, transactional database operations, relational modelling, API design, and typed application logic.

## Repository metadata

| Repository | Description | Topics |
| --- | --- | --- |
| [playground](https://github.com/mgpavankumar/playground) | C++17 console exercise with warning-clean compilation and an automated output check. | cpp, cpp17, learning, github-actions |
| [remainder](https://github.com/mgpavankumar/remainder) | TypeScript reminder manager with date validation, defensive copies, and regression tests. | typescript, reminders, learning, nodejs |
| [movies](https://github.com/mgpavankumar/movies) | TypeScript movie catalogue with UUIDs, ratings, search, and automated tests. | typescript, movies, ratings, nodejs |
| [fitness](https://github.com/mgpavankumar/fitness) | TypeScript fitness tracker with validated profiles, workout logs, and regression tests. | typescript, fitness-tracker, learning, nodejs |
| [ASSIGNMENT-4](https://github.com/mgpavankumar/ASSIGNMENT-4) | Hono reminder REST API with typed validation, completion filters, and HTTP tests. | typescript, hono, rest-api, reminders |
| [as5](https://github.com/mgpavankumar/as5) | Hono movie REST API with ratings, search, discovery routes, and validation tests. | typescript, hono, rest-api, movies |
| [carbon](https://github.com/mgpavankumar/carbon) | Hono and Prisma college records API with PostgreSQL, memberships, and transactional deletion. | typescript, hono, prisma, postgresql, college-management |
| [nitrogen](https://github.com/mgpavankumar/nitrogen) | Hono and Prisma food ordering API with transactional orders and completed-order reporting. | typescript, hono, prisma, postgresql, food-ordering |
| [Hacker-News](https://github.com/mgpavankumar/Hacker-News) | Hono and Prisma news API with scrypt passwords, JWT authentication, ownership checks, and PostgreSQL. | typescript, hono, prisma, postgresql, jwt, hacker-news |

## Next substantial portfolio project

Build a separate PySpark and Airflow project that ingests synthetic market trades, validates records, computes daily aggregates, and loads PostgreSQL. Include an idempotent pipeline, rejected-record handling, sample data, an architecture diagram, and reproducible local execution. This is a planned project, not an existing implementation.

## Security review scope

A pattern-based review of the repaired source trees on 10 October 2026 found credential-shaped PostgreSQL URLs only in example configuration and CI test setup. Those URLs use local/test credentials. This review does not prove that all secrets are absent and does not cover the complete remote Git history.

Hacker-News previously committed a JWT signing key. Treat that old key as compromised and replace it in any running environment. Existing unsalted password hashes require a verified password reset workflow; no running database or hosting secrets were changed as part of repository cleanup.
