import "server-only";

import { prisma } from "@/server/db";
import { eventBus } from "@/modules/ai/events/event-bus";

export type TriggerType =
  | "inventory-low"
  | "sale-completed"
  | "payment-received"
  | "invoice-overdue"
  | "stock-expiry"
  | "customer-birthday"
  | "scheduled";

export type ActionType =
  | "send-notification"
  | "send-email"
  | "create-purchase-order"
  | "apply-discount"
  | "update-status"
  | "webhook";

export interface RuleDefinition {
  id: string;
  name: string;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>;
  conditionConfig: Record<string, unknown>;
  actionType: ActionType;
  actionConfig: Record<string, unknown>;
  priority: number;
  cooldownMinutes: number;
}

export interface TriggerEvent {
  type: TriggerType;
  businessId: string;
  payload: Record<string, unknown>;
}

export class AutomationEngine {
  async evaluateTrigger(event: TriggerEvent): Promise<RuleDefinition[]> {
    const now = new Date();

    const rules = await prisma.automationRule.findMany({
      where: {
        businessId: event.businessId,
        triggerType: event.type,
        isActive: true,
      },
      orderBy: { priority: "asc" },
    });

    const matched: RuleDefinition[] = [];

    for (const rule of rules) {
      if (!this.meetsConditions(rule.conditionConfig as Record<string, unknown>, event.payload)) continue;

      if (rule.cooldownMinutes > 0 && rule.lastTriggeredAt) {
        const elapsed = now.getTime() - rule.lastTriggeredAt.getTime();
        if (elapsed < rule.cooldownMinutes * 60 * 1000) continue;
      }

      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { lastTriggeredAt: now },
      });

      matched.push({
        id: rule.id,
        name: rule.name,
        triggerType: rule.triggerType as TriggerType,
        triggerConfig: rule.triggerConfig as Record<string, unknown>,
        conditionConfig: rule.conditionConfig as Record<string, unknown>,
        actionType: rule.actionType as ActionType,
        actionConfig: rule.actionConfig as Record<string, unknown>,
        priority: rule.priority,
        cooldownMinutes: rule.cooldownMinutes,
      });
    }

    return matched;
  }

  private meetsConditions(conditions: Record<string, unknown>, payload: Record<string, unknown>): boolean {
    if (Object.keys(conditions).length === 0) return true;

    for (const [key, expected] of Object.entries(conditions)) {
      const actual = payload[key];

      if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
        const op = (expected as Record<string, unknown>).operator;
        const value = (expected as Record<string, unknown>).value;

        switch (op) {
          case "gt":
            if (!(Number(actual) > Number(value))) return false;
            break;
          case "gte":
            if (!(Number(actual) >= Number(value))) return false;
            break;
          case "lt":
            if (!(Number(actual) < Number(value))) return false;
            break;
          case "lte":
            if (!(Number(actual) <= Number(value))) return false;
            break;
          case "eq":
            if (actual !== value) return false;
            break;
          case "neq":
            if (actual === value) return false;
            break;
          case "in":
            if (!(Array.isArray(value) && value.includes(actual))) return false;
            break;
          case "contains":
            if (typeof actual !== "string" || !actual.includes(String(value))) return false;
            break;
          default:
            if (actual !== value) return false;
        }
      } else if (actual !== expected) {
        return false;
      }
    }

    return true;
  }

  async executeAction(rule: RuleDefinition, event: TriggerEvent): Promise<void> {
    const actionConfig = rule.actionConfig;

    switch (rule.actionType) {
      case "send-notification": {
        await eventBus.emit("notification.created", {
          businessId: event.businessId,
          type: actionConfig.notificationType as string || "alert",
          title: this.interpolate(actionConfig.titleTemplate as string || "", event.payload),
          message: this.interpolate(actionConfig.messageTemplate as string || "", event.payload),
          channel: actionConfig.channel as string || "in_app",
          userIds: actionConfig.targetUserIds as string[],
          roleSlugs: actionConfig.targetRoleSlugs as string[],
        });
        break;
      }

      case "create-purchase-order": {
        const supplierId = actionConfig.supplierId as string;
        const itemId = event.payload.catalogItemId as string;
        const quantity = Number(actionConfig.quantity || event.payload.quantityToOrder || 0);

        if (supplierId && itemId && quantity > 0) {
          await eventBus.emit("purchase-order.automation-requested", {
            businessId: event.businessId,
            supplierId,
            items: [{ catalogItemId: itemId, quantity }],
            notes: `Auto-generated by automation rule: ${rule.name}`,
            priority: (actionConfig.priority as string) || "normal",
          });
        }
        break;
      }

      case "send-email": {
        const to = actionConfig.to as string;
        if (to) {
          await eventBus.emit("email.automation-requested", {
            businessId: event.businessId,
            to,
            subject: this.interpolate(actionConfig.subjectTemplate as string || "", event.payload),
            body: this.interpolate(actionConfig.bodyTemplate as string || "", event.payload),
            templateId: actionConfig.templateId as string,
          });
        }
        break;
      }

      case "webhook": {
        const url = actionConfig.url as string;
        if (url) {
          await eventBus.emit("webhook.automation-requested", {
            businessId: event.businessId,
            url,
            method: (actionConfig.method as string) || "POST",
            headers: actionConfig.headers as Record<string, string> || {},
            payload: event.payload,
          });
        }
        break;
      }

      case "update-status": {
        const targetType = actionConfig.targetType as string;
        const targetId = event.payload.id as string;
        const newStatus = actionConfig.newStatus as string;

        if (targetType && targetId && newStatus) {
          await eventBus.emit("status.automation-update-requested", {
            businessId: event.businessId,
            targetType,
            targetId,
            newStatus,
            triggeredByRule: rule.name,
          });
        }
        break;
      }

      case "apply-discount":
        await eventBus.emit("discount.automation-apply-requested", {
          businessId: event.businessId,
          discountPercent: actionConfig.discountPercent as number || 0,
          discountAmount: actionConfig.discountAmount as number || 0,
          targetType: actionConfig.targetType as string || "sale",
          targetId: event.payload.id as string,
        });
        break;
    }
  }

  async trigger(event: TriggerEvent): Promise<void> {
    const rules = await this.evaluateTrigger(event);

    for (const rule of rules) {
      await this.executeAction(rule, event);
    }
  }

  private interpolate(template: string, payload: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const value = payload[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }
}

export const automationEngine = new AutomationEngine();
