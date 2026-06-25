CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "products_active_idx" ON "products"("active");
CREATE INDEX IF NOT EXISTS "products_featured_idx" ON "products"("featured");

CREATE INDEX IF NOT EXISTS "orders_email_idx" ON "orders"("email");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders"("status");
CREATE INDEX IF NOT EXISTS "orders_createdAt_idx" ON "orders"("createdAt");

CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_createdAt_idx" ON "payments"("createdAt");

CREATE INDEX IF NOT EXISTS "promotions_active_idx" ON "promotions"("active");
CREATE INDEX IF NOT EXISTS "promotions_startDate_idx" ON "promotions"("startDate");
CREATE INDEX IF NOT EXISTS "promotions_endDate_idx" ON "promotions"("endDate");

CREATE INDEX IF NOT EXISTS "email_logs_recipient_idx" ON "email_logs"("recipient");
CREATE INDEX IF NOT EXISTS "email_logs_type_idx" ON "email_logs"("type");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs"("status");
CREATE INDEX IF NOT EXISTS "email_logs_createdAt_idx" ON "email_logs"("createdAt");
