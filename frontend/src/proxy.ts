import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve session token from Better Auth cookie
  const sessionCookie =
    getSessionCookie(request) ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  // 1. Check protected /screening and /dashboard routes
  if (pathname.startsWith("/screening") || pathname.startsWith("/dashboard")) {
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 2. If logged in and visiting auth pages (/login or /register), redirect to callbackUrl or /screening
  if (sessionCookie && (pathname === "/login" || pathname === "/register")) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    const destination =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/screening";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/screening",
    "/screening/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/login",
    "/register",
  ],
};
