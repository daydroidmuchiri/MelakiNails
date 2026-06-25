import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.role || !ADMIN_ROLES.has(session.user.role)) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function requireAdminApi(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.role || !ADMIN_ROLES.has(String(token.role))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
