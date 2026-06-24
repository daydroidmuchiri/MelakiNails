"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { ShoppingBag, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="bg-cream min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-cream-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-muted/60" />
          </div>
          <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
            Your cart is empty
          </h1>
          <p className="text-sm text-muted mb-8">
            Looks like you haven&apos;t added anything yet.
          </p>
          <Link
            href="/products"
            id="shop-now-link"
            className="inline-flex items-center gap-2 bg-amber hover:bg-amber-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-200"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold text-charcoal">
              Shopping Cart
            </h1>
            <p className="text-sm text-muted mt-0.5">{items.length} {items.length === 1 ? "item" : "items"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="clear-cart-btn"
              onClick={clearCart}
              className="text-xs text-muted hover:text-badge-sale transition-colors font-medium"
            >
              Clear cart
            </button>
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-charcoal transition-colors font-medium"
            >
              <ArrowLeft className="w-3 h-3" />
              Continue shopping
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-card px-6">
              {items.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
