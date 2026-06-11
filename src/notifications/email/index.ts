// Email Notification Module — SMTP-based email delivery

export {
  sendEmail,
  sendEmailWithBusinessConfig,
  sendEmailWithDefaultConfig,
  testConnection,
} from "./services/smtp-service";
export type { SmtpConfig, SendEmailOptions, SendEmailResult } from "./services/smtp-service";

export { enqueueEmail, processCampaignEmails } from "./services/email-queue-service";

export {
  renderTemplate,
  seedSystemTemplates,
  cloneSystemTemplate,
  createOrUpdateTemplate,
  SYSTEM_TEMPLATES,
} from "./services/template-service";

export {
  createCampaign,
  updateCampaign,
  addRecipients,
  scheduleCampaign,
  sendCampaign,
  cancelCampaign,
  getCampaignAnalytics,
  listCampaigns,
} from "./services/campaign-service";
export type { CreateCampaignInput } from "./services/campaign-service";
