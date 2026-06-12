import type { CommandDefinition, IntentMatchResult, IntentType, ParsedCommand } from "./types";

const commands: CommandDefinition[] = [
  {
    trigger: "/sell",
    intent: "sell",
    description: "Record a sale: /sell <quantity> <unit> <item>",
    descriptionSwahili: "Rekodi mauzo: /sell <idadi> <kipimo> <bidhaa>",
    paramPatterns: [
      { name: "quantity", pattern: /(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)/i, required: true },
      { name: "item", pattern: /(?:kg|g|l|ml|pcs|units?)\s+(.+)/i, required: true },
    ],
    requiredPermission: "sales.create",
  },
  {
    trigger: "/stock",
    intent: "check-stock",
    description: "Check stock: /stock <item>",
    descriptionSwahili: "Angalia stock: /stock <bidhaa>",
    paramPatterns: [
      { name: "item", pattern: /(?:of\s+)?(.+)/i, required: true },
    ],
    requiredPermission: "inventory.view",
  },
  {
    trigger: "/price",
    intent: "check-price",
    description: "Check price: /price <item>",
    descriptionSwahili: "Angalia bei: /price <bidhaa>",
    paramPatterns: [
      { name: "item", pattern: /(?:of\s+)?(.+)/i, required: true },
    ],
    requiredPermission: "inventory.view",
  },
  {
    trigger: "/customer",
    intent: "lookup-customer",
    description: "Lookup customer: /customer <phone>",
    descriptionSwahili: "Tafuta mteja: /customer <namba>",
    paramPatterns: [
      { name: "phone", pattern: /(.+)/i, required: true },
    ],
    requiredPermission: "customers.view",
  },
  {
    trigger: "/add-customer",
    intent: "add-customer",
    description: "Add customer: /add-customer <name> <phone>",
    descriptionSwahili: "Ongeza mteja: /add-customer <jina> <namba>",
    paramPatterns: [
      { name: "name", pattern: /(.+?)\s+(\+?\d+)/i, required: false },
      { name: "phone", pattern: /(\+?\d+)/i, required: true },
    ],
    requiredPermission: "customers.create",
  },
  {
    trigger: "/supplier",
    intent: "lookup-supplier",
    description: "Lookup supplier: /supplier <name>",
    descriptionSwahili: "Tafuta msambazaji: /supplier <jina>",
    paramPatterns: [
      { name: "name", pattern: /(.+)/i, required: true },
    ],
  },
  {
    trigger: "/add-supplier",
    intent: "add-supplier",
    description: "Add supplier: /add-supplier <name> <phone>",
    descriptionSwahili: "Ongeza msambazaji: /add-supplier <jina> <namba>",
    paramPatterns: [
      { name: "name", pattern: /(.+?)\s+(\+?\d+)/i, required: false },
      { name: "phone", pattern: /(\+?\d+)/i, required: true },
    ],
    requiredPermission: "purchases.create",
  },
  {
    trigger: "/staff",
    intent: "check-staff",
    description: "Check staff: /staff <name>",
    descriptionSwahili: "Angalia mfanyakazi: /staff <jina>",
    paramPatterns: [
      { name: "name", pattern: /(.+)/i, required: false },
    ],
  },
  {
    trigger: "/orders",
    intent: "view-orders",
    description: "View recent orders",
    descriptionSwahili: "Angalia mauzo ya hivi karibuni",
    paramPatterns: [],
    requiredPermission: "sales.view",
  },
  {
    trigger: "/order",
    intent: "create-order",
    description: "Create order: /order <item> <quantity>",
    descriptionSwahili: "Unda agizo: /order <bidhaa> <idadi>",
    paramPatterns: [
      { name: "item", pattern: /(.+?)\s+(\d+(?:\.\d+)?)/i, required: true },
      { name: "quantity", pattern: /(\d+(?:\.\d+)?)/i, required: true },
    ],
    requiredPermission: "purchases.create",
  },
  {
    trigger: "/expense",
    intent: "add-expense",
    description: "Record expense: /expense <amount> <category>",
    descriptionSwahili: "Rekodi gharama: /expense <kiasi> <aina>",
    paramPatterns: [
      { name: "amount", pattern: /(\d+(?:\.\d+)?)/i, required: true },
      { name: "description", pattern: /\d+(?:\.\d+)?\s+(.+)/i, required: false },
    ],
    requiredPermission: "expenses.create",
  },
  {
    trigger: "/purchase",
    intent: "add-purchase",
    description: "Record purchase: /purchase <item> <quantity> <cost>",
    descriptionSwahili: "Rekodi ununuzi: /purchase <bidhaa> <idadi> <gharama>",
    paramPatterns: [
      { name: "item", pattern: /(.+?)\s+(\d+)\s+(\d+)/i, required: true },
      { name: "quantity", pattern: /(\d+)\s+(\d+)/i, required: true },
      { name: "cost", pattern: /(\d+)$/i, required: true },
    ],
    requiredPermission: "purchases.create",
  },
  {
    trigger: "/transfer",
    intent: "transfer-stock",
    description: "Transfer stock: /transfer <item> <qty> <from> <to>",
    descriptionSwahili: "Hamisha stock: /transfer <bidhaa> <idadi> <kutoka> <kwenda>",
    paramPatterns: [
      { name: "item", pattern: /(.+?)\s+(\d+)/i, required: true },
      { name: "quantity", pattern: /(\d+)/i, required: true },
    ],
    requiredPermission: "inventory.transfer",
  },
  {
    trigger: "/insights",
    intent: "business-insights",
    description: "Get business insights and intelligence",
    descriptionSwahili: "Pata maarifa ya biashara",
    paramPatterns: [],
  },
  {
    trigger: "/wallet",
    intent: "check-wallet",
    description: "Check subscription wallet",
    descriptionSwahili: "Angalia pochi ya usajili",
    paramPatterns: [],
  },
  {
    trigger: "/report",
    intent: "view-report",
    description: "View report: /report <type>",
    descriptionSwahili: "Angalia ripoti: /report <aina>",
    paramPatterns: [
      { name: "type", pattern: /(sales|stock|staff|customers|profit|mauzo|stock|gharama|faida)/i, required: true },
    ],
  },
  {
    trigger: "/help",
    intent: "help",
    description: "Show available commands",
    descriptionSwahili: "Onyesha amri zinazopatikana",
    paramPatterns: [],
  },
];

const naturalLanguagePatterns: Array<{
  pattern: RegExp;
  intent: IntentType;
  extractParams: (match: RegExpMatchArray) => Record<string, string | number | undefined>;
}> = [
  // Swahili: Mauzo
  {
    pattern: /(?:nimeuza|nimewauzia|nimepauza)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?|pakiti|carton|bottle)?\s+(?:ya\s+|za\s+)?(.+)/i,
    intent: "sell",
    extractParams: (m) => ({ quantity: parseFloat(m[1]!), unit: m?.[2], item: m?.[3]?.trim() }),
  },
  {
    pattern: /(?:uza|fanya mauzo ya|record sale of)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)?\s+(?:of\s+|ya\s+)?(.+)/i,
    intent: "sell",
    extractParams: (m) => ({ quantity: parseFloat(m[1]!), unit: m?.[2], item: m?.[3]?.trim() }),
  },
  {
    pattern: /(?:sell|record)\s+(?:a\s+)?(?:sale\s+of\s+)?(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)\s+(?:of\s+)?(.+)/i,
    intent: "sell",
    extractParams: (m) => ({ quantity: parseFloat(m[1]!), unit: m[2], item: m[3]?.trim() }),
  },

  // Swahili: Stock
  {
    pattern: /(?:stock|hesabu|bidhaa)\s+(?:ya\s+)?(.+?)\s+(?:zimebaki|imebaki|inabaki)/i,
    intent: "check-stock",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },
  {
    pattern: /(?:angalia|check)\s+(?:stock|hesabu)\s+(?:ya\s+|for\s+)?(.+)/i,
    intent: "check-stock",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },
  {
    pattern: /(?:check|what'?s?|how much)\s+(?:stock|inventory|the stock)\s+(?:of\s+|for\s+)?(.+)/i,
    intent: "check-stock",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },

  // Swahili: Bei
  {
    pattern: /(?:bei|gharama|price)\s+(?:ya\s+)?(.+)/i,
    intent: "check-price",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },
  {
    pattern: /(?:check|what'?s?|how much)\s+(?:price|the price)\s+(?:of\s+|for\s+)?(.+)/i,
    intent: "check-price",
    extractParams: (m) => ({ item: m[1]?.trim() }),
  },

  // Swahili: Wateja
  {
    pattern: /(?:tafuta|find|lookup|search)\s+(?:mteja\s+)?(.+)/i,
    intent: "lookup-customer",
    extractParams: (m) => ({ query: m[1]?.trim() }),
  },
  {
    pattern: /(?:ongeza|add|register)\s+(?:mteja|customer)\s+(.+?)\s+(\+?\d+)/i,
    intent: "add-customer",
    extractParams: (m) => ({ name: m[1]?.trim(), phone: m[2] }),
  },

  // Swahili: Gharama
  {
    pattern: /(?:nimetumia|nimegharamia|nimelipa|expense)\s+(?:gharama\s+)?(?:ya\s+)?(\d+(?:\.\d+)?)\s*(?:kwa\s+|ya\s+)?(.+)/i,
    intent: "add-expense",
    extractParams: (m) => ({ amount: parseFloat(m[1]!), description: m?.[2]?.trim() }),
  },
  {
    pattern: /(?:gharama|expense|matumizi)\s+(?:ya\s+)?(\d+(?:\.\d+)?)\s*(?:kwa\s+|ya\s+)?(.+)/i,
    intent: "add-expense",
    extractParams: (m) => ({ amount: parseFloat(m[1]!), description: m?.[2]?.trim() }),
  },

  // Swahili: Ununuzi
  {
    pattern: /(?:nimenunua|nimeagiza|purchase|nimeleta)\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)?\s+(?:ya\s+|za\s+)?(.+?)\s+(?:kwa\s+|bei\s+ya\s+)?(\d+)/i,
    intent: "add-purchase",
    extractParams: (m) => ({ quantity: parseFloat(m[1]!), unit: m?.[2], item: m?.[3]?.trim(), cost: parseFloat(m[4]!) }),
  },

  // Swahili: Wasambazaji
  {
    pattern: /(?:tafuta|find|lookup)\s+(?:msambazaji|supplier)\s+(.+)/i,
    intent: "lookup-supplier",
    extractParams: (m) => ({ query: m[1]?.trim() }),
  },
  {
    pattern: /(?:ongeza|add)\s+(?:msambazaji|supplier)\s+(.+?)\s+(\+?\d+)/i,
    intent: "add-supplier",
    extractParams: (m) => ({ name: m[1]?.trim(), phone: m[2] }),
  },

  // Ripoti
  {
    pattern: /(?:ripoti|report|taarifa)\s+(?:ya\s+)?(?:mauzo|sales)/i,
    intent: "view-report",
    extractParams: () => ({ type: "sales" }),
  },
  {
    pattern: /(?:ripoti|report|taarifa)\s+(?:ya\s+)?(?:stock|hesabu)/i,
    intent: "view-report",
    extractParams: () => ({ type: "stock" }),
  },
  {
    pattern: /(?:ripoti|report|taarifa)\s+(?:ya\s+)?(?:faida|profit)/i,
    intent: "view-report",
    extractParams: () => ({ type: "profit" }),
  },
  {
    pattern: /(?:ripoti|report|taarifa)\s+(?:ya\s+)?(?:gharama|expense)/i,
    intent: "view-report",
    extractParams: () => ({ type: "expenses" }),
  },
  {
    pattern: /(?:create|make|add)\s+(?:a\s+)?(?:sale|order)\s+(?:for\s+|of\s+)?(.+)/i,
    intent: "create-sale",
    extractParams: (m) => ({ description: m[1]?.trim() }),
  },

  // Hamisha stock
  {
    pattern: /(?:hamisha|transfer)\s+(?:stock\s+)?(?:ya\s+)?(.+?)\s+(\d+)\s+(?:kutoka|from)\s+(.+?)\s+(?:kwenda|to)\s+(.+)/i,
    intent: "transfer-stock",
    extractParams: (m) => ({ item: m[1]?.trim(), quantity: parseFloat(m[2]!), from: m[3]?.trim(), to: m[4]?.trim() }),
  },

  // Maarifa ya biashara
  {
    pattern: /(?:maarifa|insights|intelligence|uelewa)\s+(?:ya\s+)?(?:biashara|business)/i,
    intent: "business-insights",
    extractParams: () => ({}),
  },
  {
    pattern: /(?:biashara|business)\s+(?:inaendelea|ikoje|status)/i,
    intent: "business-insights",
    extractParams: () => ({}),
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

export function getHelpText(lang: "sw" | "en" = "sw"): string {
  if (lang === "sw") {
    return commands
      .map((cmd) => `${cmd.trigger} - ${cmd.descriptionSwahili || cmd.description}`)
      .join("\n");
  }
  return commands
    .map((cmd) => `${cmd.trigger} - ${cmd.description}`)
    .join("\n");
}

export { commands };
