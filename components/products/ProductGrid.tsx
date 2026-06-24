import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { PackageSearch } from "lucide-react";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PackageSearch className="w-16 h-16 text-muted/40 mb-4" />
        <h3 className="text-lg font-semibold text-charcoal mb-2">
          No products found
        </h3>
        <p className="text-sm text-muted max-w-xs">
          Try adjusting your filters or browse all categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
