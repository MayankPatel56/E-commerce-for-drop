import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Safe fallback so a missing NEXTAUTH_URL never produces an undefined URL
// when building absolute redirect URLs (e.g. during Vercel builds).
const AUTH_BASE_URL =
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://www.indicoreoriginals.me";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      // Secure cookie check add kiya taaki production/localhost dono mein refresh handle ho sake
      secureCookie: process.env.NODE_ENV === "production",
    });

    // 1. Agar token nahi milta
    if (!token) {
      const loginUrl = new URL("/login", req.url || AUTH_BASE_URL); // Direct /login par bhejo, home page par nahi
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Agar user role admin nahi hai
    if (token.role !== "admin" && token.role !== "ADMIN") {
      const homeUrl = new URL("/shop", req.url || AUTH_BASE_URL);
      homeUrl.searchParams.set("error", "access_denied");
      return NextResponse.redirect(homeUrl);
    }
  }

  // Protect customer routes
  if (pathname.startsWith("/customer")) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
      const loginUrl = new URL("/login", req.url || AUTH_BASE_URL);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*"],
};