"use client";

import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useState } from "react";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const [, setMovedItems] = useState<Set<string>>(new Set());

  const handleMoveToCart = (item: typeof items[0]) => {
    const product: Product = {
      id: item.productId,
      name: item.name,
      price: item.price,
      images: item.image ? [item.image] : [],
      slug: item.slug,
      description: "",
      stock: 99,
      lowStockThreshold: 5,
      active: true,
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sku: null,
      categoryId: "",
      category: { id: "", name: "", slug: "", image: null, displayOrder: 0, active: true, createdAt: "", updatedAt: "" },
      originalPrice: null,
      badge: null,
      rating: 0,
      reviewCount: 0,
    };
    addItem(product, 1);
    removeItem(item.productId);
    setMovedItems((prev) => new Set(prev).add(item.productId));
  };

  if (items.length === 0) {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Heart className="w-16 h-16 text-muted/30 mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-charcoal mb-2">
            Your Wishlist is Empty
          </h1>
          <p className="text-sm text-muted mb-6">
            Save items you love and come back to them anytime.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-amber hover:bg-amber-dark text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-charcoal">
              My Wishlist
            </h1>
            <p className="text-sm text-muted mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} saved
            </p>
          </div>
          <button
            onClick={clearWishlist}
            className="text-xs text-muted hover:text-badge-sale transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-2xl shadow-card overflow-hidden group flex flex-col"
            >
              <Link href={`/products/${item.slug}`} className="block aspect-[4/3] relative overflow-hidden bg-cream">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="w-12 h-12 text-muted/20" />
                  </div>
                )}
              </Link>

              <div className="p-4 flex flex-col flex-1">
                <Link
                  href={`/products/${item.slug}`}
                  className="text-sm font-semibold text-charcoal hover:text-amber transition-colors line-clamp-2 mb-1"
                >
                  {item.name}
                </Link>
                <p className="text-base font-bold text-amber mb-4">
                  {formatPrice(item.price)}
                </p>

                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber hover:bg-amber-dark text-white text-xs font-bold py-2 rounded-xl transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="p-2 border border-border rounded-xl text-muted hover:text-badge-sale hover:border-badge-sale transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
