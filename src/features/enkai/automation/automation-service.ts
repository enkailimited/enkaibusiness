import "server-only";

export interface AutomationRule {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  condition: AutomationCondition;
  action: AutomationAction;
  isActive: boolean;
  businessId: string;
}

export type AutomationTrigger =
  | { type: "stock-below"; itemId: string; threshold: number }
  | { type: "sale-completed"; minAmount?: number }
  | { type: "time-based"; schedule: string }
  | { type: "customer-created" };

export interface AutomationCondition {
  field: string;
  operator: "equals" | "greater-than" | "less-than" | "contains";
  value: unknown;
}

export interface AutomationAction {
  type: "notify" | "create-order" | "send-report" | "update-record";
  params: Record<string, unknown>;
}

export interface AutomationResult {
  triggered: boolean;
  ruleId: string;
  ruleName: string;
  actionTaken: string;
  timestamp: Date;
}

const defaultRules: AutomationRule[] = [
  {
    id: "low-stock-alert",
    name: "Low Stock Alert",
    trigger: { type: "stock-below", itemId: "*", threshold: 10 },
    condition: { field: "quantityOnHand", operator: "less-than", value: 10 },
    action: { type: "notify", params: { channel: "in-app", message: "Low stock alert" } },
    isActive: true,
    businessId: "*",
  },
  {
    id: "daily-sales-report",
    name: "Daily Sales Report",
    trigger: { type: "time-based", schedule: "0 18 * * *" },
    condition: { field: "salesCount", operator: "greater-than", value: 0 },
    action: { type: "send-report", params: { type: "sales", period: "daily" } },
    isActive: true,
    businessId: "*",
  },
];

export async function evaluateRules(
  businessId: string,
  event: AutomationTrigger,
): Promise<AutomationResult[]> {
  const results: AutomationResult[] = [];

  const applicableRules = defaultRules.filter(
    (rule) => rule.isActive && (rule.businessId === "*" || rule.businessId === businessId),
  );

  for (const rule of applicableRules) {
    if (rule.trigger.type === event.type) {
      const triggered = checkCondition(rule.condition, event);
      if (triggered) {
        results.push({
          triggered: true,
          ruleId: rule.id,
          ruleName: rule.name,
          actionTaken: executeAction(rule.action),
          timestamp: new Date(),
        });
      }
    }
  }

  return results;
}

function checkCondition(condition: AutomationCondition, _event: AutomationTrigger): boolean {
  switch (condition.operator) {
    case "equals":
      return condition.value === condition.field;
    case "greater-than":
      return true;
    case "less-than":
      return true;
    case "contains":
      return true;
    default:
      return false;
  }
}

function executeAction(action: AutomationAction): string {
  switch (action.type) {
    case "notify":
      return `Notification sent via ${action.params.channel || "in-app"}: ${action.params.message || ""}`;
    case "create-order":
      return "Auto-order created for low stock items";
    case "send-report":
      return `${action.params.type} report sent (${action.params.period})`;
    case "update-record":
      return "Record updated automatically";
    default:
      return "No action taken";
  }
}

export function getBusinessRules(businessId: string): AutomationRule[] {
  return defaultRules.filter(
    (rule) => rule.businessId === "*" || rule.businessId === businessId,
  );
}
