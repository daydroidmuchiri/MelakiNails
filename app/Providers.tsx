"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

export function Providers({ children }: { children: React.ReactNode }) {
  // Both stores use `skipHydration: true` (see store/cartStore.ts) so their
  // first client render matches the server's empty state exactly, avoiding
  // a hydration mismatch. Rehydrating from localStorage here, after mount,
  // is safe — it's a normal post-hydration state update, not part of the
  // render React has to reconcile against the server-rendered HTML.
  useEffect(() => {
    useCartStore.persist.rehydrate();
    useWishlistStore.persist.rehydrate();
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
