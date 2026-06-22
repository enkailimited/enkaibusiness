import "server-only";

import { prisma } from "@/server/db";
import { reorderEngine } from "../inventory/reorder-engine";
import { firdausEventBus, type FirdausEvent } from "../events/event-bus";

export interface AutomationRule {
  id: string;
  businessId: string;
  trigger: string;
  action: string;
  condition: Record<string, unknown>;
  config: Record<string, unknown>;
  isActive: boolean;
  requiresApproval: boolean;
}

export class WorkflowAutomation {
  async getActiveRules(businessId: string): Promise<AutomationRule[]> {
    const rules = await prisma.firdausWorkflow.findMany({
      where: {
        businessId,
        type: "automation_rule",
        status: "COMPLETED",
      },
      orderBy: { updatedAt: "desc" },
    });

    return rules.map((r) => ({
      id: r.id,
      businessId: r.businessId,
      trigger: String(r.context?.trigger || ""),
      action: String(r.context?.action || ""),
      condition: (r.collectedData || {}) as Record<string, unknown>,
      config: (r.context || {}) as Record<string, unknown>,
      isActive: r.status === "COMPLETED",
      requiresApproval: r.context?.requiresApproval === true,
    }));
  }

  async executeAutoReorder(businessId: string, userId: string): Promise<{ created: number; message: string }> {
    const recommendations = await reorderEngine.getReorderRecommendations(businessId);
    const urgent = recommendations.filter((r) => r.priority === "immediate" || r.priority === "today");

    if (urgent.length === 0) {
      return { created: 0, message: "Hakuna bidhaa zinazohitaji kuagizwa kwa sasa." };
    }

    let created = 0;
    for (const rec of urgent.slice(0, 5)) {
      try {
        await prisma.purchaseOrder.create({
          data: {
            businessId,
            createdById: userId,
            status: "draft",
            notes: `Auto-generated na Firdaus: ${rec.productName} (${rec.suggestedQuantity} units)`,
            items: {
              create: {
                catalogItemId: rec.productId,
                quantity: rec.suggestedQuantity,
                unitCost: rec.averageDailySales > 0 ? rec.averageDailySales : 0,
              },
            },
          },
        });
        created++;
      } catch {}
    }

    return {
      created,
      message: `Firdaus ameunda purchase order ${created} za bidhaa zinazoisha.`
        + (urgent.length > 5 ? ` Zipo ${urgent.length - 5} zaidi zinazohitaji kuagizwa.` : ""),
    };
  }

  async scheduleReminder(businessId: string, userId: string, customerId: string, message: string): Promise<void> {
    await prisma.notification.create({
      data: {
        businessId,
        userId,
        type: "reminder",
        title: "Dokezo la Malipo",
        message: message.slice(0, 500),
        link: `/workspaces/businesses/${businessId}/customers/${customerId}`,
      },
    });
  }

  async autoNotifyLowStock(businessId: string, userId: string): Promise<void> {
    const recommendations = await reorderEngine.getReorderRecommendations(businessId);
    const urgent = recommendations.filter((r) => r.priority === "immediate");

    if (urgent.length > 0) {
      const names = urgent.map((r) => r.productName).slice(0, 5).join(", ");
      await prisma.notification.create({
        data: {
          businessId,
          userId,
          type: "warning",
          title: "Bidhaa Zinahitaji Kuagizwa Haraka",
          message: `Bidhaa hizi zinaisha stoo: ${names}.`,
          link: `/workspaces/businesses/${businessId}/inventory`,
        },
      });
    }
  }
}

export const workflowAutomation = new WorkflowAutomation();

// Register automation event handlers
export function registerAutomationHandlers(): void {
  firdausEventBus.on("SaleCreated", async (event: FirdausEvent) => {
    try {
      await workflowAutomation.autoNotifyLowStock(event.businessId, event.userId);
    } catch {}
  });

  firdausEventBus.on("InventoryAdjusted", async (event: FirdausEvent) => {
    try {
      const level = Number(event.data.stockLevel || 0);
      const reorder = Number(event.data.reorderPoint || 0);
      if (reorder > 0 && level <= reorder) {
        await workflowAutomation.autoNotifyLowStock(event.businessId, event.userId);
      }
    } catch {}
  });
}
