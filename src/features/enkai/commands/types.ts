export type IntentType =
  | "sell"
  | "check-stock"
  | "create-sale"
  | "check-price"
  | "lookup-customer"
  | "add-customer"
  | "check-staff"
  | "view-orders"
  | "create-order"
  | "view-report"
  | "help"
  | "add-expense"
  | "add-purchase"
  | "lookup-supplier"
  | "add-supplier"
  | "transfer-stock"
  | "adjust-stock"
  | "check-wallet"
  | "create-purchase-order"
  | "create-quotation"
  | "create-invoice"
  | "create-return"
  | "send-notification"
  | "setup-business"
  | "business-insights"
  | "unknown";

export interface ParsedCommand {
  raw: string;
  intent: IntentType;
  confidence: number;
  params: Record<string, string | number | undefined>;
  missingFields?: string[];
}

export interface CommandDefinition {
  trigger: string;
  intent: IntentType;
  description: string;
  descriptionSwahili?: string;
  paramPatterns: Array<{
    name: string;
    pattern: RegExp;
    required: boolean;
  }>;
  requiredPermission?: string;
}

export interface IntentMatchResult {
  intent: IntentType;
  confidence: number;
  params: Record<string, string | number | undefined>;
}
