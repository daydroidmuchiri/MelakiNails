import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health — uptime monitor target. Verifies the app can actually
// reach its database rather than just that the process is running.
//
// This route uses no dynamic API, so without an explicit declaration
// Next.js statically pre-renders it at build time and serves that ONE
// cached "ok" response forever in production — an uptime monitor pointed
// at it would never detect a real outage. Force dynamic so it always hits
// the database fresh on every request.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
