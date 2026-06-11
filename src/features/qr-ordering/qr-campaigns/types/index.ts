import type { DistributionCampaign, QRCode, User } from "@/types/models";
import type { CampaignStatus } from "@/types/enums";

export interface CampaignWithQRCodes extends DistributionCampaign {
  qrCodes: QRCode[];
  createdBy: Pick<User, "id" | "firstName" | "lastName"> | null;
  _count: { qrCodes: number };
}

export interface CampaignWithCount extends DistributionCampaign {
  _count: { qrCodes: number };
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  totalQRCodes?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  totalQRCodes?: number;
  status?: CampaignStatus;
  startDate?: string;
  endDate?: string;
}

export interface CampaignFilter {
  status?: CampaignStatus;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export type { CampaignStatus };
