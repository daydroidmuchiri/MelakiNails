"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartState, Product } from "@/types";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.productId === product.id
          );
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.productId === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          const newItem: CartItem = {
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0] ?? "",
            quantity,
            slug: product.slug,
          };
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "melaki-cart",
      // Defer reading localStorage until after the first client render.
      // Without this, the store rehydrates as part of module
      // initialization — before React's hydration pass — so a returning
      // visitor's non-empty cart renders differently on the client's first
      // pass than on the server (which always starts empty, since there's
      // no localStorage during SSR). That mismatch is exactly React errors
      // #418/#423. Explicit rehydration is triggered post-mount in
      // app/Providers.tsx, once hydration has already completed safely.
      skipHydration: true,
    }
  )
);
