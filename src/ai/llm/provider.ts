export type LLMProvider = "openai" | "anthropic" | "gemini" | "custom";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  baseUrl?: string;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMCompletion {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  model: string;
}

const providerConfigs: Record<string, Partial<LLMConfig>> = {};

export function configureProvider(businessId: string, config: Partial<LLMConfig>): void {
  providerConfigs[businessId] = { ...providerConfigs[businessId], ...config };
}

export function getProviderConfig(businessId?: string): LLMConfig {
  const envProvider = (process.env.AI_PROVIDER ?? "openai") as LLMProvider;

  const defaults: LLMConfig = {
    provider: envProvider,
    apiKey: process.env.AI_API_KEY ?? "",
    model: process.env.AI_MODEL ?? "gpt-4o",
    maxTokens: 2048,
    temperature: 0.7,
  };

  if (businessId && providerConfigs[businessId]) {
    return { ...defaults, ...providerConfigs[businessId] };
  }

  return defaults;
}

export async function complete(
  messages: LLMMessage[],
  options?: { businessId?: string; temperature?: number; maxTokens?: number },
): Promise<LLMCompletion> {
  const config = getProviderConfig(options?.businessId);

  switch (config.provider) {
    case "openai":
      return completeOpenAI(messages, { ...config, ...options });
    case "anthropic":
      return completeAnthropic(messages, { ...config, ...options });
    case "gemini":
      return completeGemini(messages, { ...config, ...options });
    default:
      return completeOpenAI(messages, { ...config, ...options });
  }
}

async function completeOpenAI(
  messages: LLMMessage[],
  config: LLMConfig & { temperature?: number; maxTokens?: number },
): Promise<LLMCompletion> {
  const response = await fetch(config.baseUrl ?? "https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens ?? config.maxTokens ?? 2048,
      temperature: config.temperature ?? config.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    usage: {
      promptTokens: data.usage?.prompt_tokens ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
      totalTokens: data.usage?.total_tokens ?? 0,
    },
  };
}

async function completeAnthropic(
  messages: LLMMessage[],
  config: LLMConfig & { temperature?: number; maxTokens?: number },
): Promise<LLMCompletion> {
  const systemMessage = messages.find((m) => m.role === "system");
  const chatMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch(config.baseUrl ?? "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      system: systemMessage?.content,
      messages: chatMessages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: config.maxTokens ?? 2048,
      temperature: config.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    usage: {
      promptTokens: data.usage?.input_tokens ?? 0,
      completionTokens: data.usage?.output_tokens ?? 0,
      totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    },
  };
}

async function completeGemini(
  messages: LLMMessage[],
  config: LLMConfig & { temperature?: number; maxTokens?: number },
): Promise<LLMCompletion> {
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `${config.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta/models/"}{config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: config.maxTokens ?? 2048,
          temperature: config.temperature ?? 0.7,
        },
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    content: data.candidates[0].content.parts[0].text,
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
    },
  };
}

export async function embed(
  text: string,
  options?: { businessId?: string },
): Promise<EmbeddingResult> {
  const config = getProviderConfig(options?.businessId);

  const response = await fetch(`${config.baseUrl ?? "https://api.openai.com/v1/embeddings"}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model.startsWith("text-embedding") ? config.model : "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "Unknown error");
    throw new Error(`Embedding API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  return {
    vector: data.data[0].embedding,
    dimensions: data.data[0].embedding.length,
    model: data.model,
  };
}
