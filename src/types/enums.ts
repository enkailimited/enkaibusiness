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

export const ROLE_SCOPES = ["PLATFORM", "BUSINESS", "WORKSPACE"] as const;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];
export type Industry = (typeof INDUSTRIES)[number];
export type CatalogItemType = (typeof CATALOG_ITEM_TYPES)[number];
export type RoleScope = (typeof ROLE_SCOPES)[number];

export const INDUSTRY_MODES: Record<Industry, readonly string[]> = {
  COMMERCE: ["retail", "wholesale"],
  HEALTHCARE: ["pharmacy", "clinic", "hospital"],
  RESTAURANT: ["restaurant", "cafe", "bakery"],
  MANUFACTURING: ["general"],
  AGRICULTURE: ["general"],
  SERVICES: ["general"],
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

export enum SalesProfileStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum LeadSource {
  MANUAL = "MANUAL",
  SELF_REGISTRATION = "SELF_REGISTRATION",
  SALES_REGISTRATION = "SALES_REGISTRATION",
  REFERRAL = "REFERRAL",
  CAMPAIGN = "CAMPAIGN",
}

export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  INTERESTED = "INTERESTED",
  DEMO = "DEMO",
  NEGOTIATION = "NEGOTIATION",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
}

export enum SubscriptionInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export enum SubscriptionStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  GRACE_PERIOD = "GRACE_PERIOD",
  SUSPENDED = "SUSPENDED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum CommissionType {
  FLAT = "FLAT",
  PERCENTAGE = "PERCENTAGE",
}

export enum CommissionLedgerStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}

export enum QRCodeStatus {
  UNASSIGNED = "UNASSIGNED",
  ASSIGNED = "ASSIGNED",
  INSTALLED = "INSTALLED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DAMAGED = "DAMAGED",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum CustomerType {
  RETAIL = "RETAIL",
  WHOLESALE = "WHOLESALE",
  WALK_IN = "WALK_IN",
}

export enum PricingTier {
  RETAIL = "RETAIL",
  WHOLESALE = "WHOLESALE",
  PROMO = "PROMO",
  CUSTOMER_GROUP = "CUSTOMER_GROUP",
}

export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum OnboardingStep {
  LEAD_CREATED = "LEAD_CREATED",
  CONTACTED = "CONTACTED",
  CONVERTED = "CONVERTED",
  WORKSPACE_CREATED = "WORKSPACE_CREATED",
  BUSINESS_CREATED = "BUSINESS_CREATED",
  OWNER_ASSIGNED = "OWNER_ASSIGNED",
  TRAINING_COMPLETED = "TRAINING_COMPLETED",
  ACTIVE_CUSTOMER = "ACTIVE_CUSTOMER",
}
