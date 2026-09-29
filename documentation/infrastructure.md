---
description: Runtime infrastructure and deployment environments for Scoops.
---

# Infrastructure

Scoops runs as two separately deployed applications: a TanStack Start/Nitro web
app and a NestJS server. Both run on **Heroku Basic Dynos**. The server owns
business data, authentication, REST endpoints, and background-job registration;
the web app calls it over HTTPS. The shared packages under `packages/` are built
into the applications and are not deployed as services.

## Environments

| Environment | Applications | Database | Background jobs | Email |
| --- | --- | --- | --- | --- |
| Local | Web and server run with pnpm | Docker Compose PostgreSQL | Docker Compose Inngest Dev Server | Mailpit SMTP |
| Staging | Separate Heroku Basic Dynos for web and server | Neon PostgreSQL | Staging branch in the free Inngest Cloud plan | Resend |
| Production | Separate Heroku Basic Dynos for web and server | Neon PostgreSQL | Production branch in the free Inngest Cloud plan | Resend |

The staging and production Inngest branches are separate. Each deployed server
uses the event and signing credentials for its own branch so events and jobs stay
within the intended environment. The server exposes registered functions at
`/api/inngest`.

PostgreSQL is the system of record for business data and Better Auth sessions.
Drizzle accesses it through `DATABASE_URL`. Business events that require durable
publication are written to a PostgreSQL outbox in the originating transaction;
the server publishes committed events to Inngest, where module-owned jobs handle
side effects.

## Deployment

Staging deployment is automated by
[`server-app-staging-cd.yml`](../.github/workflows/server-app-staging-cd.yml)
and [`web-app-staging-cd.yml`](../.github/workflows/web-app-staging-cd.yml).
Matching pushes to `main` build Docker images and release them to the staging
Heroku apps. The server workflow also releases a migration image that applies
Drizzle migrations. The repository does not currently define a production
deployment workflow.

The deployment environment supplies secrets and service configuration. The root
`.env` configures local Docker Compose, `apps/server/.env` configures server-only
values, and `apps/web/.env` configures the web app. Only `VITE_` values are exposed
to browser code. Do not put database URLs, Better Auth secrets, Inngest keys, or
email-provider credentials in browser configuration.

The server's `/health` endpoint checks PostgreSQL readiness. Sentry receives
configured web and server telemetry in staging and production. MinIO is optional
local infrastructure reserved for future object storage; it is not a current
deployed dependency. Billing provider integration is planned.

For application boundaries and request flow, see
[`architecture.md`](architecture.md). For local commands and ports, see
[`tooling.md`](tooling.md).
