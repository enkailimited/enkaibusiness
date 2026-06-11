export { SalesProfileStatus } from "@/types/enums";
export type { SalesProfileStatus as SalesProfileStatusType } from "@/types/enums";

export const PROFILE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export const PROFILE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
] as const;
