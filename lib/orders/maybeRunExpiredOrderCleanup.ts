import { shouldRunCleanup } from "@/lib/orders/cleanupThrottle";
import { cleanupExpiredOrders } from "@/lib/orders/cleanupExpiredOrders";

/**
 * Opportunistic "lazy cleanup" entry point — call this from normal request
 * handling (checkout, payment initiation, admin pages) instead of relying on
 * an external scheduler. This is what makes the app fully self-contained on
 * platforms without cron support (e.g. Vercel's Hobby plan).
 *
 * Fast and safe to call from anywhere:
 *  - The throttle check-and-claim is a single DB round trip
 *    (lib/orders/cleanupThrottle.ts), so most calls return almost
 *    immediately having done nothing.
 *  - When claimed, the actual scan-and-cancel work
 *    (lib/orders/cleanupExpiredOrders.ts) is kicked off WITHOUT being
 *    awaited, so it never adds to the calling request's response time.
 *  - Never throws. A cleanup failure must never break checkout, payment
 *    initiation, or an admin page load — every error is caught and logged.
 *
 * Note on serverless: an un-awaited promise can in principle be cut short if
 * the platform freezes the function immediately after the response is sent.
 * This is safe here because cleanupExpiredOrders() is fully idempotent — if
 * a run is ever cut short, the remaining stale orders simply get picked up
 * by the next opportunistic trigger once the throttle window passes. If
 * guaranteed completion is ever needed, swap the fire-and-forget call below
 * for `@vercel/functions`' `waitUntil()`, which ties the promise's lifetime
 * to the serverless invocation — no other code in this module needs to
 * change.
 */
export async function maybeRunExpiredOrderCleanup(): Promise<void> {
  try {
    const claimed = await shouldRunCleanup();
    if (!claimed) return;

    cleanupExpiredOrders().catch((error) => {
      console.error("[cleanup] Opportunistic cleanup run failed:", error);
    });
  } catch (error) {
    console.error("[cleanup] Failed to evaluate cleanup throttle:", error);
  }
}
