import { prisma } from "@/lib/prisma";
import { ProductManager } from "@/components/admin/ProductManager";
import type { Product, Category } from "@/types";

export const revalidate = 0; // Fresh DB reads

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-charcoal">
            Product Management
          </h2>
          <p className="text-sm text-muted">
            Manage your store inventory catalog, features, pricing, and active listings.
          </p>
        </div>
      </div>

      <ProductManager
        products={products as unknown as Product[]}
        categories={categories as unknown as Category[]}
      />
    </div>
  );
}
