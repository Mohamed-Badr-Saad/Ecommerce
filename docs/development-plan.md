# Talié development plan

Each chunk is a vertical slice with its own acceptance criteria. A chunk is not complete until lint, type checking, tests, and the production build pass.

## Chunk 1 — Foundation and storefront shell

- Next.js App Router, strict TypeScript, Tailwind, and shadcn/ui
- Replaceable brand design tokens and typography
- Responsive header, footer, hero, collections, product cards, and newsletter shell
- Metadata, image optimization, keyboard navigation, and baseline accessibility
- Unit-test and build quality gate

The product and collection records in this chunk are presentation fixtures. Chunk 2 replaces their data source without requiring a redesign.

## Chunk 2 — Database and domain model

- Apply the official Talié Instagram-derived palette, monogram, and visual language
- Docker-based local PostgreSQL
- Prisma 7 schema corrected for Better Auth compatibility and application relations
- Migrations, deterministic seed data, and repository/query tests
- Environment validation and safe `.env.example`

## Chunk 3 — Catalog and discovery

- Collection routes, product details, variants, inventory states, search, filters, sorting, and pagination
- Server-rendered catalog queries and SEO metadata
- Deterministic local product/editorial mock artwork so development never depends on third-party image availability
- Catalog integration tests and responsive browser checks

## Chunk 4 — Customer identity

- Better Auth registration, login, reset, session management, and authorization
- Better Auth 1.7 issuer-aware account schema with server-owned customer/admin roles
- Account profile, saved addresses, and wishlist
- Auth, validation, and protected-route tests

## Chunk 5 — Cart, checkout, and COD orders

- Guest and authenticated persistent carts
- Stock-safe totals, shipping address, Egyptian governorates, shipping rates, and Cash on Delivery
- Transactional order creation and checkout tests
- Paymob test credentials staged locally for Chunk 6; no online-payment calls are made in this chunk

## Chunk 6 — Paymob payments

- Paymob intention/payment-key flow using supported payment methods
- Signed callback/webhook verification, idempotency, and payment reconciliation
- Sandbox payment and failure-path tests

## Chunk 7 — Admin foundation

- Role-based admin protection and admin layout
- Dashboard metrics, navigation, activity logging, loading, empty, and error states
- Authorization and dashboard query tests

## Chunk 8 — Catalog administration

- Products, variants, categories, inventory, tags, media, banners, and policy content
- Uploadthing integration and image validation
- CRUD and upload tests

## Chunk 9 — Operations and insights

- Order fulfillment/refunds, customer management, review moderation, analytics, and store settings
- CSV exports and printable documents
- Admin workflow tests

Current progress: fulfillment, safe unpaid cancellation/restocking, customers, reviews, analytics, activity, settings, CSV, and print workflows are implemented. Paymob-backed refunds remain.

## Chunk 10 — Production readiness

- Accessibility audit, security hardening, rate limiting, observability, and performance budgets
- Supabase production database and Vercel deployment configuration
- Full end-to-end regression, backup/restore notes, and deployment runbook

## Deferred inputs

- Official Talié logo and color palette
- Shipping rules and Egyptian governorate rates
- Paymob credentials and enabled payment integrations
- Uploadthing and email-provider credentials
- Legal/policy copy and production contact details
