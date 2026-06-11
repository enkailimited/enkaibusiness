export const ROLE_SCOPES = {
  PLATFORM: "PLATFORM" as const,
  BUSINESS: "BUSINESS" as const,
};

export const MODULE_NAMES = [
  "users", "roles", "workspaces", "businesses", "branches", "stores",
  "catalog", "sales", "inventory", "purchases", "expenses", "reports",
  "settings", "customers", "suppliers", "subscriptions", "staff",
  "commissions", "leads", "marketing", "support", "finance",
  "distribution", "notifications", "email", "campaigns",
] as const;

export const ROUTE_LABELS: Record<string, string> = {
  "/platform/dashboard": "Platform Dashboard",
  "/platform/users": "User Management",
  "/platform/roles": "Role Management",
  "/platform/settings": "Platform Settings",
  "/platform/support": "Support Tickets",
  "/workspaces/dashboard": "Workspace Dashboard",
  "/workspaces/businesses": "Business Management",
  "/workspaces/members": "Team Members",
};
