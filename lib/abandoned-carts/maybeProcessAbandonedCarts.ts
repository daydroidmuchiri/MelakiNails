import { shouldRunAbandonedCartCheck } from "@/lib/abandoned-carts/abandonedCartThrottle";
import { processAbandonedCarts } from "@/lib/abandoned-carts/processAbandonedCarts";

/**
 * Opportunistic "lazy" entry point for abandoned-cart reminders — call this
 * from normal request handling (storefront pages, checkout, admin
 * dashboard) instead of relying on an external scheduler. Mirrors
 * lib/orders/maybeRunExpiredOrderCleanup.ts exactly.
 *
 * Fast and safe to call from anywhere:
 *  - The throttle check-and-claim is a single DB round trip, so most calls
 *    return almost immediately having done nothing.
 *  - When claimed, the actual scan-and-send work is kicked off WITHOUT
 *    being awaited, so it never adds to the calling request's response time.
 *  - Never throws. A processing failure must never break a page load,
 *    checkout, or an admin page — every error is caught and logged.
 */
export async function maybeProcessAbandonedCarts(): Promise<void> {
  try {
    const claimed = await shouldRunAbandonedCartCheck();
    if (!claimed) return;

    processAbandonedCarts().catch((error) => {
      console.error("[abandoned-carts] Opportunistic processing run failed:", error);
    });
  } catch (error) {
    console.error("[abandoned-carts] Failed to evaluate throttle:", error);
  }
}
