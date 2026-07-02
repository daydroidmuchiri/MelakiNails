import { shouldRun } from "@/lib/systemThrottle";

const THROTTLE_KEY = "order_cleanup_last_run_at";
const DEFAULT_INTERVAL_MINUTES = 60;

function getIntervalMinutes(): number {
  const raw = process.env.ORDER_CLEANUP_INTERVAL_MINUTES;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    if (raw) {
      console.warn(
        `[cleanup] Invalid ORDER_CLEANUP_INTERVAL_MINUTES="${raw}" — falling back to default of ${DEFAULT_INTERVAL_MINUTES}m`
      );
    }
    return DEFAULT_INTERVAL_MINUTES;
  }
  return parsed;
}

/**
 * Atomically checks and claims the stale-order-cleanup throttle slot — see
 * lib/systemThrottle.ts for the underlying mechanism. Runs at most once
 * every ORDER_CLEANUP_INTERVAL_MINUTES (default 60).
 */
export async function shouldRunCleanup(): Promise<boolean> {
  return shouldRun(THROTTLE_KEY, getIntervalMinutes(), "[cleanup]");
}
