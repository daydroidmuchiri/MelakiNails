import { prisma } from "@/lib/prisma";
import { cancelOrder } from "@/lib/orders/cancelOrder";

const DEFAULT_TIMEOUT_HOURS = 4;
const BATCH_SIZE = 100;
const MAX_BATCHES = 50; // hard ceiling: up to 5,000 orders per invocation

function getTimeoutHours(): number {
  const raw = process.env.ORDER_PENDING_TIMEOUT_HOURS;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    if (raw) {
      console.warn(
        `[cleanup] Invalid ORDER_PENDING_TIMEOUT_HOURS="${raw}" — falling back to default of ${DEFAULT_TIMEOUT_HOURS}h`
      );
    }
    return DEFAULT_TIMEOUT_HOURS;
  }
  return parsed;
}

export interface CleanupMetrics {
  scanned: number;
  cancelled: number;
  restoredStock: number;
  executionTime: number;
}

/**
 * Cancels PENDING orders with no successful payment older than
 * ORDER_PENDING_TIMEOUT_HOURS, restoring their reserved stock.
 *
 * The single source of truth for stale-order cleanup — called both by the
 * opportunistic lazy-cleanup path (lib/orders/maybeRunExpiredOrderCleanup.ts)
 * and the optional manual/scheduled API route
 * (app/api/cron/expire-pending-orders). Safe to run repeatedly or
 * concurrently: cancelOrder() is idempotent and this only ever selects
 * orders still in PENDING status, so an order already cancelled by a prior
 * or overlapping run is never touched twice.
 */
export async function cleanupExpiredOrders(): Promise<CleanupMetrics> {
  const start = Date.now();
  const timeoutHours = getTimeoutHours();
  const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

  let scanned = 0;
  let cancelled = 0;
  let restoredStock = 0;
  let failed = 0;
  let batches = 0;

  try {
    while (batches < MAX_BATCHES) {
      const staleOrders = await prisma.order.findMany({
        where: {
          status: "PENDING",
          createdAt: { lte: cutoff },
          payments: { none: { status: "SUCCESS" } },
        },
        select: { id: true },
        take: BATCH_SIZE,
      });

      if (staleOrders.length === 0) break;
      batches++;
      scanned += staleOrders.length;

      for (const { id } of staleOrders) {
        try {
          const result = await cancelOrder(
            id,
            `Automatically cancelled — no successful payment within ${timeoutHours}h of order creation.`
          );
          if (result.cancelled) {
            cancelled++;
            restoredStock += result.restoredQuantity;
          }
        } catch (error) {
          failed++;
          console.error(`[cleanup] Failed to expire stale order ${id}:`, error);
        }
      }

      // If this batch was smaller than BATCH_SIZE there's nothing left to page through.
      if (staleOrders.length < BATCH_SIZE) break;
    }
  } catch (error) {
    console.error("[cleanup] Expired-order cleanup run failed:", error);
  }

  const executionTime = Date.now() - start;
  console.log(
    `[cleanup] ${new Date().toISOString()} scanned=${scanned} cancelled=${cancelled} restoredStock=${restoredStock} failed=${failed} batches=${batches} executionTimeMs=${executionTime}`
  );

  return { scanned, cancelled, restoredStock, executionTime };
}
