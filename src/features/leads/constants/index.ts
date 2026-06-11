export { LeadSource, LeadStatus } from "@/types/enums";
export type { LeadSource as LeadSourceType, LeadStatus as LeadStatusType } from "@/types/enums";

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  MANUAL: "Manual",
  SELF_REGISTRATION: "Self Registration",
  SALES_REGISTRATION: "Sales Registration",
  REFERRAL: "Referral",
  CAMPAIGN: "Campaign",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  DEMO: "Demo",
  NEGOTIATION: "Negotiation",
  CONVERTED: "Converted",
  LOST: "Lost",
};

export const LEAD_SOURCE_OPTIONS = [
  { value: "MANUAL", label: "Manual" },
  { value: "SELF_REGISTRATION", label: "Self Registration" },
  { value: "SALES_REGISTRATION", label: "Sales Registration" },
  { value: "REFERRAL", label: "Referral" },
  { value: "CAMPAIGN", label: "Campaign" },
] as const;

export const LEAD_STATUS_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "INTERESTED", label: "Interested" },
  { value: "DEMO", label: "Demo" },
  { value: "NEGOTIATION", label: "Negotiation" },
  { value: "CONVERTED", label: "Converted" },
  { value: "LOST", label: "Lost" },
] as const;
