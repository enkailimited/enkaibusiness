import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  const isAuthApi = pathname.startsWith("/api/auth");
  const isHome = pathname === "/";

  if (isAuthApi || isHome) return NextResponse.next();

  const sessionCookie = req.cookies.get("better-auth-session")?.value;

  if (!sessionCookie && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isPublic) {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons).*)"],
};
