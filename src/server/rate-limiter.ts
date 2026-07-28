interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const configs: Record<string, RateLimitConfig | undefined> = {
  global: { windowMs: 60_000, maxRequests: 100 },
  auth: { windowMs: 60_000, maxRequests: 10 },
  api: { windowMs: 60_000, maxRequests: 60 },
  upload: { windowMs: 60_000, maxRequests: 6 },
};

function getConfig(zone: string): RateLimitConfig {
  return configs[zone] ?? configs.global!;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  zone: string = "global",
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup();
  const config = getConfig(zone);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

export function rateLimitKey(req: { headers: { get: (name: string) => string | null }; nextUrl: { pathname: string } }): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "127.0.0.1";
  const path = req.nextUrl.pathname;
  return `${ip}:${path}`;
}

export function rateLimitZone(pathname: string): keyof typeof configs {
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/upload")) return "upload";
  if (pathname.startsWith("/api/")) return "api";
  return "global";
}
