"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (productId: string) => boolean;
  totalItems: () => number;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item: WishlistItem) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (!existing) {
          set((state) => ({ items: [...state.items, item] }));
        }
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },

      toggleItem: (item: WishlistItem) => {
        const existing = get().items.find((i) => i.productId === item.productId);
        if (existing) {
          get().removeItem(item.productId);
        } else {
          get().addItem(item);
        }
      },

      isInWishlist: (productId: string) =>
        get().items.some((i) => i.productId === productId),

      totalItems: () => get().items.length,

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "melaki-wishlist",
      // See store/cartStore.ts — same SSR-hydration-mismatch fix.
      skipHydration: true,
    }
  )
);
