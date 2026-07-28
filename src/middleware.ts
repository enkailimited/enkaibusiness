import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, rateLimitKey, rateLimitZone } from "@/server/rate-limiter";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limiting
  const zone = rateLimitZone(pathname);
  const rlKey = rateLimitKey(req);
  const rl = checkRateLimit(rlKey, zone);
  if (!rl.allowed) {
    const retryAfter = Math.ceil((rl.resetAt - Date.now()) / 1000);
    const response = NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
    applySecurityHeaders(response);
    return response;
  }

  // Public routes that don't need auth
  const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/privacy", "/terms", "/menu"];
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

  // Static assets and internal routes
  const isStatic = pathname.startsWith("/_next") ||
                   pathname.startsWith("/favicon") ||
                   pathname.startsWith("/images") ||
                   pathname.startsWith("/icons") ||
                   pathname.startsWith("/api/auth") ||
                   pathname.startsWith("/api/health");

  // Diagnostics
  const isDiagnostics = pathname.startsWith("/auth-diagnostics") ||
                         pathname.startsWith("/session-diagnostics");

  if (isStatic || isDiagnostics || pathname === "/") {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // Check for session cookie
  const allCookies = req.cookies.getAll();
  // better-auth v1.6 defaults to "better-auth.session_token"
  const hasSession = allCookies.some(c =>
    c.name.includes("session_token") ||
    c.name.includes("session-token") ||
    c.name.includes("better-auth")
  );

  if (!hasSession && !isPublic) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    applySecurityHeaders(response);
    return response;
  }

  if (hasSession && isPublic && pathname === "/login") {
    const response = NextResponse.redirect(new URL("/platform/dashboard", req.url));
    applySecurityHeaders(response);
    return response;
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

function applySecurityHeaders(response: NextResponse): void {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ik.imagekit.io https://va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://ik.imagekit.io",
    "font-src 'self' data:",
    "connect-src 'self' https://ik.imagekit.io https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|icons|fonts).*)"],
}
