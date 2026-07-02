import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Generic atomic throttle, backed by the system_settings key-value table.
 * Used by every opportunistic "lazy" background job in the app (stale-order
 * cleanup, abandoned-cart reminders, ...) so none of them need their own
 * scheduler — see lib/orders/cleanupThrottle.ts and
 * lib/abandoned-carts/abandonedCartThrottle.ts for the per-job wrappers.
 *
 * Atomically checks whether enough time has passed since the last successful
 * run for the given key and, if so, claims the slot by updating the stored
 * timestamp — check-and-claim happen in one operation, so there is no window
 * between them for a second concurrent caller to slip through.
 *
 * Returns true only for the single caller that wins the race (via an
 * optimistic-concurrency compare-and-swap on the stored value, or a unique
 * insert if no row exists yet). Every other concurrent caller sees false and
 * must not run the job.
 */
export async function shouldRun(
  key: string,
  intervalMinutes: number,
  logPrefix = "[throttle]"
): Promise<boolean> {
  const cutoff = new Date(Date.now() - intervalMinutes * 60 * 1000);
  const now = new Date().toISOString();

  const existing = await prisma.systemSetting.findUnique({ where: { key } });

  if (!existing) {
    try {
      await prisma.systemSetting.create({ data: { key, value: now } });
      console.log(`${logPrefix} Throttle claimed (first run) at ${now}`);
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        console.log(`${logPrefix} Skipped — lost the race to claim the first run`);
        return false;
      }
      throw error;
    }
  }

  if (new Date(existing.value) > cutoff) {
    console.log(
      `${logPrefix} Skipped due to throttle — last run at ${existing.value}, interval is ${intervalMinutes}m`
    );
    return false;
  }

  const claim = await prisma.systemSetting.updateMany({
    where: { key, value: existing.value },
    data: { value: now },
  });

  if (claim.count === 1) {
    console.log(`${logPrefix} Throttle claimed at ${now} (previous run: ${existing.value})`);
    return true;
  }

  console.log(`${logPrefix} Skipped — lost the race to a concurrent request`);
  return false;
}
