import { redirect } from "next/navigation";
import { maybeProcessAbandonedCarts } from "@/lib/abandoned-carts/maybeProcessAbandonedCarts";

// Force dynamic: this page now touches the DB (opportunistic cleanup
// trigger) on every load, so it must not be statically pre-rendered at
// build time — doing so needlessly opens DB connections during `next
// build`, which can exhaust a pooled connection's session-mode limit
// (confirmed live during testing) and adds nothing of value, since this
// page always immediately redirects anyway.
export const dynamic = "force-dynamic";

export default async function Home() {
  // Opportunistic lazy trigger — never blocks or fails this request.
  try {
    await maybeProcessAbandonedCarts();
  } catch (error) {
    console.error("[abandoned-carts] Failed during home page load:", error);
  }

  redirect("/products");
}
