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
| `INTEGRATION_ENCRYPTION_KEY` | Yes for integrations | Random long string used to encrypt ad-platform credentials at rest |
| `ALLOW_SIGNUP` | No | Set `true` to enable public sign-up (default `false`) |
| `SEED_ADMIN_EMAIL` | For seed | Admin email created/updated by `npm run db:seed` |
| `SEED_ADMIN_PASSWORD` | For seed | Admin password for `npm run db:seed` (minimum 12 characters) |
| `SEED_ADMIN_NAME` | For seed | Admin display name for `npm run db:seed` |
| `SEED_WORKSPACE_NAME` | For seed | Primary workspace name created by `npm run db:seed` |
| `SEED_WORKSPACE_CURRENCY`, `SEED_WORKSPACE_TIMEZONE` | For seed | Optional workspace defaults |
| `SMTP_URL`, `MAIL_FROM` | For mail | SMTP connection string and sender address (password reset / invites) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_DEVELOPER_TOKEN` | For Google sync | Google Ads OAuth credentials |
| `META_CLIENT_ID`, `META_CLIENT_SECRET`, `META_OAUTH_SCOPES`, `META_SYNC_LEADS` | For Meta sync | Meta OAuth app credentials |
| `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_AUTH_URL` | For TikTok sync | TikTok Marketing API OAuth app credentials |
| `SNAPCHAT_CLIENT_ID`, `SNAPCHAT_CLIENT_SECRET`, `SNAPCHAT_OAUTH_SCOPES` | For Snapchat sync | Snapchat Marketing API OAuth app credentials |

Default Meta scopes are `ads_read,business_management`. Keep `META_SYNC_LEADS=false` until Meta approves Lead Ads permissions.

### 3. Create the schema and seed an admin

```bash
npm run db:migrate
npm run db:seed
```

Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, and `SEED_WORKSPACE_NAME` before running the seed. `SEED_ADMIN_PASSWORD` must be at least 12 characters. In production, the seed script refuses to run with the local demo identity.

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 and sign in with a seeded account.

### Utility scripts

- `npm run db:migrate` — run pending migrations from `db/migrations/`
- `npm run db:seed` — create/update the initial admin user and workspace
- `npm run lint` — eslint (`--quiet`)
- `npm run build` — production build (`next build`)

## Production Deployment (Docker / Coolify)

A `docker-compose.yaml` and multi-stage `Dockerfile` are included, written for [Coolify](https://coolify.io) (`docker compose` build pack). Coolify conventions are followed: the compose file is the single source of truth (no host port mappings — the proxy routes a domain to the container), and secrets use Coolify magic environment variables.

To deploy with Coolify:

1. Set the compose-based build pack and let Coolify generate the environment variables:
   - `POSTGRES_PASSWORD`, `SESSION_SECRET`, and `APP_URL` are created automatically via Coolify's magic variables.
   - `APP_URL` defaults to your wildcard-domain URL; set it to your real origin (required for OAuth and email links).
   - Keep `INTEGRATION_ENCRYPTION_KEY` stable. Changing it prevents decrypting stored platform credentials.
   - Set `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`, and `SEED_WORKSPACE_NAME` before running `npm run db:seed`.
   - Unset/replace SMTP and ad-platform OAuth variables as needed.
2. Assign a domain to the `app` service. Traffic is proxied to container port 3000.
3. The `app` container runs migrations automatically on startup (see `scripts/migrate.mjs`), then starts the server. Run the seed script once to create the initial admin/workspace.

For a manual Docker deployment on a VPS:

```bash
docker compose up -d --build
# migrations run automatically at container start; the runner is idempotent:
docker compose exec app node scripts/migrate.mjs
```

### Notes

- Database (`db`) is a private service — no host ports are exposed; the proxy is the only entry point.
- Seeding is optional; use it to create the initial admin/workspace for a fresh install.
- Ad-platform sync requires an authenticated OAuth connection per workspace from Data Sync > Configure.
- Configure these callback URLs in the provider dashboards:
  - `APP_URL/api/integrations/google/callback`
  - `APP_URL/api/integrations/meta/callback`
  - `APP_URL/api/integrations/tiktok/callback`
  - `APP_URL/api/integrations/snapchat/callback`
- `ALLOW_SIGNUP=false` by default; set to `true` to enable public sign-up or restrict account creation to workspace invites.
