import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.APP_ENV || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    // Orders/payments carry customer name/phone/email/address — strip common
    // PII-shaped keys from event/breadcrumb data before it leaves the server.
    beforeSend: (event) => scrubPii(event) as Sentry.ErrorEvent,
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.data) breadcrumb.data = scrubPii(breadcrumb.data) as typeof breadcrumb.data;
      return breadcrumb;
    },
  });
}

const PII_KEYS = /^(customerName|customerEmail|customerPhone|email|phone|address|password|passwordHash)$/i;

function scrubPii(value: unknown, seen = new WeakSet<object>()): unknown {
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => scrubPii(v, seen));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = PII_KEYS.test(key) ? "[redacted]" : scrubPii(val, seen);
  }
  return out;
}
