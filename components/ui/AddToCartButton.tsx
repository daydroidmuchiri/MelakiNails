"use client";

import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  product: Product;
  quantity?: number;
  className?: string;
  variant?: "full" | "compact";
}

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  variant = "full",
}: AddToCartButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "added">("idle");
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = async () => {
    if (state !== "idle") return;
    setState("loading");
    await new Promise((r) => setTimeout(r, 300)); // micro-feedback delay
    addItem(product, quantity);
    setState("added");
    setTimeout(() => setState("idle"), 2000);
  };

  const isOutOfStock = product.stock === 0;

  if (isOutOfStock) {
    return (
      <button
        disabled
        className={cn(
          "w-full flex items-center justify-center gap-2 bg-charcoal-100 text-muted font-semibold py-2.5 px-4 rounded-lg text-sm cursor-not-allowed",
          className
        )}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      id={`add-to-cart-${product.id}`}
      onClick={handleClick}
      disabled={state !== "idle"}
      className={cn(
        "w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg text-sm transition-all duration-200",
        state === "added"
          ? "bg-badge-new text-white"
          : "bg-amber hover:bg-amber-dark text-white",
        state !== "idle" && "opacity-90 cursor-wait",
        className
      )}
      aria-label={`Add ${product.name} to cart`}
    >
      {state === "loading" ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === "added" ? (
        <>
          <Check className="w-4 h-4" />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          {variant === "full" ? "Add to Cart" : "Add"}
        </>
      )}
    </button>
  );
}
