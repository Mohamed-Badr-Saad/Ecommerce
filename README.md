# Talié Store

Talié is a modest-fashion e-commerce application built in independently testable chunks.

## Current scope

Chunk 1 provides the responsive storefront foundation and replaceable brand tokens. Product content is fixture data until the database slice is implemented in Chunk 2.

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

## Brand system

The storefront theme is derived from Talié's supplied Instagram identity: oxblood, warm porcelain, taupe, and antique gold with editorial serif typography and delicate jewelry-inspired ornament. See [the brand guide](docs/brand-guide.md).
