const FILLER_WORDS = new Set([
  "ndiyo", "ndio", "sawa", "ok", "okay", "oh", "ah", "eh", "eeh",
  "hmm", "mmh", "aah", "ooh", "please", "tafadhali",
  "sasa", "basi", "kwa hiyo", "kwahiyo", "hivyo",
  "naam", "yah", "yeah", "yep", "yes", "no",
  "haya", "hebu", "njoo", "kuja", "njo",
  "hello", "hey", "hi", "habari", "hujambo", "salama", "mambo", "vipi", "jambo",
  "nzuri", "safi", "poa", "fresh", "nzima",
]);

const NOISE_PATTERNS = [
  /^you(tube|r)?\s*/i,
  /^instagram\s*/i,
  /^whatsapp\s*/i,
  /^\d+%\s*/,
  /^loading\s*/i,
  /^subscribe\s*/i,
  /^click\s*/i,
  /^open\s*/i,
  /^close\s*/i,
  /^next\s*/i,
  /^previous\s*/i,
  /^skip\s*/i,
  /^play\s*/i,
  /^pause\s*/i,
  /^stop\s*/i,
  /^unmute\s*/i,
  /^mute\s*/i,
  /^volume/,
  /^like\s*/i,
  /^share\s*/i,
  /^comment\s*/i,
];

const WAKE_WORD_RESIDUE = /\b(firdaus|firdausi|fidaus|dausi|tausi)\b/gi;

export function cleanSpeech(transcript: string): string {
  let cleaned = transcript.trim().toLowerCase();

  for (const pattern of NOISE_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  cleaned = cleaned.replace(WAKE_WORD_RESIDUE, "");

  const words = cleaned.split(/\s+/);
  const filtered = words.filter((w) => !FILLER_WORDS.has(w) && w.length > 0);
  cleaned = filtered.join(" ");

  return cleaned.trim();
}

const SWAHILI_NUMBERS: Record<string, number> = {
  "sifuri": 0, "moja": 1, "mbili": 2, "tatu": 3, "nne": 4,
  "tano": 5, "sita": 6, "saba": 7, "nane": 8, "tisa": 9,
  "kumi": 10, "kumi na moja": 11, "kumi na mbili": 12,
  "kumi na tatu": 13, "kumi na nne": 14, "kumi na tano": 15,
  "kumi na sita": 16, "kumi na saba": 17, "kumi na nane": 18,
  "kumi na tisa": 19, "ishirini": 20, "thelathini": 30,
  "arobaini": 40, "hamsini": 50, "sitini": 60, "sabini": 70,
  "themanini": 80, "tisini": 90, "mia": 100, "elfu": 1000,
  "laki": 100000, "milioni": 1000000,
};

const SWAHILI_NUMBER_KEYS = Object.keys(SWAHILI_NUMBERS);

function parseSwahiliNumber(text: string): number | null {
  const normalized = text.toLowerCase().trim();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return parseFloat(normalized);
  if (SWAHILI_NUMBERS[normalized] !== undefined) return SWAHILI_NUMBERS[normalized];
  return null;
}

export type VoiceIntentType =
  | "SALE"
  | "PURCHASE"
  | "PAYMENT"
  | "RECEIVABLE"
  | "PAYABLE"
  | "REPORT"
  | "INVENTORY"
  | "CUSTOMER"
  | "SUPPLIER"
  | "BRANCH"
  | "UNKNOWN";

export interface VoiceEntities {
  product?: string;
  quantity?: number;
  price?: number;
  customer?: string;
  supplier?: string;
  amount?: number;
  paymentMethod?: string;
  category?: string;
  unit?: string;
  catalogId?: string;
}

export interface VoiceIntentResult {
  transcript: string;
  normalized: string;
  intent: VoiceIntentType;
  confidence: number;
  entities: VoiceEntities;
  nextDialogueState: string;
  erpAction: string | null;
}

const SALE_PATTERNS = [
  /nimeuza/i,
  /nimewauzia/i,
  /nimepauza/i,
  /(?:fanya|record)\s+mauzo/i,
  /(?:i\s+)?(?:sold|sell|sale)/i,
  /nimetoa/i,
];

const PURCHASE_PATTERNS = [
  /nimenunua/i,
  /nimeogopa/i,
  /(?:fanya|record)\s+ununuzi/i,
  /(?:i\s+)?(?:bought|purchased|purchase)/i,
  /(?:stock)\s+(?:mpya|new)/i,
  /nimeleta/i,
];

const PAYMENT_PATTERNS = [
  /nimelipa/i,
  /nimetoa\s+malipo/i,
  /(?:fanya|record)\s+malipo/i,
  /(?:paid|payment)/i,
];

const RECEIVABLE_PATTERNS = [
  /(?:mteja|customer)\s+(?:amenilipa|amenipa|amelipa)/i,
  /nimelipwa/i,
  /(?:receive|received)\s+payment/i,
  /customer\s+paid/i,
];

const PAYABLE_PATTERNS = [
  /(?:msambazaji|supplier)\s+(?:amenilipa|nimelipa)/i,
  /deni/i,
  /deni\s+la\s+msambazaji/i,
  /supplier\s+payment/i,
  /pay\s+supplier/i,
];

const REPORT_PATTERNS = [
  /ripoti/i,
  /taarifa/i,
  /report/i,
  /(?:show|ona|angalia)\s+(?:mauzo|sales|faida|profit)/i,
];

const INVENTORY_PATTERNS = [
  /stock/i,
  /hesabu/i,
  /bidhaa/i,
  /inventory/i,
  /(?:angalia|check)\s+(?:stock|hesabu)/i,
  /(?:zimebaki|imebaki|inabaki)/i,
];

const CUSTOMER_PATTERNS = [
  /mteja/i,
  /customer/i,
  /tafuta\s+mteja/i,
  /(?:find|look\s+up)\s+(?:customer|client|mteja)/i,
];

const SUPPLIER_PATTERNS = [
  /msambazaji/i,
  /supplier/i,
  /(?:find|look\s+up)\s+(?:supplier|msambazaji)/i,
];

const BRANCH_PATTERNS = [
  /tawi/i,
  /branch/i,
  /(?:ongeza|add)\s+(?:tawi|branch)/i,
];

function classifyVoiceIntent(transcript: string): { intent: VoiceIntentType; confidence: number } {
  if (SALE_PATTERNS.some((p) => p.test(transcript))) return { intent: "SALE", confidence: 0.9 };
  if (PURCHASE_PATTERNS.some((p) => p.test(transcript))) return { intent: "PURCHASE", confidence: 0.9 };
  if (RECEIVABLE_PATTERNS.some((p) => p.test(transcript))) return { intent: "RECEIVABLE", confidence: 0.85 };
  if (PAYABLE_PATTERNS.some((p) => p.test(transcript))) return { intent: "PAYABLE", confidence: 0.85 };
  if (PAYMENT_PATTERNS.some((p) => p.test(transcript))) return { intent: "PAYMENT", confidence: 0.85 };
  if (CUSTOMER_PATTERNS.some((p) => p.test(transcript))) return { intent: "CUSTOMER", confidence: 0.85 };
  if (SUPPLIER_PATTERNS.some((p) => p.test(transcript))) return { intent: "SUPPLIER", confidence: 0.85 };
  if (INVENTORY_PATTERNS.some((p) => p.test(transcript))) return { intent: "INVENTORY", confidence: 0.85 };
  if (BRANCH_PATTERNS.some((p) => p.test(transcript))) return { intent: "BRANCH", confidence: 0.85 };
  if (REPORT_PATTERNS.some((p) => p.test(transcript))) return { intent: "REPORT", confidence: 0.85 };
  return { intent: "UNKNOWN", confidence: 0.2 };
}

const UNITS = [
  "kg", "g", "l", "ml", "pcs", "unit", "units",
  "pakiti", "carton", "bottle", "kilo", "sahe", "ndoo",
  "mfra", "bundle", "mifuko", "vipande", "vikapu", "makopo",
  "kopo", "packet", "pack", "box", "crate", "dozen",
];

const UNIT_PATTERN = new RegExp(`\\b(${UNITS.join("|")})\\b`, "i");

const QUANTITY_PATTERNS = [
  new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${UNITS.join("|")})`, "i"),
  /(\d+(?:\.\d+)?)/,
];

const PRICE_PATTERNS = [
  /(?:shilingi|tsh|tzs|sh)\s*(\d+(?:[.,]\d+)?)/i,
  /(?:bei|price)\s*(?:ya|of|ni|is)?\s*(?:tsh|tzs|sh)?\s*(\d+(?:[.,]\d+)?)/i,
  new RegExp("(\\d{3,}(?:[.,]\\d+)?)\\s*(?:shilingi|tsh|tzs)", "i"),
];

const CUSTOMER_NAME_PATTERNS = [
  /(?:mteja|customer)\s+(?:ni|aitwa|anaitwa|jina lake)?\s*(.+)/i,
  /(?:kwa|kutoka kwa|from)\s+(.+)/i,
];

const SUPPLIER_NAME_PATTERNS = [
  /(?:msambazaji|supplier)\s+(?:ni|aitwa)?\s*(.+)/i,
  /(?:kutoka|kwa)\s+(?:msambazaji|supplier)\s+(.+)/i,
];

function extractVoiceEntities(transcript: string, intent: VoiceIntentType): VoiceEntities {
  const entities: VoiceEntities = {};
  const cleaned = cleanSpeech(transcript);

  if (!cleaned) return entities;

  for (const qp of QUANTITY_PATTERNS) {
    const match = cleaned.match(qp);
    if (match) {
      const parsed = parseSwahiliNumber(match[1]!);
      if (parsed !== null) {
        entities.quantity = parsed;
        const unitMatch = cleaned.match(UNIT_PATTERN);
        if (unitMatch) entities.unit = unitMatch[1]!;
        break;
      }
    }
  }

  if (!entities.quantity) {
    for (const [word, num] of Object.entries(SWAHILI_NUMBERS)) {
      const re = new RegExp(`\\b${word}\\b`, "i");
      if (re.test(cleaned)) {
        entities.quantity = num;
        const unitMatch = cleaned.match(new RegExp(`${word}\\s+(${UNITS.join("|")})`, "i"));
        if (unitMatch) entities.unit = unitMatch[1]!;
        break;
      }
    }
  }

  for (const pp of PRICE_PATTERNS) {
    const match = cleaned.match(pp);
    if (match) {
      entities.price = parseFloat(match[1]!.replace(/[.,]/g, ""));
      break;
    }
  }

  if (intent === "SALE" || intent === "PURCHASE" || intent === "INVENTORY") {
    let productText = cleaned
      .replace(/nimeuza|nimewauzia|nimepauza|nimenunua|nimetumia|stock|hesabu|bidhaa|nimelipa|nimepokea|tafuta|ongeza|angalia|nimetoa|nimeleta/gi, " ")
      .replace(new RegExp(`\\d+(?:\\.\\d+)?\\s*(?:${UNITS.join("|")})`, "gi"), " ")
      .replace(/(?:shilingi|tsh|tzs|sh)\s*\d+(?:[.,]\d+)?/gi, " ")
      .replace(/(?:mteja|customer)\s+.+/gi, " ")
      .replace(/(?:msambazaji|supplier)\s+.+/gi, " ")
      .replace(new RegExp(`\\b(?:${UNITS.join("|")})\\b`, "gi"), " ")
      .replace(/\b\d+\b/g, " ")
      .replace(/kwa|na|ya|za|wa|la|cha|vya|kutoka|kwa|kwenye|katika|kama|au/gi, " ")
      .trim();

    for (const word of SWAHILI_NUMBER_KEYS) {
      const re = new RegExp(`\\b${word}\\b`, "gi");
      productText = productText.replace(re, " ");
    }

    productText = productText.replace(/\s+/g, " ").trim();
    const productWords = productText.split(/\s+/).filter((w) => w.length > 1);
    if (productWords.length > 0) {
      entities.product = productWords.join(" ").trim();
    }
  }

  for (const cp of CUSTOMER_NAME_PATTERNS) {
    const match = cleaned.match(cp);
    if (match && match[1]?.trim()) {
      entities.customer = match[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  for (const sp of SUPPLIER_NAME_PATTERNS) {
    const match = cleaned.match(sp);
    if (match && match[1]?.trim()) {
      entities.supplier = match[1].trim().replace(/\s+/g, " ");
      break;
    }
  }

  return entities;
}

function getNextDialogueState(intent: VoiceIntentType, entities: VoiceEntities): string {
  switch (intent) {
    case "SALE":
      if (!entities.product) return "ASK_PRODUCT";
      if (!entities.quantity) return "ASK_QUANTITY";
      if (!entities.price) return "ASK_PRICE";
      return "ASK_CONFIRMATION";
    case "PURCHASE":
      if (!entities.product) return "ASK_PRODUCT";
      if (!entities.quantity) return "ASK_QUANTITY";
      if (!entities.price) return "ASK_COST";
      return "ASK_CONFIRMATION";
    case "RECEIVABLE":
      if (!entities.customer) return "ASK_CUSTOMER";
      if (!entities.amount) return "ASK_AMOUNT";
      return "ASK_CONFIRMATION";
    case "PAYABLE":
      if (!entities.supplier) return "ASK_SUPPLIER";
      if (!entities.amount) return "ASK_AMOUNT";
      return "ASK_CONFIRMATION";
    case "PAYMENT":
      if (!entities.amount) return "ASK_AMOUNT";
      return "ASK_CONFIRMATION";
    case "CUSTOMER":
      return "SHOW_CUSTOMER";
    case "SUPPLIER":
      return "SHOW_SUPPLIER";
    case "INVENTORY":
      if (!entities.product) return "ASK_PRODUCT";
      return "SHOW_STOCK";
    case "REPORT":
      return "SHOW_REPORT";
    case "BRANCH":
      return "SHOW_BRANCH";
    default:
      return "CLARIFY";
  }
}

function getErpAction(intent: VoiceIntentType): string | null {
  switch (intent) {
    case "SALE": return "createSale()";
    case "PURCHASE": return "createPurchase()";
    case "RECEIVABLE": return "receivePayment()";
    case "PAYABLE": return "paySupplier()";
    case "PAYMENT": return "recordExpense()";
    case "INVENTORY": return "checkStock()";
    case "CUSTOMER": return "findCustomer()";
    case "SUPPLIER": return "findSupplier()";
    case "REPORT": return "generateReport()";
    default: return null;
  }
}

export function analyzeVoiceIntent(transcript: string): VoiceIntentResult {
  const cleaned = cleanSpeech(transcript);
  const { intent, confidence } = classifyVoiceIntent(cleaned);
  const entities = extractVoiceEntities(cleaned, intent);
  const nextDialogueState = getNextDialogueState(intent, entities);
  const erpAction = getErpAction(intent);

  return {
    transcript,
    normalized: cleaned,
    intent,
    confidence,
    entities,
    nextDialogueState,
    erpAction,
  };
}

export function formatPipelineLog(result: VoiceIntentResult): string {
  const lines = [
    "━━━ Firdaus Voice Pipeline ━━━",
    `Transcript:       "${result.transcript}"`,
    result.transcript !== result.normalized ? `Normalized:       "${result.normalized}"` : null,
    `Intent:           ${result.intent}`,
    `Confidence:       ${(result.confidence * 100).toFixed(0)}%`,
    `Entities:         ${JSON.stringify(result.entities)}`,
    `Next State:       ${result.nextDialogueState}`,
    result.erpAction ? `ERP Action:       ${result.erpAction}` : null,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ].filter(Boolean);

  return lines.join("\n");
}

export function shouldAutoWake(result: VoiceIntentResult): boolean {
  if (result.intent === "GREETING" || result.intent === "SMALL_TALK") return false;
  if (result.confidence >= 0.85 && result.intent !== "UNKNOWN") return true;
  return false;
}

export function isBusinessIntent(intent: VoiceIntentType): boolean {
  return intent !== "UNKNOWN" && intent !== "CUSTOMER" && intent !== "SUPPLIER" && intent !== "BRANCH";
}
