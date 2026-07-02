"use server";

import { maybeProcessAbandonedCarts } from "@/lib/abandoned-carts/maybeProcessAbandonedCarts";

/**
 * Server Action wrapper so Client Component pages (the cart page uses
 * client-side Zustand state, so it can't directly call server-only code
 * during render) can still trigger the opportunistic lazy check. Call it
 * fire-and-forget from a useEffect — it's already non-blocking and
 * never-throwing internally, so nothing needs to be awaited here either.
 */
export async function triggerAbandonedCartCheck(): Promise<void> {
  await maybeProcessAbandonedCarts();
}
