"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Search, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { adjustInventory } from "@/app/admin/actions";
import type { Product } from "@/types";

interface InventoryManagerProps {
  products: Product[];
}

export function InventoryManager({ products }: InventoryManagerProps) {
  const [search, setSearch] = useState("");
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
  const [, startTransition] = useTransition();

  // Stock edit states
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [thresholdEdits, setThresholdEdits] = useState<Record<string, number>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Filtered & sorted products (low stock products sorted to top first, then alphabetical)
  const processedProducts = products
    .filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const isLowStock = p.stock <= p.lowStockThreshold;
      const matchesFilter = !showOnlyLowStock || isLowStock;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aLow = a.stock <= a.lowStockThreshold ? 1 : 0;
      const bLow = b.stock <= b.lowStockThreshold ? 1 : 0;
      if (aLow !== bLow) return bLow - aLow; // Low stock sorted to the top
      return a.name.localeCompare(b.name);
    });

  // Track state changes
  const handleStockChange = (productId: string, val: string) => {
    const num = parseInt(val);
    setStockEdits((prev) => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleThresholdChange = (productId: string, val: string) => {
    const num = parseInt(val);
    setThresholdEdits((prev) => ({
      ...prev,
      [productId]: isNaN(num) ? 0 : num,
    }));
  };

  // Submit action
  const handleSaveStock = async (product: Product) => {
    const newStock = stockEdits[product.id] ?? product.stock;
    const newThreshold = thresholdEdits[product.id] ?? product.lowStockThreshold;

    if (newStock < 0 || newThreshold < 0) {
      alert("Values must be greater than or equal to 0.");
      return;
    }

    setSavingId(product.id);
    startTransition(async () => {
      await adjustInventory(product.id, newStock, newThreshold);
      setSavingId(null);
      // Clean up edited state entries
      setStockEdits((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setThresholdEdits((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters and alert banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-white p-4 rounded-xl shadow-card">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search by SKU or item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-cream-50 pl-10 pr-4 py-2.5 rounded-lg text-sm border border-border focus:outline-none focus:ring-1 focus:ring-amber"
          />
        </div>

        {/* Low Stock checkbox Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer justify-end pr-2">
          <input
            type="checkbox"
            checked={showOnlyLowStock}
            onChange={(e) => setShowOnlyLowStock(e.target.checked)}
            className="rounded border-border text-amber focus:ring-amber h-4.5 w-4.5"
          />
          <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Show Only Low Stock
          </span>
        </label>
      </div>

      {/* Stock warning banner */}
      {products.some((p) => p.stock <= p.lowStockThreshold) && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Low Stock Alert!</span>
            <p className="text-xs leading-relaxed mt-0.5">
              Some products are currently below their low stock thresholds. Reorder inventory
              soon to prevent stockouts on the storefront.
            </p>
          </div>
        </div>
      )}

      {/* Inventory Catalog list */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          {processedProducts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">
              All items are fully stocked or no search match found.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-cream-50 text-2xs font-semibold text-muted uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Current Stock</th>
                  <th className="px-5 py-3">Low Threshold</th>
                  <th className="px-5 py-3">Unit Price</th>
                  <th className="px-5 py-3 text-right">Inventory Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {processedProducts.map((product) => {
                  const isLow = product.stock <= product.lowStockThreshold;
                  const currentEditStock = stockEdits[product.id] ?? product.stock;
                  const currentEditThreshold = thresholdEdits[product.id] ?? product.lowStockThreshold;
                  
                  const hasChanges =
                    currentEditStock !== product.stock ||
                    currentEditThreshold !== product.lowStockThreshold;

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isLow ? "bg-red-50/20 hover:bg-red-50/40" : "hover:bg-cream-50/50"
                      }`}
                    >
                      {/* Product Thumbnail */}
                      <td className="px-5 py-3.5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg relative overflow-hidden bg-cream-200 shrink-0 border border-border">
                          <Image
                            src={product.images[0] || "/placeholder.jpg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-charcoal block line-clamp-1">
                            {product.name}
                          </span>
                          {isLow && (
                            <span className="text-3xs text-red-700 font-bold uppercase tracking-wider flex items-center gap-0.5 mt-0.5">
                              <AlertTriangle className="w-3 h-3" />
                              Critical Stock Level
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-5 py-3.5 text-muted uppercase tracking-wider font-medium text-xs">
                        {product.sku || "—"}
                      </td>

                      {/* Current Stock */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 max-w-[120px]">
                          <input
                            type="number"
                            value={stockEdits[product.id] ?? product.stock}
                            onChange={(e) => handleStockChange(product.id, e.target.value)}
                            className={`w-16 border rounded px-2 py-1 text-center font-bold focus:outline-none focus:ring-1 focus:ring-amber ${
                              isLow
                                ? "border-red-300 bg-red-50/50 text-red-700"
                                : "border-border bg-cream-50"
                            }`}
                          />
                        </div>
                      </td>

                      {/* Low Stock Warning Threshold */}
                      <td className="px-5 py-3.5">
                        <input
                          type="number"
                          value={thresholdEdits[product.id] ?? product.lowStockThreshold}
                          onChange={(e) => handleThresholdChange(product.id, e.target.value)}
                          className="w-16 border border-border bg-cream-50 rounded px-2 py-1 text-center font-medium focus:outline-none focus:ring-1 focus:ring-amber text-charcoal-400"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="px-5 py-3.5 font-medium text-charcoal">
                        {formatPrice(product.price)}
                      </td>

                      {/* Quick Save Action */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleSaveStock(product)}
                          disabled={!hasChanges || savingId === product.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors duration-200 ${
                            hasChanges
                              ? "bg-amber text-white hover:bg-amber-dark"
                              : "bg-cream-100 text-charcoal-300 cursor-not-allowed"
                          }`}
                        >
                          {savingId === product.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          Apply
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
