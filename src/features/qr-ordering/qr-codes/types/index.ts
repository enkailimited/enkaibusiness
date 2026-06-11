import type { QRCode, QRCodeAssignment, QRCodeInstallation, DistributionCampaign, Business } from "@/types/models";
import type { QRCodeStatus } from "@/types/enums";

export interface QRCodeWithRelations extends QRCode {
  campaign: Pick<DistributionCampaign, "id" | "name">;
  business: Pick<Business, "id" | "name"> | null;
  assignments: QRCodeAssignment[];
  installations: QRCodeInstallation[];
}

export interface CreateQRCodeInput {
  campaignId: string;
  count?: number;
}

export interface AssignQRCodeInput {
  qrCodeIds: string[];
  assignedTo: string;
  notes?: string;
}

export interface InstallQRCodeInput {
  qrCodeId: string;
  businessId: string;
  location?: string;
  notes?: string;
}

export interface QRCodeFilter {
  campaignId?: string;
  status?: QRCodeStatus;
  businessId?: string;
  assignedToId?: string;
}

export type { QRCodeStatus };
