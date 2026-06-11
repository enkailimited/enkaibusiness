import "server-only";

import { prisma } from "@/server/db";
import { sendEmailWithDefaultConfig, sendEmailWithBusinessConfig } from "./smtp-service";
import type { SendEmailOptions } from "./smtp-service";

interface QueueJob {
  id: string;
  businessId?: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  campaignId?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

export async function enqueueEmail(job: QueueJob): Promise<void> {
  await prisma.emailLog.create({
    data: {
      businessId: job.businessId,
      templateId: job.templateId,
      campaignId: job.campaignId,
      recipient: job.to,
      subject: job.subject,
      status: "sent",
      sentAt: new Date(),
    },
  });

  processJob(job).catch((error) => {
    console.error(`Failed to send email to ${job.to}:`, error);
  });
}

async function processJob(job: QueueJob, retryCount = 0): Promise<boolean> {
  try {
    const options: SendEmailOptions = {
      to: job.to,
      subject: job.subject,
      html: job.html,
      text: job.text,
    };

    const result = job.businessId
      ? await sendEmailWithBusinessConfig(job.businessId, options)
      : await sendEmailWithDefaultConfig(options);

    if (result.success) {
      await prisma.emailLog.updateMany({
        where: { recipient: job.to, subject: job.subject, campaignId: job.campaignId },
        data: { status: "delivered" },
      });
      return true;
    }

    throw new Error(result.error || "Failed to send");
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * (retryCount + 1)));
      return processJob(job, retryCount + 1);
    }

    await prisma.emailLog.updateMany({
      where: { recipient: job.to, subject: job.subject, campaignId: job.campaignId },
      data: {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Max retries exceeded",
      },
    });

    return false;
  }
}

export async function processCampaignEmails(campaignId: string): Promise<{ sent: number; failed: number }> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      template: true,
      recipients: { where: { status: "pending" } },
    },
  });

  if (!campaign || !campaign.template) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of campaign.recipients) {
    const subject = campaign.template.subject;
    const html = campaign.template.htmlContent;

    const job: QueueJob = {
      id: recipient.id,
      businessId: campaign.businessId || undefined,
      to: recipient.email,
      subject,
      html,
      templateId: campaign.templateId || undefined,
      campaignId,
    };

    try {
      await processJob(job);
      sent++;
    } catch {
      failed++;
    }
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sent",
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
    },
  });

  return { sent, failed };
}
