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
  | "unknown";

export interface ParsedCommand {
  raw: string;
  intent: IntentType;
  confidence: number;
  params: Record<string, string | number | undefined>;
}

export interface CommandDefinition {
  trigger: string;
  intent: IntentType;
  description: string;
  paramPatterns: Array<{
    name: string;
    pattern: RegExp;
    required: boolean;
  }>;
}

export interface IntentMatchResult {
  intent: IntentType;
  confidence: number;
  params: Record<string, string | number | undefined>;
}
