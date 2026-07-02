import { prisma } from "@/lib/prisma";
import { notifyOrderStatusUpdated } from "@/lib/email/senders";

export type CancelOrderResult =
  | { cancelled: true; alreadyCancelled: false; restoredQuantity: number }
  | { cancelled: false; alreadyCancelled: true; restoredQuantity: 0 };

/**
 * Cancels an order and restores any reserved stock.
 *
 * Idempotent: stock is reserved (decremented) exactly once at order creation,
 * so this only restores it the first time an order transitions into
 * CANCELLED. Calling this again on an already-cancelled order is a no-op —
 * safe to retry from a cron job (or opportunistic lazy cleanup) without
 * double-crediting inventory.
 */
export async function cancelOrder(
  orderId: string,
  notes: string
): Promise<CancelOrderResult> {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { status: true },
    });

    if (existing.status === "CANCELLED") {
      return { cancelled: false as const, alreadyCancelled: true as const, restoredQuantity: 0 as const };
    }

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { productId: true, quantity: true },
    });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        statusHistory: {
          create: { status: "CANCELLED", notes },
        },
      },
    });

    const restoredQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { cancelled: true as const, alreadyCancelled: false as const, restoredQuantity };
  });

  if (result.cancelled) {
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    });
    await notifyOrderStatusUpdated({ order, status: "CANCELLED", notes }).catch((error) => {
      console.error(`Cancellation notification failed for order ${orderId}:`, error);
    });
  }

  return result;
}
