import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/session";

export function proxy(request: NextRequest) {
  const isSignedIn = Boolean(request.cookies.get(sessionCookie)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app") && !isSignedIn) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (pathname === "/sign-in" && isSignedIn) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/sign-in"]
};
