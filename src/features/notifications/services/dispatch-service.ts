import "server-only";

import { prisma } from "@/server/db";
import { enqueue } from "@/server/jobs/queue";

export type NotificationChannel = "in_app" | "email" | "sms" | "whatsapp";

export interface DispatchInput {
  userId: string;
  businessId?: string;
  workspaceId?: string;
  branchId?: string;
  title: string;
  message: string;
  type?: string;
  channels?: NotificationChannel[];
  referenceType?: string;
  referenceId?: string;
  link?: string;
  templateName?: string;
  templateVars?: Record<string, string | number>;
}

export interface DispatchResult {
  inApp: boolean;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  errors: string[];
}

async function getUserPreferences(
  userId: string,
  businessId?: string,
  event?: string,
): Promise<{ inApp: boolean; email: boolean; sms: boolean }> {
  const prefs = await prisma.notificationPreference.findFirst({
    where: { userId, businessId: businessId ?? null, event: event ?? "default" },
  });
  if (prefs) {
    return { inApp: prefs.inApp, email: prefs.email, sms: prefs.sms };
  }
  return { inApp: true, email: false, sms: false };
}

async function dispatchInApp(input: DispatchInput): Promise<boolean> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId ?? null,
        businessId: input.businessId ?? null,
        branchId: input.branchId ?? null,
        title: input.title,
        message: input.message ?? null,
        type: input.type ?? "info",
        channel: "in_app",
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function dispatchEmail(input: DispatchInput): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, firstName: true },
    });
    if (!user?.email) return false;

    await enqueue("send-email", `email:${input.title}`, {
      to: user.email,
      subject: input.title,
      html: input.message,
      businessId: input.businessId,
      userId: input.userId,
    });

    return true;
  } catch {
    return false;
  }
}

async function dispatchSms(input: DispatchInput): Promise<boolean> {
  try {
    const staff = await prisma.staff.findFirst({
      where: { userId: input.userId },
      select: { phone: true },
    });
    if (!staff?.phone) return false;

    await enqueue("send-notification", `sms:${input.title}`, {
      phone: staff.phone,
      message: input.message,
      businessId: input.businessId,
      userId: input.userId,
    });

    return true;
  } catch {
    return false;
  }
}

async function dispatchWhatsApp(input: DispatchInput): Promise<boolean> {
  try {
    await enqueue("send-notification", `whatsapp:${input.title}`, {
      to: input.userId,
      message: input.message,
      businessId: input.businessId,
      userId: input.userId,
    });
    return true;
  } catch {
    return false;
  }
}

function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

export async function dispatch(input: DispatchInput): Promise<DispatchResult> {
  const result: DispatchResult = { inApp: false, email: false, sms: false, whatsapp: false, errors: [] };

  const requestedChannels = input.channels ?? ["in_app"];
  const prefs = await getUserPreferences(input.userId, input.businessId, input.type);

  const resolvedMessage = input.templateName
    ? renderTemplate(input.message, input.templateVars ?? {})
    : input.message;

  const dispatchInput: DispatchInput = { ...input, message: resolvedMessage };

  const channelMap: Record<NotificationChannel, () => Promise<boolean>> = {
    in_app: () => dispatchInApp(dispatchInput),
    email: () => dispatchEmail(dispatchInput),
    sms: () => dispatchSms(dispatchInput),
    whatsapp: () => dispatchWhatsApp(dispatchInput),
  };

  for (const channel of requestedChannels) {
    if (channel === "in_app" && !prefs.inApp) continue;
    if (channel === "email" && !prefs.email) continue;
    if (channel === "sms" && !prefs.sms) continue;

    try {
      const ok = await channelMap[channel]();
      result[channel] = ok;
    } catch (e) {
      result[channel] = false;
      result.errors.push(`${channel}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return result;
}

export async function dispatchToMany(
  inputs: DispatchInput[],
): Promise<DispatchResult[]> {
  return Promise.all(inputs.map((i) => dispatch(i)));
}

export async function dispatchByEvent(
  event: string,
  userId: string,
  businessId?: string,
  vars?: Record<string, string | number>,
): Promise<DispatchResult> {
  const template = await prisma.notificationTemplate.findFirst({
    where: { event, isActive: true },
  });

  if (!template) {
    return { inApp: false, email: false, sms: false, whatsapp: false, errors: ["No template found"] };
  }

  const title = vars ? renderTemplate(template.title, vars) : template.title;
  const message = vars ? renderTemplate(template.message, vars) : template.message;

  return dispatch({
    userId,
    businessId,
    title,
    message,
    type: template.type ?? undefined,
    channels: [template.channel as NotificationChannel],
    templateName: template.name ?? undefined,
  });
}
