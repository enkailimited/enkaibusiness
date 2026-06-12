export type ExpenseCategory =
  | "operating"
  | "procurement_cost"
  | "utility"
  | "transport"
  | "salary"
  | "rent"
  | "marketing"
  | "maintenance"
  | "other";

export interface ClassificationResult {
  category: ExpenseCategory;
  isProcurementRelated: boolean;
  explanation: string;
  suggestedCostAllocation?: {
    type: "transport" | "loading" | "customs" | "storage" | "packaging" | "handling";
    description: string;
  };
}

const procurementKeywords: Array<{ keywords: string[]; type: ClassificationResult["suggestedCostAllocation"]["type"]; description: string }> = [
  { keywords: ["usafiri wa mzigo", "usafirishaji", "transport cost", "freight", "delivery cost"], type: "transport", description: "Gharama ya usafirishaji wa bidhaa" },
  { keywords: ["kupakia", "loading", "kupakua", "offloading"], type: "loading", description: "Gharama ya kupakia/kupakua mzigo" },
  { keywords: ["forodha", "customs", "import duty", "kodi ya forodha"], type: "customs", description: "Gharama za forodha" },
  { keywords: ["hifadhi", "storage", "ghala", "warehouse"], type: "storage", description: "Gharama za kuhifadhi bidhaa" },
  { keywords: ["kufunga", "packaging", "packing", "vifungashio"], type: "packaging", description: "Gharama za vifungashio" },
  { keywords: ["kushika", "handling", "kubeba"], type: "handling", description: "Gharama za kushika mzigo" },
];

const operatingKeywords: Record<string, string[]> = {
  transport: ["usafiri", "transport", "fare", "nauli", "travel", "safari"],
  utility: ["umeme", "electricity", "maji", "water", "internet", "simu", "phone", "airtime"],
  salary: ["mshahara", "salary", "ujira", "wages", "bonus", "incentive"],
  rent: ["kodi", "rent", "leasing", "pango"],
  marketing: ["marketing", "advertisement", "tangazo", "promotion", "branding"],
  maintenance: ["maintenance", "matengenezo", "repair", "karabati"],
};

export function classifyExpense(description: string): ClassificationResult {
  const lower = description.toLowerCase();

  for (const proc of procurementKeywords) {
    if (proc.keywords.some((kw) => lower.includes(kw))) {
      return {
        category: "procurement_cost",
        isProcurementRelated: true,
        explanation: `Hii ni gharama ya ununuzi. Itawekwa kwenye gharama za bidhaa.`,
        suggestedCostAllocation: { type: proc.type, description: proc.description },
      };
    }
  }

  for (const [category, keywords] of Object.entries(operatingKeywords)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return {
        category: category as ExpenseCategory,
        isProcurementRelated: false,
        explanation: `Hii ni gharama ya uendeshaji. Imerekodiwa kama ${category}.`,
      };
    }
  }

  return {
    category: "operating",
    isProcurementRelated: false,
    explanation: "Gharama hii imerekodiwa kama gharama ya uendeshaji.",
  };
}
