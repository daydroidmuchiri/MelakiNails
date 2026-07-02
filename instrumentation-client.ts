import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Checkout/admin forms carry customer name/phone/email/address — strip
    // common PII-shaped keys before events leave the browser.
    beforeSend: (event) => scrubPii(event) as Sentry.ErrorEvent,
  });
}

// Required by the SDK for App Router navigation instrumentation once using
// instrumentation-client.ts (the file convention this replaces,
// sentry.client.config.ts, didn't need this export). Without it the SDK
// warns on every build. This doesn't change existing behavior — tracing
// was already enabled via tracesSampleRate above; this just wires it up to
// App Router route transitions rather than only manual/XHR instrumentation.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

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
