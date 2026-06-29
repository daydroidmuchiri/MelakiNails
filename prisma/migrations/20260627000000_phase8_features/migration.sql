-- Phase 8 production handover features.

CREATE TYPE "CartReminderStatus" AS ENUM ('PENDING', 'SENT', 'RECOVERED', 'EXPIRED');

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "trackingToken" TEXT,
  ADD COLUMN IF NOT EXISTS "couponId" TEXT,
  ADD COLUMN IF NOT EXISTS "couponCode" TEXT,
  ADD COLUMN IF NOT EXISTS "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0;

UPDATE "orders"
SET "trackingToken" = id
WHERE "trackingToken" IS NULL;

ALTER TABLE "orders"
  ALTER COLUMN "trackingToken" SET NOT NULL;

ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "smsProvider" TEXT NOT NULL DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS "smsSenderId" TEXT,
  ADD COLUMN IF NOT EXISTS "smsAdminEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "smsCustomerEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "minimumStock" INTEGER NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS "coupons" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "percentageDiscount" DOUBLE PRECISION,
  "fixedDiscount" DECIMAL(10,2),
  "minimumOrder" DECIMAL(10,2),
  "expiryDate" TIMESTAMP(3),
  "usageLimit" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "coupon_usages" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "discountAmount" DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wishlists" (
  "id" TEXT NOT NULL,
  "customerEmail" TEXT,
  "sessionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" TEXT NOT NULL,
  "wishlistId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "reviews" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "rating" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "sms_logs" (
  "id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cart_sessions" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "status" "CartReminderStatus" NOT NULL DEFAULT 'PENDING',
  "reminderSentAt" TIMESTAMP(3),
  "recoveredOrderId" TEXT,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "cart_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cart_session_items" (
  "id" TEXT NOT NULL,
  "cartSessionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "image" TEXT,
  "slug" TEXT NOT NULL,
  CONSTRAINT "cart_session_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "orders_trackingToken_key" ON "orders"("trackingToken");
CREATE INDEX IF NOT EXISTS "orders_trackingToken_idx" ON "orders"("trackingToken");
CREATE INDEX IF NOT EXISTS "orders_couponId_idx" ON "orders"("couponId");
CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_key" ON "coupons"("code");
CREATE INDEX IF NOT EXISTS "coupons_active_idx" ON "coupons"("active");
CREATE INDEX IF NOT EXISTS "coupons_expiryDate_idx" ON "coupons"("expiryDate");
CREATE INDEX IF NOT EXISTS "coupon_usages_couponId_idx" ON "coupon_usages"("couponId");
CREATE INDEX IF NOT EXISTS "coupon_usages_customerEmail_idx" ON "coupon_usages"("customerEmail");
CREATE INDEX IF NOT EXISTS "coupon_usages_customerPhone_idx" ON "coupon_usages"("customerPhone");
CREATE INDEX IF NOT EXISTS "wishlists_customerEmail_idx" ON "wishlists"("customerEmail");
CREATE INDEX IF NOT EXISTS "wishlists_sessionId_idx" ON "wishlists"("sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_wishlistId_productId_key" ON "wishlist_items"("wishlistId", "productId");
CREATE INDEX IF NOT EXISTS "wishlist_items_productId_idx" ON "wishlist_items"("productId");
CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews"("productId");
CREATE INDEX IF NOT EXISTS "reviews_approved_idx" ON "reviews"("approved");
CREATE INDEX IF NOT EXISTS "sms_logs_recipient_idx" ON "sms_logs"("recipient");
CREATE INDEX IF NOT EXISTS "sms_logs_type_idx" ON "sms_logs"("type");
CREATE INDEX IF NOT EXISTS "sms_logs_status_idx" ON "sms_logs"("status");
CREATE INDEX IF NOT EXISTS "sms_logs_createdAt_idx" ON "sms_logs"("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "cart_sessions_sessionId_key" ON "cart_sessions"("sessionId");
CREATE INDEX IF NOT EXISTS "cart_sessions_email_idx" ON "cart_sessions"("email");
CREATE INDEX IF NOT EXISTS "cart_sessions_status_idx" ON "cart_sessions"("status");
CREATE INDEX IF NOT EXISTS "cart_sessions_lastActivityAt_idx" ON "cart_sessions"("lastActivityAt");
CREATE INDEX IF NOT EXISTS "cart_session_items_cartSessionId_idx" ON "cart_session_items"("cartSessionId");

ALTER TABLE "orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "wishlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cart_session_items" ADD CONSTRAINT "cart_session_items_cartSessionId_fkey" FOREIGN KEY ("cartSessionId") REFERENCES "cart_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
