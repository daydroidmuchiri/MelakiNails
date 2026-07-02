import { NextRequest, NextResponse } from "next/server";
import { cleanupExpiredOrders } from "@/lib/orders/cleanupExpiredOrders";
import { isValidCronRequest } from "@/lib/cronAuth";

// isValidCronRequest() reads request.headers — a dynamic API. Force
// dynamic explicitly so `next build` never attempts a static trial-render.
export const dynamic = "force-dynamic";

/**
 * OPTIONAL. Not required for the app to function.
 *
 * Stale-order cleanup runs opportunistically during normal traffic —
 * see lib/orders/maybeRunExpiredOrderCleanup.ts, wired into checkout,
 * payment initiation, and the admin dashboard/orders/products pages. That
 * path needs no scheduler at all and works unchanged on Vercel's Hobby plan.
 *
 * This endpoint exists only for teams that outgrow lazy cleanup and want a
 * dedicated scheduler instead (Vercel Pro cron, GitHub Actions, cron-job.org,
 * etc) — see docs/DEPLOYMENT.md "Optional: external scheduler". It calls the
 * exact same cleanupExpiredOrders() used by the lazy path (no duplicated
 * logic) and bypasses the lazy-path throttle, since an explicit authenticated
 * trigger is assumed to be intentional.
 */
export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await cleanupExpiredOrders();
  return NextResponse.json(metrics);
}
