import { shouldRun } from "@/lib/systemThrottle";

const THROTTLE_KEY = "abandoned_cart_check_last_run_at";
const DEFAULT_INTERVAL_MINUTES = 60;

function getIntervalMinutes(): number {
  const raw = process.env.ABANDONED_CART_CHECK_INTERVAL_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    if (raw) {
      console.warn(
        `[abandoned-carts] Invalid ABANDONED_CART_CHECK_INTERVAL_MINUTES="${raw}" — falling back to default of ${DEFAULT_INTERVAL_MINUTES}m`
      );
    }
    return DEFAULT_INTERVAL_MINUTES;
  }
  return parsed;
}

/**
 * Atomically checks and claims the abandoned-cart-check throttle slot — see
 * lib/systemThrottle.ts for the underlying mechanism. Runs at most once
 * every ABANDONED_CART_CHECK_INTERVAL_MINUTES (default 60).
 */
export async function shouldRunAbandonedCartCheck(): Promise<boolean> {
  return shouldRun(THROTTLE_KEY, getIntervalMinutes(), "[abandoned-carts]");
}
