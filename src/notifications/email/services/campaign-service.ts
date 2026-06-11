import "server-only";

import { prisma } from "@/server/db";
import { processCampaignEmails } from "./email-queue-service";

export interface CreateCampaignInput {
  businessId: string;
  name: string;
  description?: string;
  templateId: string;
  segmentId?: string;
  scheduledAt?: Date;
  createdById: string;
}

export async function createCampaign(input: CreateCampaignInput) {
  const campaign = await prisma.campaign.create({
    data: {
      businessId: input.businessId,
      name: input.name,
      description: input.description,
      templateId: input.templateId,
      segmentId: input.segmentId,
      type: "email",
      status: input.scheduledAt ? "scheduled" : "draft",
      scheduledAt: input.scheduledAt,
      createdById: input.createdById,
    },
  });

  return campaign;
}

export async function updateCampaign(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    templateId: string;
    segmentId: string;
    status: string;
    scheduledAt: Date;
  }>,
) {
  return prisma.campaign.update({ where: { id }, data });
}

export async function addRecipients(
  campaignId: string,
  customerIds: string[],
  businessId: string,
) {
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds }, businessId, email: { not: null } },
    select: { id: true, email: true },
  });

  const recipients = customers
    .filter((c) => c.email)
    .map((c) => ({
      campaignId,
      customerId: c.id,
      email: c.email!,
      status: "pending" as const,
    }));

  if (recipients.length > 0) {
    await prisma.campaignRecipient.createMany({
      data: recipients,
      skipDuplicates: true,
    });
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { totalRecipients: { increment: recipients.length } },
  });

  return recipients.length;
}

export async function scheduleCampaign(id: string, scheduledAt: Date) {
  return prisma.campaign.update({
    where: { id },
    data: { status: "scheduled", scheduledAt },
  });
}

export async function sendCampaign(id: string) {
  await prisma.campaign.update({
    where: { id },
    data: { status: "sending" },
  });

  const result = await processCampaignEmails(id);
  return result;
}

export async function cancelCampaign(id: string) {
  return prisma.campaign.update({
    where: { id },
    data: { status: "cancelled" },
  });
}

export async function getCampaignAnalytics(id: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      recipients: true,
    },
  });

  if (!campaign) return null;

  const sent = campaign.recipients.filter((r) => r.status !== "pending").length;
  const delivered = campaign.recipients.filter((r) =>
    ["delivered", "opened", "clicked"].includes(r.status),
  ).length;
  const opened = campaign.recipients.filter((r) =>
    ["opened", "clicked"].includes(r.status),
  ).length;
  const clicked = campaign.recipients.filter((r) => r.status === "clicked").length;
  const failed = campaign.recipients.filter((r) => r.status === "failed").length;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    total: campaign.totalRecipients,
    sent,
    delivered,
    opened,
    clicked,
    failed,
    openRate: sent > 0 ? ((opened / sent) * 100).toFixed(1) : "0.0",
    clickRate: sent > 0 ? ((clicked / sent) * 100).toFixed(1) : "0.0",
    deliveryRate: campaign.totalRecipients > 0
      ? ((delivered / campaign.totalRecipients) * 100).toFixed(1)
      : "0.0",
  };
}

export async function listCampaigns(businessId: string) {
  return prisma.campaign.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true } },
      segment: { select: { name: true } },
      _count: { select: { recipients: true } },
    },
  });
}
