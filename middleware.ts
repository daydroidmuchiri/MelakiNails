import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow NextAuth's own API routes through (sign-in, callback, session, etc.)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Allow the login page itself through so users can authenticate
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // All other /admin/** routes require a valid JWT session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (token.role !== "ADMIN" && token.role !== "SUPER_ADMIN") {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only run this middleware on admin routes.
  // Storefront routes (/products, /cart, /checkout, etc.) are never touched.
  matcher: ["/admin/:path*"],
};
