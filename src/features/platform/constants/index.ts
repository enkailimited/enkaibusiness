export const PLATFORM_SECTIONS = [
  { label: "Dashboard", value: "dashboard", icon: "LayoutDashboard" },
  { label: "Users", value: "users", icon: "Users" },
  { label: "Roles", value: "roles", icon: "Shield" },
  { label: "Subscriptions", value: "subscriptions", icon: "CreditCard" },
  { label: "Leads", value: "leads", icon: "Users" },
  { label: "Sales Network", value: "sales", icon: "Network" },
  { label: "Commissions", value: "commissions", icon: "Percent" },
  { label: "Marketing", value: "marketing", icon: "Megaphone" },
  { label: "Support", value: "support", icon: "Headphones" },
  { label: "Finance", value: "finance", icon: "TrendingUp" },
  { label: "Settings", value: "settings", icon: "Settings" },
  { label: "Onboarding", value: "onboarding", icon: "Rocket" },
] as const;

export type PlatformSection = (typeof PLATFORM_SECTIONS)[number]["value"];
