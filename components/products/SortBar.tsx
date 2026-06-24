"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/constants";
import { ArrowUpDown, LayoutGrid, List } from "lucide-react";

interface SortBarProps {
  total: number;
  currentCategory?: string;
}

export function SortBar({ total, currentCategory }: SortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "featured";

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-border mb-5">
      <div>
        <h1 className="text-lg font-semibold text-charcoal">
          {currentCategory
            ? currentCategory
            : "Salon Furniture & Equipment"}
        </h1>
        <p className="text-xs text-muted mt-0.5">{total} products found</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Sort select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted shrink-0" />
          <select
            id="sort-select"
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="text-sm border border-border rounded-lg px-2.5 py-1.5 text-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-amber focus:border-amber cursor-pointer"
            aria-label="Sort products"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* View toggle (decorative — grid always used) */}
        <div className="hidden sm:flex items-center gap-1 border border-border rounded-lg p-1">
          <button
            className="p-1.5 rounded bg-amber text-white"
            aria-label="Grid view"
            title="Grid view"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded text-muted hover:text-charcoal"
            aria-label="List view"
            title="List view"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
