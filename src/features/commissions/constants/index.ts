export { CommissionType, CommissionLedgerStatus } from "@/types/enums";
export type { CommissionType as CommissionTypeEnum, CommissionLedgerStatus as CommissionLedgerStatusEnum } from "@/types/enums";

export const COMMISSION_TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  PERCENTAGE: "Percentage",
};

export const LEDGER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const COMMISSION_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "FLAT", label: "Flat" },
] as const;

export const LEDGER_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "PAID", label: "Paid" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;
