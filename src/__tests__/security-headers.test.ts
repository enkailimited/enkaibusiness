import { describe, it, expect } from "vitest";

// Pure logic tests for security header requirements
const REQUIRED_HEADERS: Record<string, RegExp> = {
  "X-Frame-Options": /^DENY$/i,
  "X-Content-Type-Options": /^nosniff$/i,
  "Referrer-Policy": /strict-origin-when-cross-origin/i,
  "Strict-Transport-Security": /max-age=\d+.*includeSubDomains/i,
  "Content-Security-Policy": /default-src 'self'/,
  "Permissions-Policy": /camera=\(\), microphone=\(\)/,
};

function validateHeaders(headers: Record<string, string>): string[] {
  const missing: string[] = [];
  for (const [header, pattern] of Object.entries(REQUIRED_HEADERS)) {
    const value = headers[header];
    if (!value) {
      missing.push(`${header} is missing`);
    } else if (!pattern.test(value)) {
      missing.push(`${header} value "${value}" does not match expected pattern`);
    }
  }
  return missing;
}

describe("Security Headers", () => {
  it("should require all security headers", () => {
    const headers: Record<string, string> = {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    };
    const issues = validateHeaders(headers);
    expect(issues).toEqual([]);
  });

  it("should detect missing headers", () => {
    const issues = validateHeaders({});
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("X-Frame-Options"))).toBe(true);
  });

  it("should reject permissive XFO", () => {
    const issues = validateHeaders({ "X-Frame-Options": "ALLOWALL" });
    expect(issues.some((i) => i.includes("X-Frame-Options"))).toBe(true);
  });

  it("should require CSP default-src 'self'", () => {
    const issues = validateHeaders({ "Content-Security-Policy": "default-src 'none'" });
    expect(issues.some((i) => i.includes("Content-Security-Policy"))).toBe(true);
  });

  it("should require HSTS with includeSubDomains", () => {
    const issues = validateHeaders({ "Strict-Transport-Security": "max-age=3600" });
    expect(issues.some((i) => i.includes("Strict-Transport-Security"))).toBe(true);
  });
});
