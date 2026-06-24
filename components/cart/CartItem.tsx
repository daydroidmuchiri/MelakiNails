"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/types";
import Link from "next/link";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <div className="flex gap-4 py-5 border-b border-border last:border-0">
      {/* Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-cream-200 shrink-0">
        <Image
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${item.slug}`}
          className="text-sm font-semibold text-charcoal hover:text-amber transition-colors line-clamp-2 leading-snug"
        >
          {item.name}
        </Link>
        <p className="text-sm font-bold text-charcoal mt-1">
          {formatPrice(item.price)}
        </p>

        {/* Quantity controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            id={`decrease-qty-${item.productId}`}
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-cream-200 transition-colors"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3 text-charcoal" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-charcoal">
            {item.quantity}
          </span>
          <button
            id={`increase-qty-${item.productId}`}
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-cream-200 transition-colors"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3 text-charcoal" />
          </button>
        </div>
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end justify-between shrink-0">
        <p className="text-sm font-bold text-charcoal">
          {formatPrice(item.price * item.quantity)}
        </p>
        <button
          id={`remove-item-${item.productId}`}
          onClick={() => removeItem(item.productId)}
          className="p-1.5 rounded-lg text-muted hover:text-badge-sale hover:bg-badge-sale-bg transition-colors"
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
