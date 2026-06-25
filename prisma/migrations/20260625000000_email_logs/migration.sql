ALTER TABLE "store_settings"
  ADD COLUMN IF NOT EXISTS "emailSender" TEXT NOT NULL DEFAULT 'orders@melaki.co.ke',
  ADD COLUMN IF NOT EXISTS "emailNotification" TEXT NOT NULL DEFAULT 'admin@melaki.co.ke',
  ADD COLUMN IF NOT EXISTS "emailCustomerEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "emailAdminEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);
