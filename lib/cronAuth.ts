import { NextRequest } from "next/server";

/**
 * Verifies a cron request's secret. Accepts either:
 *  - `Authorization: Bearer <CRON_SECRET>` — what Vercel Cron sends
 *    automatically when a `CRON_SECRET` env var is configured.
 *  - `x-cron-secret: <CRON_SECRET>` — for external schedulers that support
 *    custom headers (cron-job.org, GitHub Actions, etc).
 * Fails closed: an unconfigured CRON_SECRET always rejects.
 */
export function isValidCronRequest(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const customHeader = request.headers.get("x-cron-secret");

  return bearerToken === expected || customHeader === expected;
}
