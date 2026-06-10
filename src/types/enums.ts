export const WORKSPACE_MEMBER_ROLES = ["OWNER", "ADMIN", "MEMBER", "GUEST"] as const;

export const INDUSTRIES = [
  "COMMERCE",
  "HEALTHCARE",
  "RESTAURANT",
  "MANUFACTURING",
  "AGRICULTURE",
  "SERVICES",
] as const;

export const CATALOG_ITEM_TYPES = ["PRODUCT", "SERVICE", "MEDICINE", "MENU_ITEM"] as const;

export const ROLE_SCOPES = ["PLATFORM", "BUSINESS"] as const;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];
export type RoleScope = (typeof ROLE_SCOPES)[number];

export const INDUSTRY_MODES: Record<Industry, readonly string[]> = {
  COMMERCE: ["RETAIL", "WHOLESALE"],
  HEALTHCARE: ["PHARMACY", "CLINIC", "HOSPITAL"],
  RESTAURANT: ["RESTAURANT", "CAFE", "BAKERY"],
  MANUFACTURING: ["GENERAL"],
  AGRICULTURE: ["GENERAL"],
  SERVICES: ["GENERAL"],
} as const;

export const PLATFORM_ROLES = [
  { name: "Super Admin", slug: "super-admin" },
  { name: "National Manager", slug: "national-manager" },
  { name: "National Sales Manager", slug: "national-sales-manager" },
  { name: "Region Manager", slug: "region-manager" },
  { name: "Team Leader", slug: "team-leader" },
  { name: "Freelancer", slug: "freelancer" },
  { name: "Marketing Manager", slug: "marketing-manager" },
  { name: "Support Agent", slug: "support-agent" },
  { name: "Finance Officer", slug: "finance-officer" },
] as const;

export const BUSINESS_ROLES = [
  { name: "Owner", slug: "owner" },
  { name: "Manager", slug: "manager" },
  { name: "Cashier", slug: "cashier" },
  { name: "Accountant", slug: "accountant" },
  { name: "Doctor", slug: "doctor" },
  { name: "Pharmacist", slug: "pharmacist" },
  { name: "Chef", slug: "chef" },
] as const;
