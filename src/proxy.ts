import { getSessionCookie } from "better-auth/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const authenticationUrl = new URL(request.nextUrl.pathname === "/checkout" ? "/sign-up" : "/sign-in", request.url);
    authenticationUrl.searchParams.set("callbackURL", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(authenticationUrl);
  }
  return NextResponse.next();
}

// Order pages (including links in order emails and WhatsApp messages) need the customer to sign in first.
export const config = { matcher: ["/account/:path*", "/admin/:path*", "/checkout", "/order-confirmation/:path*"] };
