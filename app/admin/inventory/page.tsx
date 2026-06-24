import { prisma } from "@/lib/prisma";
import { InventoryManager } from "@/components/admin/InventoryManager";
import type { Product } from "@/types";

export const revalidate = 0; // Fresh reads

export default async function AdminInventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { stock: "asc" }, // Show lowest stock products first by default
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Inventory Control Center
        </h2>
        <p className="text-sm text-muted">
          Inspect active product levels, adjust warning thresholds, and trigger reorders.
        </p>
      </div>

      <InventoryManager products={products as unknown as Product[]} />
    </div>
  );
}
