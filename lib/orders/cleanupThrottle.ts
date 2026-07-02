import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
 * Atomically checks whether enough time has passed since the last
 * opportunistic cleanup run and, if so, claims the slot by updating the
 * stored timestamp — in the same operation, so there's no window between
 * "check" and "claim" for a second concurrent request to slip through.
 *
 * Returns true only for the single caller that wins the race (via an
 * optimistic-concurrency compare-and-swap on the stored value, or a unique
 * insert if no row exists yet). Every other concurrent caller sees false and
 * must not run cleanup.
 */
export async function shouldRunCleanup(): Promise<boolean> {
  const intervalMinutes = getIntervalMinutes();
  const cutoff = new Date(Date.now() - intervalMinutes * 60 * 1000);
  const now = new Date().toISOString();

  const existing = await prisma.systemSetting.findUnique({ where: { key: THROTTLE_KEY } });

  if (!existing) {
    try {
      await prisma.systemSetting.create({ data: { key: THROTTLE_KEY, value: now } });
      console.log(`[cleanup] Throttle claimed (first run) at ${now}`);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        console.log("[cleanup] Skipped — lost the race to claim the first run");
        return false;
      }
      throw error;
    }
  }

  if (new Date(existing.value) > cutoff) {
    console.log(
      `[cleanup] Skipped due to throttle — last run at ${existing.value}, interval is ${intervalMinutes}m`
    );
    return false;
  }

  const claim = await prisma.systemSetting.updateMany({
    where: { key: THROTTLE_KEY, value: existing.value },
    data: { value: now },
  });

  if (claim.count === 1) {
    console.log(`[cleanup] Throttle claimed at ${now} (previous run: ${existing.value})`);
    return true;
  }

  console.log("[cleanup] Skipped — lost the race to a concurrent request");
  return false;
}
