# Talié Store

Talié is a modest-fashion e-commerce application built in independently testable chunks.

## Current scope

Chunks 1–5 provide the branded storefront, PostgreSQL catalog, customer accounts, persistent carts, Egyptian delivery pricing, and transactional Cash on Delivery checkout. Chunk 6 adds Paymob; its one-hour pending-payment inventory reservation foundation is already in place.

See [the development plan](docs/development-plan.md) for the complete sequence and acceptance boundaries.

## Local development

Requirements: Node.js 22+, npm, and Docker Desktop.

```bash
npm install
docker compose up -d
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality gate

```bash
npm run check
```

This runs linting, strict TypeScript checking, unit tests, and a production build.

Database integration tests run separately against the local container:

```bash
npm run test:db
```

The Talié container uses host port `5433` because this development machine already has PostgreSQL on the default `5432` port. Copy `.env.example` to `.env` when setting up another machine.

Prisma Client is regenerated automatically before `npm run dev`, during `npm install`, and before production builds. Restart the dev server after applying a migration so the running process loads the new client.

## Preview deployment and webhooks

Vercel requires a hosted PostgreSQL connection in `DATABASE_URL`; a Docker/localhost URL cannot be reached from Vercel. `DIRECT_URL` is optional and falls back to `DATABASE_URL`. Set the other values listed in `.env.example` in the Vercel project for both Preview and Production, then redeploy because environment changes do not alter an existing deployment.

Apply database migrations to the hosted database before exercising a new deployment:

```bash
npm run db:deploy
```

For short-lived local Paymob webhook testing, a public HTTPS tunnel can be used instead of deploying the database and app. Cloudflare Quick Tunnel exposes the running local app with a temporary URL:

```bash
cloudflared tunnel --url http://localhost:3000
```

Keep both the Next.js server and tunnel running. The generated hostname changes when the quick tunnel restarts, so update Paymob callback URLs each time.

Pending Paymob inventory is reserved for 60 minutes. Expired stock is released lazily on storefront/cart traffic, and `/api/cron/release-reservations` is available for a scheduler when `CRON_SECRET` is configured.

## Brand system

The storefront theme is derived from Talié's supplied Instagram identity: oxblood, warm porcelain, taupe, and antique gold with editorial serif typography and delicate jewelry-inspired ornament. See [the brand guide](docs/brand-guide.md).
