# MELAKI Deployment Guide

This is the complete, from-scratch deployment procedure. Follow it in order.

**No scheduled jobs are required for normal operation.** Both background
jobs (stale-order cleanup, abandoned-cart reminders) run opportunistically
during real traffic — see §8. The application is fully compatible with
Vercel's Hobby plan; external schedulers (GitHub Actions, cron-job.org,
Vercel Pro cron) are optional scaling optimizations, never a requirement.

## 1. Prerequisites

- Node.js 18+
- A PostgreSQL 15+ database (Supabase, Neon, RDS, or self-hosted). Use a
  **pooled** connection string if your host offers one (e.g. Supabase's
  `pooler.supabase.com` endpoint) — the app is built for serverless deploys
  that open/close many short-lived connections.
- Accounts for: Cloudinary, Resend, Safaricom Daraja (M-Pesa), Sentry (all
  free to start).
- Vercel account (or any Node host that can run `next start`).

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in every value. Reference:

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | Pooled Postgres connection string. |
| `DATABASE_POOL_SIZE` | **Required, set explicitly** | Defaults to `1` if unset. This is not just "too low" — with a pool of 1, the opportunistic lazy-cleanup background query (see §8) directly competes with the foreground request's own database transaction for the single available connection, which can make ordinary checkout/payment requests time out. Confirmed live during testing: `DATABASE_POOL_SIZE=1` caused a real `POST /api/orders` request to fail with a transaction-pool timeout while a background cleanup run held the only connection. Set `5`-`10`. |
| `SHADOW_DATABASE_URL` | No | Only for local `prisma migrate dev`. Never set in production. |
| `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL` | Yes | Your production URL, e.g. `https://melaki.co.ke`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Yes (first run) | Used once by `npx tsx prisma/seed-admin.ts` to create the first admin. Rotate the password after first login. |
| `MPESA_ENVIRONMENT` | Yes | `sandbox` or `production`. |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` / `MPESA_SHORTCODE` / `MPESA_PASSKEY` | Yes | From your Daraja app. |
| `MPESA_CALLBACK_URL` | Yes | Must be a public HTTPS URL Safaricom can reach: `https://<your-domain>/api/payments/callback`. |
| `MPESA_CALLBACK_SECRET` | Yes | Random string. Append it as `?secret=<value>` on the callback URL registered with Safaricom, or configure Daraja/your proxy to send it as `x-melaki-callback-secret`. The callback route **fails closed** if this is unset. |
| `RESEND_API_KEY` | Yes | From Resend dashboard. |
| `STORE_FROM_EMAIL` | Yes | Must be on a **verified** Resend domain — see §6. |
| `ADMIN_NOTIFICATION_EMAIL` | Yes | Where new-order alerts go. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Yes | From Cloudinary dashboard → Settings → API Keys. Required for any admin product/category image upload. |
| `ORDER_PENDING_TIMEOUT_HOURS` | No | Defaults to `4`. How old a PENDING order with no successful payment must be before cleanup cancels it. |
| `ORDER_CLEANUP_INTERVAL_MINUTES` | No | Defaults to `60`. Minimum time between opportunistic stale-order cleanup runs — see §8. |
| `ABANDONED_CART_CHECK_INTERVAL_MINUTES` | No | Defaults to `60`. Minimum time between opportunistic abandoned-cart reminder runs — see §8. |
| `CRON_SECRET` | No | Only needed if you also wire up either optional external-scheduler route — see §8. The app does not depend on any scheduled job by default. |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Recommended | From your Sentry project. |
| `SMS_ENABLED` / `SMS_PROVIDER` | No | Defaults to a mock provider; leave off until a real SMS adapter is implemented. |

## 3. Database Setup & Migrations

**Always use `prisma migrate deploy` in production. Never run `prisma db push`
against a database that has real data** — this project previously drifted
out of sync with its own migration history because of exactly that (see
`docs/production-launch-readiness.md` history and the migration audit
performed 2026-07-01). `db push` writes schema changes straight to the
database with no record in `prisma/migrations/`, so the next fresh deploy
silently fails to reproduce that change. If you need to prototype a schema
change, use `prisma migrate dev` (which requires `SHADOW_DATABASE_URL` set to
a scratch database) and commit the generated migration file.

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` only applies migrations that aren't already recorded — it's
safe to run on every deploy, including the very first one against an empty
database. Verify cleanly with:

```bash
npx prisma migrate status
# Expect: "Database schema is up to date!"
```

### First-time data setup

```bash
npx tsx prisma/seed.ts          # 13 sample products, categories
npx tsx prisma/seed-admin.ts    # creates ADMIN_EMAIL/ADMIN_PASSWORD as the first admin
```

Log in at `/admin/login` and change the admin password immediately — the
seeded password is whatever plaintext value was in `ADMIN_PASSWORD`.

## 4. Image Storage (Cloudinary)

All product/category image uploads go through Cloudinary
(`lib/cloudinary.ts`) — the app never writes to the local filesystem, which
is required since Vercel's filesystem is read-only outside `/tmp`. Nothing
to configure beyond the three `CLOUDINARY_*` env vars; uploads are validated
(MIME + magic bytes, 5MB cap) and old images are deleted automatically when
replaced or when a product/category is deleted.

## 5. M-Pesa (Daraja) Configuration

1. Create an app at https://developer.safaricom.co.ke and note the Consumer
   Key/Secret.
2. Sandbox testing: `MPESA_ENVIRONMENT=sandbox`, shortcode `174379`, and the
   test passkey already in `.env.example`.
3. Going to production: request production credentials from Safaricom, set
   `MPESA_ENVIRONMENT=production`, and register your real shortcode/passkey.
4. Register `MPESA_CALLBACK_URL` (must be public HTTPS) with Safaricom and
   set `MPESA_CALLBACK_SECRET` — the callback handler rejects any request
   that doesn't present this secret (as `?secret=` or a header), and rejects
   duplicate/replayed callbacks idempotently (verified in this session by
   firing the same callback payload twice against a running instance).

## 6. Resend (Email) Setup

Add and **verify** your sending domain at
https://resend.com/domains before setting `STORE_FROM_EMAIL` to an address
on that domain — sends from an unverified domain fail with a 403 (confirmed
live during this project's audit: every test send failed until the domain is
verified). Verify with:

```bash
npx tsx scripts/test-email.ts verify
npx tsx scripts/test-email.ts customer
npx tsx scripts/test-email.ts admin
```

Check the `email_logs` table for `SENT` rows to confirm delivery.

## 7. Sentry Setup

Create a Sentry project, set `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` and the
org/project/auth-token vars for source-map upload. PII scrubbing is already
configured (`sentry.client.config.ts` / `sentry.server.config.ts` redact
customer name/phone/email/address before events leave the app).

## 8. Background Jobs — Lazy, No Scheduler Required

**No scheduled jobs are required for normal operation.** The app is fully
compatible with Vercel's Hobby plan, which only allows one cron execution
per day — far too infrequent for either job below. There is no `vercel.json`
in this repo and none is needed. External schedulers (GitHub Actions,
cron-job.org, Vercel Pro cron, etc.) are optional scaling optimizations, not
requirements — see "Optional: external scheduler" below.

Two background jobs both use the same lazy, self-throttling architecture:
stale-order cleanup and abandoned-cart reminders.

### How it works

Each job is three layers, following the same pattern:

- **The business logic** (`lib/orders/cleanupExpiredOrders.ts`,
  `lib/abandoned-carts/processAbandonedCarts.ts`) — unchanged from the
  original cron implementations, just extracted into reusable functions.
  Returns metrics (`scanned`, `cancelled`/`remindersSent`, `restoredStock`/
  `skipped`, `executionTime`).
- **The throttle** (`lib/systemThrottle.ts`, wrapped per-job by
  `lib/orders/cleanupThrottle.ts` and
  `lib/abandoned-carts/abandonedCartThrottle.ts`) — atomically checks and
  claims a throttle slot (stored in the `system_settings` table) so each job
  runs at most once every `ORDER_CLEANUP_INTERVAL_MINUTES` /
  `ABANDONED_CART_CHECK_INTERVAL_MINUTES` (both default 60), no matter how
  many requests come in. The check-and-claim is a single compare-and-swap DB
  operation — safe under concurrent requests, verified live.
- **The entry point** (`lib/orders/maybeRunExpiredOrderCleanup.ts`,
  `lib/abandoned-carts/maybeProcessAbandonedCarts.ts`) — what every call site
  actually calls. Awaits only the fast throttle check; if claimed, the actual
  work runs without being awaited, so it never adds to the response time of
  the request that triggered it. Never throws — every failure is caught and
  logged, so a background job can never break checkout, payment initiation,
  or a page load.

Stale-order cleanup is wired into: order creation
(`app/api/orders/route.ts`), M-Pesa STK push initiation
(`app/api/payments/stk-push/route.ts`), and the admin
dashboard/orders/products pages.

Abandoned-cart reminders are wired into: the home, shop, and product-detail
pages, the cart page (a Client Component — triggered via a thin Server
Action, `lib/abandoned-carts/triggerAbandonedCartCheck.ts`, fired
fire-and-forget from a `useEffect`), checkout, and the admin dashboard.

Together these cover effectively all real traffic, customer and admin alike.

### Performance impact

The throttled (common) case costs one indexed primary-key lookup — in
practice a few hundred milliseconds on this project's network path to a
remote Supabase instance, the same order of magnitude as any other single DB
query in this app (verified against a plain unrelated query for comparison).
On a production deployment co-located in the same region as the database,
this is a single-digit-to-low-double-digit-millisecond round trip. The
actual background work, when it runs, is never awaited by the triggering
request, so it adds effectively zero response-time overhead regardless.

**Two things caught live during testing that matter for a correct deploy:**

1. Set `DATABASE_POOL_SIZE` explicitly (see §2) — with the default of `1`,
   a background job's query can starve the foreground request's own database
   connection.
2. Any page that now touches the database opportunistically (the pages
   listed above) must be excluded from Next.js's build-time static
   pre-render (`export const dynamic = "force-dynamic";`), which
   `app/page.tsx`, `app/products/page.tsx`, and `app/products/[slug]/page.tsx`
   already have. Without this, `next build`'s static-generation phase tries
   to render several DB-touching pages concurrently and can exhaust a pooled
   connection's session-mode limit (reproduced live: `next build` failed
   with `max clients reached in session mode` until this was added). If you
   wire a background job into a further page later, add the same export.

### Optional: external scheduler

For teams that outgrow lazy processing (traffic patterns where relying on
page visits isn't reliable enough), both cron routes still exist and call
the exact same business-logic functions used by the lazy path — no
duplicated logic:

```bash
curl -H "x-cron-secret: $CRON_SECRET" https://your-domain/api/cron/expire-pending-orders
curl -H "x-cron-secret: $CRON_SECRET" https://your-domain/api/cron/abandoned-carts
```

Both accept **either** `Authorization: Bearer <CRON_SECRET>` (what Vercel Pro
Cron sends automatically once `CRON_SECRET` is set as a project env var) or
a custom `x-cron-secret: <CRON_SECRET>` header (for cron-job.org, GitHub
Actions, etc). Both header styles were verified live. Both bypass their
respective lazy-path throttle — an explicit authenticated trigger is assumed
to be intentional, so call them at whatever cadence you actually want.

## 9. Deployment Order

1. Provision the database; set all environment variables in your host (all
   three environments — Production/Preview/Development — if using Vercel).
2. `npm install`
3. `npx prisma generate`
4. `npx prisma migrate deploy`
5. `npm run build`
6. Deploy / `npm start`
7. Smoke-test: `/`, `/products`, `/checkout`, `/admin/login`, `/api/health`,
   `/robots.txt`, `/sitemap.xml` should all return 200 (or the expected
   redirect for `/`).
8. Run the M-Pesa sandbox flow end-to-end once before flipping to production
   credentials.
9. Point uptime monitoring at `/api/health` (checks real DB connectivity, not
   just process liveness).

## 10. Rollback Procedure

- **App code**: redeploy the previous Vercel deployment (instant, no data
  impact) — Vercel keeps prior deployments available for one-click rollback.
- **Database migrations**: this project's migrations are additive-only (new
  tables/columns with defaults, no drops). Rolling back app code to a
  version before a migration is safe — old code simply ignores new columns.
  Do **not** run `prisma migrate reset` or manually drop columns to "roll
  back" a migration; write a new forward migration instead if a column truly
  needs removing.
- **Cloudinary uploads**: not affected by app rollback — images already
  uploaded remain valid regardless of which app version is live.

## 11. Backup Recommendations

- Enable your database provider's automated daily backups with at least
  7-day retention (30-day preferred).
- Before any manual migration or data-fix, take an on-demand backup/snapshot.
- Periodically (monthly) do a real restore drill into a scratch database and
  confirm `npx prisma migrate status` reports clean against the restored
  copy — an untested backup is not a backup.
