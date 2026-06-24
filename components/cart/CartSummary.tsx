"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { ShoppingCart, ArrowRight } from "lucide-react";

export function CartSummary() {
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);

  const subtotal = totalPrice();
  const delivery = subtotal >= 5000 ? 0 : 300;
  const total = subtotal + delivery;
  const items = totalItems();

  return (
    <div className="bg-white rounded-2xl shadow-card p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-charcoal mb-5">
        Order Summary
      </h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-charcoal-400">
          <span>
            Subtotal ({items} {items === 1 ? "item" : "items"})
          </span>
          <span className="font-semibold text-charcoal">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex justify-between text-charcoal-400">
          <span>Delivery</span>
          <span className={delivery === 0 ? "text-badge-new font-semibold" : "font-semibold text-charcoal"}>
            {delivery === 0 ? "FREE" : formatPrice(delivery)}
          </span>
        </div>
        {delivery > 0 && (
          <p className="text-xs text-muted bg-cream-100 rounded-lg px-3 py-2">
            Add {formatPrice(5000 - subtotal)} more for free delivery
          </p>
        )}
      </div>

      <div className="border-t border-border mt-4 pt-4">
        <div className="flex justify-between font-bold text-base text-charcoal">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        id="proceed-to-checkout"
        className="mt-5 w-full flex items-center justify-center gap-2 bg-amber hover:bg-amber-dark text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 text-sm"
      >
        Proceed to Checkout
        <ArrowRight className="w-4 h-4" />
      </Link>

      <Link
        href="/products"
        className="mt-3 w-full flex items-center justify-center gap-2 border border-border text-charcoal-400 hover:text-charcoal font-medium py-2.5 px-4 rounded-xl transition-colors duration-200 text-sm"
      >
        <ShoppingCart className="w-4 h-4" />
        Continue Shopping
      </Link>
    </div>
  );
}
