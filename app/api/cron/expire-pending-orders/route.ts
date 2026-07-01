import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelOrder } from "@/lib/orders/cancelOrder";
import { isValidCronRequest } from "@/lib/cronAuth";

const DEFAULT_TIMEOUT_HOURS = 4;
const BATCH_SIZE = 100;
const MAX_BATCHES = 50; // hard ceiling: up to 5,000 orders per invocation

function getTimeoutHours(): number {
  const raw = process.env.ORDER_PENDING_TIMEOUT_HOURS;
  const parsed = raw ? Number(raw) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    if (raw) {
      console.warn(
        `Invalid ORDER_PENDING_TIMEOUT_HOURS="${raw}" — falling back to default of ${DEFAULT_TIMEOUT_HOURS}h`
      );
    }
    return DEFAULT_TIMEOUT_HOURS;
  }
  return parsed;
}

// GET /api/cron/expire-pending-orders — call via Vercel Cron or external scheduler.
// Cancels PENDING orders with no successful payment older than
// ORDER_PENDING_TIMEOUT_HOURS, restoring their reserved stock. Safe to run
// repeatedly: cancelOrder() is idempotent and the query only ever selects
// orders still in PENDING status, so an order already cancelled by a prior
// run (or by an admin) is never touched twice.
export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timeoutHours = getTimeoutHours();
  const cutoff = new Date(Date.now() - timeoutHours * 60 * 60 * 1000);

  let cancelled = 0;
  let alreadyCancelled = 0;
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

      for (const { id } of staleOrders) {
        try {
          const result = await cancelOrder(
            id,
            `Automatically cancelled — no successful payment within ${timeoutHours}h of order creation.`
          );
          if (result.cancelled) {
            cancelled++;
            console.log(`Expired and cancelled stale pending order ${id}`);
          } else {
            alreadyCancelled++;
          }
        } catch (error) {
          failed++;
          console.error(`Failed to expire stale order ${id}:`, error);
        }
      }

      // If this batch was smaller than BATCH_SIZE there's nothing left to page through.
      if (staleOrders.length < BATCH_SIZE) break;
    }

    return NextResponse.json({
      timeoutHours,
      batches,
      cancelled,
      alreadyCancelled,
      failed,
    });
  } catch (error) {
    console.error("Expire-pending-orders cron error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
