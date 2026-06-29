import { prisma } from "@/server/db";

export type KnowledgeDomain =
  | "general"
  | "business"
  | "erp"
  | "industry"
  | "financial"
  | "accounting"
  | "tax"
  | "agriculture"
  | "healthcare"
  | "education"
  | "programming";

export interface KnowledgeEntry {
  domain: KnowledgeDomain;
  topic: string;
  content: string;
  language: "sw" | "en";
  tags: string[];
}

const staticKnowledge: KnowledgeEntry[] = [
  {
    domain: "general",
    topic: "firdaus_introduction",
    content: "Mimi ni Firdaus, msaidizi wako wa biashara. Ninaweza kukusaidia kuuza, kununua, kuangalia stoo, na mengine mengi.",
    language: "sw",
    tags: ["introduction", "help"],
  },
  {
    domain: "general",
    topic: "firdaus_introduction",
    content: "I am Firdaus, your business assistant. I can help you sell, purchase, check inventory, and more.",
    language: "en",
    tags: ["introduction", "help"],
  },
];

const knowledgeCache = new Map<string, KnowledgeEntry[]>();

export function registerKnowledge(entries: KnowledgeEntry[]): void {
  for (const entry of entries) {
    const key = `${entry.domain}:${entry.topic}`;
    const existing = knowledgeCache.get(key) ?? [];
    existing.push(entry);
    knowledgeCache.set(key, existing);
  }
}

export function getDomainKnowledge(domain: KnowledgeDomain, language?: "sw" | "en"): KnowledgeEntry[] {
  const results: KnowledgeEntry[] = [];
  for (const [, entries] of knowledgeCache) {
    for (const entry of entries) {
      if (entry.domain === domain && (!language || entry.language === language)) {
        results.push(entry);
      }
    }
  }
  return results;
}

export function searchKnowledge(
  query: string,
  options?: { domain?: KnowledgeDomain; language?: "sw" | "en"; limit?: number },
): KnowledgeEntry[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const results: KnowledgeEntry[] = [];

  for (const [, entries] of knowledgeCache) {
    for (const entry of entries) {
      if (options?.domain && entry.domain !== options.domain) continue;
      if (options?.language && entry.language !== options.language) continue;

      const text = `${entry.topic} ${entry.content}`.toLowerCase();
      const matches = terms.filter((t) => text.includes(t)).length;
      if (matches > 0) results.push(entry);
    }
  }

  results.sort((a, b) => {
    const aText = `${a.topic} ${a.content}`.toLowerCase();
    const bText = `${b.topic} ${b.content}`.toLowerCase();
    const aScore = terms.filter((t) => aText.includes(t)).length;
    const bScore = terms.filter((t) => bText.includes(t)).length;
    return bScore - aScore;
  });

  return results.slice(0, options?.limit ?? 5);
}

export async function loadBusinessKnowledge(businessId: string): Promise<void> {
  const memories = await prisma.businessMemory.findMany({
    where: { businessId },
  });

  for (const mem of memories) {
    const entry: KnowledgeEntry = {
      domain: "business",
      topic: mem.key,
      content: mem.value,
      language: "sw",
      tags: ["learned", `business:${businessId}`],
    };
    registerKnowledge([entry]);
  }
}

export { staticKnowledge };
