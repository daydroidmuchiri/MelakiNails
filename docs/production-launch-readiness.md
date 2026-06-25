# MELAKI Production Launch Readiness

## Infrastructure Checklist

### Production Database

Status: Pending external provisioning.

Requirements:
- PostgreSQL 15 or newer.
- SSL required.
- Daily backups enabled.
- Connection pooling enabled for serverless deployment.
- Prisma-compatible connection string stored as `DATABASE_URL`.

Recommended `DATABASE_URL` shape:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&sslmode=require"
```

Vercel setup:
- Add `DATABASE_URL` to Production, Preview, and Development environments as appropriate.
- Run `npx prisma migrate deploy` against production before launch.
- Run `npx prisma generate` during build.

### Production Email

Status: Pending Resend API key and verified sending domain.

Required variables:

```env
RESEND_API_KEY=
STORE_FROM_EMAIL=orders@melaki.co.ke
ADMIN_NOTIFICATION_EMAIL=admin@melaki.co.ke
```

Verification:

```bash
npx tsx scripts/test-email.ts verify
npx tsx scripts/test-email.ts customer
npx tsx scripts/test-email.ts admin
```

Pass criteria:
- Provider verification reports `hasApiKey: true`.
- Customer test email is delivered.
- Admin test email is delivered.
- `email_logs` contains `SENT` entries for both tests.

### Production M-Pesa

Status: Pending Safaricom production credentials and public callback URL.

Required variables:

```env
MPESA_ENVIRONMENT=production
MPESA_CONSUMER_KEY=
MPESA_CONSUMER_SECRET=
MPESA_SHORTCODE=
MPESA_PASSKEY=
MPESA_CALLBACK_URL=https://melaki.co.ke/api/payments/callback?secret=<secret>
MPESA_CALLBACK_SECRET=
```

Pass criteria:
- Callback URL is public and uses HTTPS.
- `MPESA_CALLBACK_SECRET` is configured in the host environment.
- Daraja callback URL includes the same secret as a query value, or Daraja/proxy sends `x-melaki-callback-secret`.
- Duplicate callbacks do not decrement inventory twice.

## Deployment Checklist

Preferred platform: Vercel.

Steps:
1. Connect the repository to Vercel.
2. Configure all production environment variables.
3. Configure custom domain `melaki.co.ke`.
4. Confirm Vercel SSL certificate is active.
5. Run production migration:

```bash
npx prisma migrate deploy
```

6. Deploy production build.
7. Verify `/`, `/products`, `/checkout`, `/admin/login`, `/robots.txt`, and `/sitemap.xml`.

## Monitoring Checklist

### Sentry

Status: Integrated in code, pending Sentry project variables.

Required variables:

```env
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
SENTRY_TRACES_SAMPLE_RATE=0.1
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE=0.1
APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

Track:
- API failures.
- Payment callback failures.
- Authentication failures.
- Email failures.
- Frontend runtime exceptions.

### Uptime Monitoring

Status: Pending external monitor setup.

Recommended monitors:
- `GET https://melaki.co.ke/`
- `GET https://melaki.co.ke/products`
- `GET https://melaki.co.ke/checkout`
- `GET https://melaki.co.ke/admin/login`
- `GET https://melaki.co.ke/api/payments/status?checkoutRequestId=healthcheck`

Expected behavior:
- Public pages return `200`.
- Payment status healthcheck can return `404` for unknown ID, but must not return `5xx`.

## Backup Checklist

Status: Pending production database provider setup.

Minimum:
- Daily automated backups.
- 7-day retention.

Preferred:
- Daily automated backups.
- 30-day retention.
- Monthly restore drill.

Restore procedure:
1. Identify the backup timestamp.
2. Restore into a temporary database.
3. Run `npx prisma migrate status` against the restored database.
4. Smoke-test admin login, product listing, orders, and payments.
5. Promote restored database only after verification.

Backup verification:
- Confirm backup job success daily.
- Perform a restore test before public launch.
- Document restore duration and any data loss window.

## UAT Results

Status: Not executed in production. Execute after staging/prod environment variables are configured.

### Scenario 1: Customer Purchase

Steps:
- Browse products.
- Add product to cart.
- Checkout.
- Complete M-Pesa payment.

Expected:
- Order created as `PENDING`.
- Payment recorded as `SUCCESS`.
- Order status changes to `PAID`.
- Stock decremented once.
- Customer and admin emails delivered.

Result: Pending.

### Scenario 2: Admin Operations

Steps:
- Login as admin.
- Update product.
- Update inventory.
- Create promotion.

Expected:
- Admin actions require authenticated admin role.
- Storefront reflects product, inventory, and promotion changes.

Result: Pending.

### Scenario 3: Order Lifecycle

Steps:
- Move order through `PENDING -> PROCESSING -> PAID -> SHIPPED -> DELIVERED`.

Expected:
- Status history is recorded.
- Customer status emails send for configured customer-notifiable statuses.

Result: Pending.

### Scenario 4: Payment Failure

Steps:
- Simulate cancelled payment.
- Simulate failed payment.
- Simulate timeout payment.

Expected:
- Payment status updates to failure state.
- Inventory is not deducted.
- Order remains unpaid.

Result: Pending.

## Go/No-Go Recommendation

Current recommendation: Not Production Ready.

Blocking before final go:
- Production PostgreSQL must be provisioned with SSL, backups, and pooling.
- Resend domain and API key must be configured and delivery-tested.
- M-Pesa production credentials and callback secret must be configured.
- Vercel production deployment must be completed.
- Sentry and uptime monitors must be connected.
- UAT scenarios must pass against staging or production.
- Dependency advisories reported by `npm audit --audit-level=moderate` must be resolved or formally risk-accepted. Current suggested automated fixes require breaking major-version changes, so they need a controlled upgrade branch and regression pass.

No-go conditions:
- Build failure.
- Prisma migration failure.
- Payment callback unreachable.
- Email delivery failure.
- Inventory deduction on failed or duplicate payment.
- Admin route/action accessible without admin auth.

## Current Verification Snapshot

Local checks completed:
- `npx prisma validate`: Passed.
- `npx prisma generate`: Passed.
- `npm run lint`: Passed.
- `npx tsc --noEmit`: Passed after production build regenerated `.next/types`.
- `npm run build`: Passed.

Blocked checks:
- `npx tsx scripts/test-email.ts verify`: Failed because `RESEND_API_KEY` is not configured.
- `npx tsx scripts/test-email.ts customer`: Not valid to run for delivery until `RESEND_API_KEY` is configured.
- `npx tsx scripts/test-email.ts admin`: Not valid to run for delivery until `RESEND_API_KEY` is configured.
- Production Vercel deployment: Pending Vercel project access and production environment variables.
- Production M-Pesa callback verification: Pending public callback URL and production Daraja credentials.
