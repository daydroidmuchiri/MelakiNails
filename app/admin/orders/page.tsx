import { prisma } from "@/lib/prisma";
import { OrderDashboard } from "@/components/admin/OrderDashboard";
import type { Order } from "@/types";

export const revalidate = 0; // Fresh reads

export default async function AdminOrdersPage() {
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
