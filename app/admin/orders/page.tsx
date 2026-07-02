import { prisma } from "@/lib/prisma";
import { OrderDashboard } from "@/components/admin/OrderDashboard";
import type { Order } from "@/types";
import { maybeRunExpiredOrderCleanup } from "@/lib/orders/maybeRunExpiredOrderCleanup";

export const revalidate = 0; // Fresh reads

export default async function AdminOrdersPage() {
  // Opportunistic lazy cleanup, before loading orders — never blocks render.
  try {
    await maybeRunExpiredOrderCleanup();
  } catch (error) {
    console.error("[cleanup] Failed during admin orders page load:", error);
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Order Ledger
        </h2>
        <p className="text-sm text-muted">
          Track sales transactions, verify payments, update delivery status, and inspect history.
        </p>
      </div>

      <OrderDashboard orders={orders as unknown as Order[]} />
    </div>
  );
}
