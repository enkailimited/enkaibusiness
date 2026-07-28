import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { validateLLMConfig, VALID_PROVIDERS } from "@/ai/llm/provider";

describe("LLM Config Validation", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved.AI_PROVIDER = process.env.AI_PROVIDER;
    saved.AI_API_KEY = process.env.AI_API_KEY;
    saved.AI_MODEL = process.env.AI_MODEL;
  });

  afterEach(() => {
    process.env.AI_PROVIDER = saved.AI_PROVIDER;
    process.env.AI_API_KEY = saved.AI_API_KEY;
    process.env.AI_MODEL = saved.AI_MODEL;
  });

  it("should report missing API key", () => {
    delete process.env.AI_API_KEY;
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o";
    const result = validateLLMConfig();
    expect(result.configured).toBe(false);
    expect(result.issues.some((i) => i.includes("AI_API_KEY"))).toBe(true);
  });

  it("should be valid when fully configured", () => {
    process.env.AI_API_KEY = "sk-test";
    process.env.AI_PROVIDER = "openai";
    process.env.AI_MODEL = "gpt-4o";
    const result = validateLLMConfig();
    expect(result.configured).toBe(true);
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o");
  });

  it("should accept valid providers", () => {
    expect(VALID_PROVIDERS).toContain("openai");
    expect(VALID_PROVIDERS).toContain("anthropic");
    expect(VALID_PROVIDERS).toContain("gemini");
  });

  it("should use defaults when model is not set", () => {
    process.env.AI_API_KEY = "sk-test";
    process.env.AI_PROVIDER = "openai";
    delete process.env.AI_MODEL;
    const result = validateLLMConfig();
    expect(result.model).toBe("gpt-4o");
  });
});
