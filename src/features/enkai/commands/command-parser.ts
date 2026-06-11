import type { CommandDefinition, IntentMatchResult, IntentType, ParsedCommand } from "./types";

const commands: CommandDefinition[] = [
  {
    trigger: "/sell",
    intent: "sell",
    description: "Record a sale: /sell <quantity> <unit> <item>",
    paramPatterns: [
      { name: "quantity", pattern: /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)/i, required: true },
      { name: "item", pattern: /(?:kg|g|l|ml|pcs|units?)\s+(.+)/i, required: true },
    ],
  },
  {
    trigger: "/stock",
    intent: "check-stock",
    description: "Check stock: /stock <item>",
    paramPatterns: [
      { name: "item", pattern: /(?:of\s+)?(.+)/i, required: true },
    ],
  },
  {
    trigger: "/price",
    intent: "check-price",
    description: "Check price: /price <item>",
    paramPatterns: [
      { name: "item", pattern: /(?:of\s+)?(.+)/i, required: true },
    ],
  },
  {
    trigger: "/customer",
    intent: "lookup-customer",
    description: "Lookup customer: /customer <phone>",
    paramPatterns: [
      { name: "phone", pattern: /(.+)/i, required: true },
    ],
  },
  {
    trigger: "/add-customer",
    intent: "add-customer",
    description: "Add customer: /add-customer <name> <phone>",
    paramPatterns: [
      { name: "name", pattern: /(.+?)\s+(\+?\d+)/i, required: false },
      { name: "phone", pattern: /(\+?\d+)/i, required: true },
    ],
  },
  {
    trigger: "/staff",
    intent: "check-staff",
    description: "Check staff: /staff <name>",
    paramPatterns: [
      { name: "name", pattern: /(.+)/i, required: false },
    ],
  },
  {
    trigger: "/orders",
    intent: "view-orders",
    description: "View recent orders",
    paramPatterns: [],
  },
  {
    trigger: "/order",
    intent: "create-order",
    description: "Create order: /order <item> <quantity>",
    paramPatterns: [
      { name: "item", pattern: /(.+?)\s+(\d+(?:\.\d+)?)/i, required: true },
      { name: "quantity", pattern: /(\d+(?:\.\d+)?)/i, required: true },
    ],
  },
  {
    trigger: "/report",
    intent: "view-report",
    description: "View report: /report <type>",
    paramPatterns: [
      { name: "type", pattern: /(sales|stock|staff|customers)/i, required: true },
    ],
  },
  {
    trigger: "/help",
    intent: "help",
    description: "Show available commands",
    paramPatterns: [],
  },
];

const naturalLanguagePatterns: Array<{
  pattern: RegExp;
  intent: IntentType;
  extractParams: (match: RegExpMatchArray) => Record<string, string | number | undefined>;
}> = [
  {
    pattern: /(?:sell|record)\s+(?:a\s+)?(?:sale\s+of\s+)?(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)\s+(?:of\s+)?(.+)/i,
    intent: "sell",
    extractParams: (m) => ({ quantity: parseFloat(m[1]!), unit: m[2], item: m[3]?.trim() }),
  },
  {
    pattern: /(?:check|what'?s?|how much)\s+(?:stock|inventory|the stock)\s+(?:of\s+|for\s+)?(.+)/i,
    intent: "check-stock",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },
  {
    pattern: /(?:check|what'?s?|how much)\s+(?:price|the price)\s+(?:of\s+|for\s+)?(.+)/i,
    intent: "check-price",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },
  {
    pattern: /(?:find|lookup|search)\s+(?:customer\s+)?(.+)/i,
    intent: "lookup-customer",
    extractParams: (m) => ({ query: m[1]?.trim() }),
  },
  {
    pattern: /(?:create|make|add)\s+(?:a\s+)?(?:sale|order)\s+(?:for\s+|of\s+)?(.+)/i,
    intent: "create-sale",
    extractParams: (m) => ({ description: m[1]?.trim() }),
  },
];

function extractParamsFromText(text: string, command: CommandDefinition): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {};
  const body = text.slice(command.trigger.length).trim();

  for (const param of command.paramPatterns) {
    const match = body.match(param.pattern);
    if (match) {
      const value = match[1]?.trim();
      params[param.name] = isNaN(Number(value)) ? value : parseFloat(value!);
    }
  }

  return params;
}

function matchNaturalLanguage(text: string): IntentMatchResult | null {
  for (const nl of naturalLanguagePatterns) {
    const match = text.match(nl.pattern);
    if (match) {
      return {
        intent: nl.intent,
        confidence: 0.7,
        params: nl.extractParams(match),
      };
    }
  }
  return null;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();

  const matchedCommand = commands.find((cmd) =>
    trimmed.toLowerCase().startsWith(cmd.trigger.toLowerCase()),
  );

  if (matchedCommand) {
    const params = extractParamsFromText(trimmed, matchedCommand);
    return {
      raw: trimmed,
      intent: matchedCommand.intent,
      confidence: 1.0,
      params,
    };
  }

  const nlMatch = matchNaturalLanguage(trimmed);
  if (nlMatch) {
    return {
      raw: trimmed,
      ...nlMatch,
    };
  }

  return {
    raw: trimmed,
    intent: "unknown",
    confidence: 0,
    params: {},
  };
}

export function getHelpText(): string {
  return commands
    .map((cmd) => `${cmd.trigger} - ${cmd.description}`)
    .join("\n");
}

export { commands };
