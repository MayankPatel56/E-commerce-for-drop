import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

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
      const loginUrl = new URL("/login", req.url); // Direct /login par bhejo, home page par nahi
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Agar user role admin nahi hai
    if (token.role !== "admin" && token.role !== "ADMIN") {
      const homeUrl = new URL("/shop", req.url);
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
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/customer/:path*"],
};