-- Reconciles migration history with schema changes that were previously
-- applied directly to the database via `prisma db push` rather than through
-- a tracked migration (discovered during a migration-drift audit). This
-- migration is additive/idempotent (IF NOT EXISTS / ADD VALUE IF NOT EXISTS
-- everywhere possible) and changes no data — it only exists so that running
-- `prisma migrate deploy` against a brand-new database produces exactly the
-- schema this project's databases already have.

-- PaymentStatus enum: values added for M-Pesa STK push status tracking
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PROCESSING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'TIMEOUT';

-- Money fields were originally DOUBLE PRECISION; hardened to DECIMAL(10,2)
ALTER TABLE "products" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::numeric(10,2);
ALTER TABLE "products" ALTER COLUMN "originalPrice" TYPE DECIMAL(10,2) USING "originalPrice"::numeric(10,2);
ALTER TABLE "products" ALTER COLUMN "rating" SET DEFAULT 0;
ALTER TABLE "orders" ALTER COLUMN "total" TYPE DECIMAL(10,2) USING "total"::numeric(10,2);
ALTER TABLE "order_items" ALTER COLUMN "price" TYPE DECIMAL(10,2) USING "price"::numeric(10,2);
ALTER TABLE "payments" ALTER COLUMN "amount" TYPE DECIMAL(10,2) USING "amount"::numeric(10,2);

-- M-Pesa STK push tracking columns on payments
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "checkoutRequestId" TEXT,
  ADD COLUMN IF NOT EXISTS "merchantRequestId" TEXT,
  ADD COLUMN IF NOT EXISTS "mpesaReceipt" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "resultCode" INTEGER,
  ADD COLUMN IF NOT EXISTS "resultDesc" TEXT,
  ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_checkoutRequestId_key" ON "payments"("checkoutRequestId");

-- Coupon free-shipping flag and per-customer usage limit
ALTER TABLE "coupons"
  ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "perCustomerLimit" INTEGER DEFAULT 1;

-- Delivery fee (added in this session's checkout-integrity fix)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Admin login brute-force lockout (added in this session's security hardening)
ALTER TABLE "admin_users"
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);

-- Index present live but never captured by a tracked migration
CREATE INDEX IF NOT EXISTS "order_items_productId_idx" ON "order_items"("productId");
