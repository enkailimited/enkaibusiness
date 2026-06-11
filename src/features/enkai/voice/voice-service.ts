import "server-only";

import { parseCommand } from "../commands/command-parser";
import type { ParsedCommand } from "../commands/types";

export interface VoiceInputResult {
  transcript: string;
  confidence: number;
  parsed: ParsedCommand;
}

const commonVoicePatterns: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  { pattern: /what's the stock of/gi, replacement: "/stock" },
  { pattern: /how much stock of/gi, replacement: "/stock" },
  { pattern: /check stock for/gi, replacement: "/stock" },
  { pattern: /i want to sell/gi, replacement: "/sell" },
  { pattern: /record a sale of/gi, replacement: "/sell" },
  { pattern: /sell\s+(\d+(?:\.\d+)?)\s*(kg|g|l|ml|pcs|units?)\s+(?:of\s+)?(.+)/gi, replacement: "/sell $1$2 $3" },
  { pattern: /look up customer/gi, replacement: "/customer" },
  { pattern: /find customer/gi, replacement: "/customer" },
  { pattern: /add new customer/gi, replacement: "/add-customer" },
  { pattern: /register customer/gi, replacement: "/add-customer" },
  { pattern: /show me (?:the )?price(?: of)?/gi, replacement: "/price" },
  { pattern: /how much (?:is|does|for)/gi, replacement: "/price" },
  { pattern: /show (?:me )?(?:the )?report/gi, replacement: "/report" },
  { pattern: /generate report/gi, replacement: "/report" },
];

export function processVoiceInput(transcript: string): VoiceInputResult {
  let normalized = transcript.trim();

  for (const vp of commonVoicePatterns) {
    normalized = normalized.replace(vp.pattern, vp.replacement);
  }

  const parsed = parseCommand(normalized);

  return {
    transcript,
    confidence: parsed.confidence > 0 ? 0.85 : 0.3,
    parsed,
  };
}

export function isVoiceCommand(transcript: string): boolean {
  const commandIndicators = [
    /^(sell|check|show|find|look|add|create|make|record|how|what)/i,
    /^\/(sell|stock|price|customer|staff|order|report|help)/i,
  ];
  return commandIndicators.some((p) => p.test(transcript.trim()));
}
