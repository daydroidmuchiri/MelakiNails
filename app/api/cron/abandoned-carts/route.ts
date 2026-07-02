import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/lib/abandoned-carts/processAbandonedCarts";
import { isValidCronRequest } from "@/lib/cronAuth";

// isValidCronRequest() reads request.headers — a dynamic API. Force
// dynamic explicitly so `next build` never attempts a static trial-render.
export const dynamic = "force-dynamic";

/**
 * OPTIONAL. Not required for the app to function.
 *
 * Abandoned-cart reminders run opportunistically during normal traffic —
 * see lib/abandoned-carts/maybeProcessAbandonedCarts.ts, wired into the
 * home/shop/product/cart pages, checkout, and the admin dashboard. That
 * path needs no scheduler at all and works unchanged on Vercel's Hobby plan.
 *
 * This endpoint exists only for teams that outgrow lazy processing and want
 * a dedicated scheduler instead (Vercel Pro cron, GitHub Actions,
 * cron-job.org, etc) — see docs/DEPLOYMENT.md. It calls the exact same
 * processAbandonedCarts() used by the lazy path (no duplicated logic) and
 * bypasses the lazy-path throttle, since an explicit authenticated trigger
 * is assumed to be intentional.
 */
export async function GET(request: NextRequest) {
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await processAbandonedCarts();
  return NextResponse.json(metrics);
}
