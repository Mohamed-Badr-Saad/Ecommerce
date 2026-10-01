# Talié Store

Talié is a modest-fashion e-commerce application built in independently testable chunks.

## Current scope

Chunks 1–8 are complete. Chunk 9 now includes protected order fulfillment, customer access controls, review moderation, analytics, activity history, store settings, order CSV export, and printable order documents. Online payment (Paymob) is switched off in this release: checkout offers cash on delivery only. The online-payment code is kept in a separate backup for a later release.

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

## Preview deployment

Vercel uses the Supabase transaction-pooler connection in `DATABASE_URL`; a Docker/localhost URL cannot be reached from Vercel. Use the session-pooler connection in `DIRECT_URL` for migrations. Set the other values listed in `.env.example` in the Vercel project for both Preview and Production, then redeploy because environment changes do not alter an existing deployment.

Apply database migrations to the hosted database before exercising a new deployment:

```bash
npm run db:deploy
```

## Admin studio

Administrator access is enforced from the database role on every `/admin` request; the proxy cookie check is only an early unauthenticated redirect. Administrators can open `/admin` after signing out and back in so their refreshed session contains the current role.

Image uploads use an admin-authenticated token exchange backed by the public Supabase `talie-catalog` bucket. The browser uploads directly to the exact signed object path, avoiding Vercel's request-body limit; the secret key never reaches the browser. Configure `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `SUPABASE_STORAGE_BUCKET` in Vercel. Uploads accept up to six JPG, PNG, WebP, GIF, or AVIF files, resize large still images to 2400 px, optimize them as WebP, and store dimensions and alt text in the media library.

## Brand system

The storefront theme is derived from Talié's supplied Instagram identity: oxblood, warm porcelain, taupe, and antique gold with editorial serif typography and delicate jewelry-inspired ornament. See [the brand guide](docs/brand-guide.md).
