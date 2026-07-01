import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/health — uptime monitor target. Verifies the app can actually
// reach its database rather than just that the process is running.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ status: "error", db: "down" }, { status: 503 });
  }
}
