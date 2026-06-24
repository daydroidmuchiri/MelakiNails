import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { Category } from "@/types";

export const revalidate = 0; // Fresh DB reads

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-charcoal">
          Category Management
          </h2>
          <p className="text-sm text-muted">
            Configure product departments, active filtering displays, and ordering.
          </p>
      </div>

      <CategoryManager categories={categories as unknown as Category[]} />
    </div>
  );
}
