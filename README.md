# Talié Store

Talié is a modest-fashion e-commerce application built in independently testable chunks.

## Current scope

Chunks 1–8 are complete. Chunk 9 now includes protected order fulfillment, customer access controls, review moderation, analytics, activity history, store settings, order CSV export, and printable order documents. Provider-backed Paymob refunds remain before Chunk 9 is closed.

See [the development plan](docs/development-plan.md) for the complete sequence and acceptance boundaries.

## Local development

Requirements: Node.js 22+ and npm. The shared development environment uses Supabase Postgres; Docker remains optional for disposable database integration tests.

```bash
npm install
npm run db:deploy
npm run db:seed
npm run admin:ensure
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality gate

```bash
npm run check
```

This runs linting, strict TypeScript checking, unit tests, and a production build.

Database integration tests mutate data and must run only against a disposable local PostgreSQL container, never the shared Supabase database:

```bash
npm run test:db
```

The optional Talié container uses host port `5433` because this development machine already has PostgreSQL on the default `5432` port. Copy `.env.example` to `.env` when setting up another machine and use Supabase's transaction pooler for `DATABASE_URL` and session pooler for `DIRECT_URL`.

Prisma Client is regenerated automatically before `npm run dev`, during `npm install`, and before production builds. Restart the dev server after applying a migration so the running process loads the new client.

## Preview deployment and webhooks

Vercel uses the Supabase transaction-pooler connection in `DATABASE_URL`; a Docker/localhost URL cannot be reached from Vercel. Use the session-pooler connection in `DIRECT_URL` for migrations. Set the other values listed in `.env.example` in the Vercel project for both Preview and Production, then redeploy because environment changes do not alter an existing deployment.

Apply database migrations to the hosted database before exercising a new deployment:

```bash
npm run db:deploy
```

For short-lived local Paymob webhook testing, a public HTTPS tunnel can be used instead of deploying the database and app. Cloudflare Quick Tunnel exposes the running local app with a temporary URL:

```bash
cloudflared tunnel --url http://localhost:3000
```

Keep both the Next.js server and tunnel running. Put the hostname (without `https://`) in `DEV_ALLOWED_ORIGINS` and the full HTTPS origin in `PAYMOB_CALLBACK_BASE_URL`, then restart `npm run dev`. Configure Paymob with:

- Processed callback: `https://YOUR-TUNNEL/api/payments/paymob/webhook`
- Transaction response callback: `https://YOUR-TUNNEL/payment/return`

The app also sends these URLs per Intention, overriding the integration defaults for supported payment methods. The generated hostname changes when the quick tunnel restarts, so update `.env`, restart Next.js, and update Paymob each time.

Pending Paymob inventory is reserved for 60 minutes. `/api/cron/release-reservations` releases expired stock in bounded batches when a scheduler calls it with `CRON_SECRET`; public storefront requests never run global cleanup work.

The payment-return page also performs an authenticated Paymob transaction inquiry for an authorized pending order. This safely recovers a successful payment if a temporary tunnel or webhook callback was missed; redirect query parameters alone never mark an order paid.

## Admin studio

Administrator access is enforced from the database role on every `/admin` request; the proxy cookie check is only an early unauthenticated redirect. Administrators can open `/admin` after signing out and back in so their refreshed session contains the current role.

Image uploads use an admin-authenticated token exchange backed by the public Supabase `talie-catalog` bucket. The browser uploads directly to the exact signed object path, avoiding Vercel's request-body limit; the secret key never reaches the browser. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET` in Vercel. Uploads accept up to six JPG, PNG, WebP, GIF, or AVIF files, resize large still images to 2400 px, optimize them as WebP, and store dimensions and alt text in the media library.

## Brand system

The storefront theme is derived from Talié's supplied Instagram identity: oxblood, warm porcelain, taupe, and antique gold with editorial serif typography and delicate jewelry-inspired ornament. See [the brand guide](docs/brand-guide.md).
