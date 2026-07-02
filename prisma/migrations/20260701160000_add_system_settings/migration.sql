-- Internal key-value store for system-level state (e.g. the lazy stale-order
-- cleanup throttle timestamp). Separate from store_settings, which holds
-- admin-editable storefront configuration.
CREATE TABLE IF NOT EXISTS "system_settings" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
