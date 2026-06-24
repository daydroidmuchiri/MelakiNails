"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import { ChevronRight, Tag } from "lucide-react";

interface ProductFiltersProps {
  categories: Category[];
  totalProducts: number;
}

export function ProductFilters({
  categories,
  totalProducts,
}: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSlug = searchParams.get("category") ?? "all-products";
  const currentBadge = searchParams.get("badge");

  const navigate = (params: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    router.push(`/products?${current.toString()}`);
  };

  const allCategoriesItem = {
    id: "all",
    slug: "all-products",
    name: "All Products",
    _count: { products: totalProducts },
  } as Category;

  const displayCategories = [allCategoriesItem, ...categories];

  return (
    <aside className="w-full">
      {/* Categories */}
      <div className="bg-sidebar rounded-xl p-4 mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3 px-1">
          Categories
        </h2>
        <nav>
          <ul className="space-y-0.5">
            {displayCategories.map((cat) => {
              const isActive =
                currentSlug === cat.slug && !currentBadge;
              return (
                <li key={cat.id}>
                  <button
                    onClick={() =>
                      navigate({
                        category:
                          cat.slug === "all-products" ? null : cat.slug,
                        badge: null,
                      })
                    }
                    className={cn(
                      "sidebar-item",
                      isActive && "active"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span
                      className={cn(
                        "text-2xs font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        isActive
                          ? "bg-amber text-white"
                          : "bg-cream-200 text-muted"
                      )}
                    >
                      {cat._count?.products ?? 0}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Badge filters */}
      <div className="bg-sidebar rounded-xl p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted mb-3 px-1 flex items-center gap-1.5">
          <Tag className="w-3 h-3" />
          Promotions
        </h2>
        <div className="space-y-0.5">
          {[
            { label: "Sale Items", value: "Sale" },
            { label: "New Arrivals", value: "New" },
          ].map((item) => {
            const isActive = currentBadge === item.value;
            return (
              <button
                key={item.value}
                onClick={() =>
                  navigate({
                    badge: isActive ? null : item.value,
                    category: null,
                  })
                }
                className={cn("sidebar-item", isActive && "active")}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3 h-3 text-muted shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
