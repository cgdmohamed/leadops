# LeadOps

Full-stack marketing/CRM SaaS for aggregating and managing ad-platform leads. Next.js 16 (Turbopack), React 19, TypeScript, Tailwind v4, PostgreSQL.

## Features

- Workspace-based multi-tenant CRM: leads, opportunities, campaigns, tasks, notes
- Ad platform sync: Meta, Google Ads, TikTok, Snapchat
- Password reset and invitation flows (SMTP)
- Team management with admin/agent roles
- Dashboard and attribution analytics

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui (base-ui primitives), Recharts
- **Backend**: Next.js Route Handlers, `pg`, zod validation, scrypt password hashing, httpOnly session cookies
- **Database**: PostgreSQL 17 (schema in `db/migrations/`)
- **Deployment**: Docker / standalone Node server

## Getting Started

### 1. Requirements

- Node.js 20+
- PostgreSQL 15+ (local install or Docker)
- A package manager (npm)

### 2. Install and configure

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string, e.g. `postgres://user:pass@localhost:5432/leadops` |
| `APP_URL` | Yes | Public origin of the app, e.g. `http://localhost:3000` |
| `SESSION_SECRET` | Recommended | Random string; used for token hashing |
| `ALLOW_SIGNUP` | No | Set `true` to enable public sign-up (default `false`) |
| `SMTP_URL`, `MAIL_FROM` | For mail | SMTP connection string and sender address (password reset / invites) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN` | For Google sync | Google Ads OAuth credentials |

### 3. Create the schema and seed demo data

```bash
npm run db:migrate
npm run db:seed
```

Seed users (password `password123456`): `sarah@leadops.io` (admin), `james@leadops.io`, `mike@leadops.io`. Workspaces: LeadOps HQ (USD), EU Branch (EUR), APAC (SGD).

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in with a seeded account.

### Utility scripts

- `npm run db:migrate` — run pending migrations from `db/migrations/`
- `npm run db:seed` — seed demo users/workspaces/campaigns/leads/opportunities
- `npm run lint` — eslint (`--quiet`)
- `npm run build` — production build (`next build`)

## Production Deployment (Docker / Coolify)

A `docker-compose.yml` and multi-stage `Dockerfile` are included, written for [Coolify](https://coolify.io) (`docker compose` build pack). Coolify conventions are followed: the compose file is the single source of truth (no host port mappings — the proxy routes a domain to the container), and secrets use Coolify magic environment variables.

To deploy with Coolify:

1. Set the compose-based build pack and let Coolify generate the environment variables:
   - `POSTGRES_PASSWORD`, `SESSION_SECRET`, and `APP_URL` are created automatically via Coolify's magic variables.
   - `APP_URL` defaults to your wildcard-domain URL; set it to your real origin (required for OAuth and email links).
   - Unset/replace `SMTP_URL`, `MAIL_FROM`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN` as needed.
2. Assign a domain to the `app` service. Traffic is proxied to container port 3000.
3. The `app` container runs migrations automatically on startup (see `scripts/migrate.mjs`), then starts the server. Seed demo data separately on demand.

For a manual Docker deployment on a VPS:

```bash
docker compose up -d --build
# migrations run automatically at container start; the runner is idempotent:
docker compose exec app node scripts/migrate.mjs
```

### Notes

- Database (`db`) is a private service — no host ports are exposed; the proxy is the only entry point.
- Seeding demo data is optional; run the seed script (`npm run db:seed`) locally against the database if desired.
- Ad-platform sync requires an authenticated connection per workspace (Data Sync > Configure). Google uses OAuth; Meta/TikTok/Snap use API credentials entered on the Configure dialog.
- `ALLOW_SIGNUP=false` by default; set to `true` to enable public sign-up or restrict account creation to workspace invites.