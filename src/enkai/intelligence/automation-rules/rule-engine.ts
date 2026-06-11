import "server-only";

import { prisma } from "@/server/db";
import { sendEmailWithDefaultConfig } from "@/notifications/email/services/smtp-service";
import { renderTemplate } from "@/notifications/email/services/template-service";

export interface AutomationAction {
  type: "send_email" | "send_notification" | "create_alert" | "adjust_stock";
  config: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  businessId: string;
  name: string;
  trigger: string;
  condition: Record<string, unknown>;
  actions: AutomationAction[];
  isActive: boolean;
}

export async function evaluateAndExecute(
  businessId: string,
  trigger: string,
  context: Record<string, unknown>,
): Promise<void> {
  const rules = await prisma.setting.findMany({
    where: {
      businessId,
      key: { startsWith: "automation_rule_" },
    },
  });

  for (const ruleSetting of rules) {
    try {
      const rule = JSON.parse(ruleSetting.value) as AutomationRule;
      if (!rule.isActive || rule.trigger !== trigger) continue;
      if (!evaluateCondition(rule.condition, context)) continue;

      for (const action of rule.actions) {
        await executeAction(action, context);
      }
    } catch (error) {
      console.error(`Failed to execute automation rule ${ruleSetting.id}:`, error);
    }
  }

  // Execute built-in rules
  await executeBuiltInRules(businessId, trigger, context);
}

async function executeBuiltInRules(
  businessId: string,
  trigger: string,
  context: Record<string, unknown>,
): Promise<void> {
  if (trigger === "low_stock") {
    const itemName = context.itemName as string;
    const currentStock = context.currentStock as number;

    // Send low stock email alert
    const tpl = await prisma.emailTemplate.findFirst({
      where: { slug: "low-stock-alert", businessId },
    });

    if (tpl) {
      const rendered = await renderTemplate(tpl, {
        businessName: "Your Business",
        items: `<li>${itemName}: ${currentStock} remaining</li>`,
      });

      // Find business owners/admins to notify
      const admins = await prisma.userRole.findMany({
        where: {
          businessId,
          role: { slug: { in: ["owner", "manager"] } },
        },
        include: { user: { select: { email: true } } },
      });

      for (const admin of admins) {
        if (admin.user.email) {
          await sendEmailWithDefaultConfig({
            to: admin.user.email,
            subject: rendered.subject,
            html: rendered.html,
          });
        }
      }
    }
  }
}

function evaluateCondition(
  condition: Record<string, unknown>,
  context: Record<string, unknown>,
): boolean {
  for (const [key, value] of Object.entries(condition)) {
    const contextValue = context[key];
    if (contextValue === undefined) return false;
    if (contextValue !== value) return false;
  }
  return true;
}

async function executeAction(
  action: AutomationAction,
  context: Record<string, unknown>,
): Promise<void> {
  switch (action.type) {
    case "send_notification":
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: context.userId as string,
          businessId: context.businessId as string,
          type: "system",
          title: (action.config.title as string) || "Automation Alert",
          message: interpolate((action.config.message as string) || "", context),
        },
      });
      break;

    case "send_email":
      await sendEmailWithDefaultConfig({
        to: context.email as string,
        subject: interpolate((action.config.subject as string) || "Notification", context),
        html: interpolate((action.config.html as string) || "", context),
      });
      break;

    case "create_alert":
      await prisma.notification.create({
        data: {
          userId: context.userId as string,
          businessId: context.businessId as string,
          type: "alert",
          title: (action.config.title as string) || "Alert",
          message: interpolate((action.config.message as string) || "", context),
        },
      });
      break;
  }
}

function interpolate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}
