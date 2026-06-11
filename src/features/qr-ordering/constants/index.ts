import { CampaignStatus, QRCodeStatus } from "@/types/enums";

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  [CampaignStatus.DRAFT]: "Draft",
  [CampaignStatus.ACTIVE]: "Active",
  [CampaignStatus.COMPLETED]: "Completed",
  [CampaignStatus.ARCHIVED]: "Archived",
};

export const QR_CODE_STATUS_LABELS: Record<string, string> = {
  [QRCodeStatus.UNASSIGNED]: "Unassigned",
  [QRCodeStatus.ASSIGNED]: "Assigned",
  [QRCodeStatus.INSTALLED]: "Installed",
  [QRCodeStatus.ACTIVE]: "Active",
  [QRCodeStatus.INACTIVE]: "Inactive",
  [QRCodeStatus.DAMAGED]: "Damaged",
};

export const QR_CODE_STATUS_VARIANTS: Record<string, string> = {
  [QRCodeStatus.UNASSIGNED]: "secondary",
  [QRCodeStatus.ASSIGNED]: "warning",
  [QRCodeStatus.INSTALLED]: "success",
  [QRCodeStatus.ACTIVE]: "default",
  [QRCodeStatus.INACTIVE]: "outline",
  [QRCodeStatus.DAMAGED]: "destructive",
};

export const CAMPAIGN_STATUS_VARIANTS: Record<string, string> = {
  [CampaignStatus.DRAFT]: "secondary",
  [CampaignStatus.ACTIVE]: "success",
  [CampaignStatus.COMPLETED]: "default",
  [CampaignStatus.ARCHIVED]: "outline",
};
