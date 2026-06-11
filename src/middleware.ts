import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Public routes that don't need auth
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/privacy", "/terms"];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  
  // Static assets and internal routes
  const isStatic = pathname.startsWith("/_next") || 
                   pathname.startsWith("/favicon") || 
                   pathname.startsWith("/images") || 
                   pathname.startsWith("/icons") ||
                   pathname.startsWith("/api/auth");
                   
  // Diagnostics
  const isDiagnostics = pathname.startsWith("/auth-diagnostics") || 
                         pathname.startsWith("/session-diagnostics");

  if (isStatic || isDiagnostics || pathname === "/") {
    return NextResponse.next();
  }

  // Check for session cookie
  const allCookies = req.cookies.getAll();
  // better-auth v1.6 defaults to "better-auth.session_token"
  const hasSession = allCookies.some(c => 
    c.name.includes("session_token") || 
    c.name.includes("session-token") ||
    c.name.includes("better-auth")
  );

  console.log(`Middleware: ${pathname}, hasSession: ${hasSession}, cookies: ${allCookies.map(c => c.name).join(", ")}`);

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isPublic && pathname === "/login") {
    return NextResponse.redirect(new URL("/platform/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|icons|fonts).*)"],
}
