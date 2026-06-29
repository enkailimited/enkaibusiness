import { embed, complete, type LLMMessage } from "../llm/provider";

export interface KnowledgeChunk {
  id: string;
  content: string;
  source: string;
  businessId?: string;
  metadata: Record<string, unknown>;
  score?: number;
}

export interface RAGResult {
  answer: string;
  sources: KnowledgeChunk[];
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

const knowledgeStore: KnowledgeChunk[] = [];

export function indexKnowledge(chunks: KnowledgeChunk[]): void {
  for (const chunk of chunks) {
    const existing = knowledgeStore.findIndex(
      (k) => k.id === chunk.id && k.businessId === chunk.businessId,
    );
    if (existing >= 0) {
      knowledgeStore[existing] = chunk;
    } else {
      knowledgeStore.push(chunk);
    }
  }
}

export function removeKnowledge(id: string, businessId?: string): void {
  const idx = knowledgeStore.findIndex(
    (k) => k.id === id && k.businessId === (businessId ?? k.businessId),
  );
  if (idx >= 0) knowledgeStore.splice(idx, 1);
}

export function clearBusinessKnowledge(businessId: string): void {
  const filtered = knowledgeStore.filter((k) => k.businessId !== businessId);
  knowledgeStore.length = 0;
  knowledgeStore.push(...filtered);
}

function keywordSearch(query: string, businessId?: string, topK: number = 5): KnowledgeChunk[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  const scored = knowledgeStore
    .filter((k) => !k.businessId || k.businessId === businessId || !businessId)
    .map((chunk) => {
      const content = chunk.content.toLowerCase();
      const matches = terms.filter((t) => content.includes(t)).length;
      return { ...chunk, score: terms.length > 0 ? matches / terms.length : 0 };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, topK);

  return scored as KnowledgeChunk[];
}

function retrieveRelevant(query: string, businessId?: string, topK: number = 5): KnowledgeChunk[] {
  return keywordSearch(query, businessId, topK);
}

export async function ask(
  query: string,
  options?: {
    businessId?: string;
    systemPrompt?: string;
    topK?: number;
    temperature?: number;
  },
): Promise<RAGResult> {
  const relevantDocs = retrieveRelevant(query, options?.businessId, options?.topK ?? 5);

  const context = relevantDocs.length > 0
    ? relevantDocs.map((d) => `[${d.source}] ${d.content}`).join("\n\n")
    : "Hakuna taarifa maalum zinazopatikana.";

  const systemPrompt = options?.systemPrompt
    ?? `Wewe ni msaidizi wa biashara anayeitwa Firdaus.
Jibu kwa Kiswahili au Kiingereza kulingana na lugha ya swali.
Tumia muktadha uliopewa pekee.
Usijibu swali ambalo huna muktadha wake.

Muktadha:
${context}`;

  const messages: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: query },
  ];

  const result = await complete(messages, {
    businessId: options?.businessId,
    temperature: options?.temperature,
  });

  return {
    answer: result.content,
    sources: relevantDocs,
    usage: result.usage,
  };
}

export async function generateEmbeddings(chunks: KnowledgeChunk[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const chunk of chunks) {
    const embedding = await embed(chunk.content);
    results.push(embedding.vector);
  }
  return results;
}

export { knowledgeStore };
