export const DEFAULT_PLATFORM_ROLES = [
  { name: "Super Admin", slug: "super-admin", description: "Full platform access", scope: "PLATFORM" as const, isSystem: true },
  { name: "Admin", slug: "admin", description: "Platform administrator", scope: "PLATFORM" as const, isSystem: true },
  { name: "Support", slug: "support", description: "Platform support agent", scope: "PLATFORM" as const, isSystem: true },
] as const;

export const DEFAULT_BUSINESS_ROLES = [
  { name: "Business Owner", slug: "business-owner", description: "Full business access", scope: "BUSINESS" as const, isSystem: true },
  { name: "Manager", slug: "manager", description: "Business manager", scope: "BUSINESS" as const, isSystem: true },
  { name: "Staff", slug: "staff", description: "Business staff member", scope: "BUSINESS" as const, isSystem: true },
  { name: "Viewer", slug: "viewer", description: "Read-only access", scope: "BUSINESS" as const, isSystem: true },
] as const;

export const ALL_DEFAULT_ROLES = [...DEFAULT_PLATFORM_ROLES, ...DEFAULT_BUSINESS_ROLES];

export type DefaultRole = (typeof ALL_DEFAULT_ROLES)[number];
