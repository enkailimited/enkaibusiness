// Campaigns Module — Email Marketing Campaigns

export {
  createCampaign, updateCampaign,
  addRecipients, scheduleCampaign,
  sendCampaign, cancelCampaign,
  getCampaignAnalytics, listCampaigns,
} from "@/notifications/email/services/campaign-service";
export type { CreateCampaignInput } from "@/notifications/email/services/campaign-service";
