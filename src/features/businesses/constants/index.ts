export const INDUSTRIES = [
  "COMMERCE",
  "HEALTHCARE",
  "RESTAURANT",
  "MANUFACTURING",
  "AGRICULTURE",
  "SERVICES",
] as const;

export const INDUSTRY_LABELS: Record<string, string> = {
  COMMERCE: "Commerce",
  HEALTHCARE: "Healthcare",
  RESTAURANT: "Restaurant",
  MANUFACTURING: "Manufacturing",
  AGRICULTURE: "Agriculture",
  SERVICES: "Services",
};

export const BUSINESS_MODES: Record<string, string[]> = {
  COMMERCE: ["retail", "wholesale", "both"],
  HEALTHCARE: ["clinic", "pharmacy", "laboratory", "hospital"],
  RESTAURANT: ["dine_in", "takeaway", "delivery", "catering"],
  MANUFACTURING: ["production", "assembly", "packaging"],
  AGRICULTURE: ["farming", "processing", "distribution"],
  SERVICES: ["consulting", "agency", "professional"],
};

export const CURRENCIES = [
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "USD", name: "US Dollar", symbol: "$" },
] as const;

export const TIMEZONES = [
  "Africa/Dar_es_Salaam",
  "Africa/Nairobi",
  "Africa/Kampala",
  "Africa/Kigali",
  "Africa/Johannesburg",
  "Africa/Lagos",
] as const;
