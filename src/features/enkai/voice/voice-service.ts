import { parseCommand } from "../commands/command-parser";
import type { ParsedCommand } from "../commands/types";
import { analyzeVoiceIntent, formatPipelineLog, type VoiceIntentResult } from "./voice-intent";
import { detectWakeWord, removeWakeWord } from "../utils/wake-word";

export interface VoiceInputResult {
  transcript: string;
  confidence: number;
  parsed: ParsedCommand;
  analysis: VoiceIntentResult;
  normalized: string;
}

const commonVoicePatterns: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  { pattern: /stock ya (.+) imebaki/gi, replacement: "/stock $1" },
  { pattern: /stock ya (.+) zimebaki/gi, replacement: "/stock $1" },
  { pattern: /nimeuza/gi, replacement: "/sell" },
  { pattern: /nimenunua/gi, replacement: "/purchase" },
  { pattern: /nimetumia/gi, replacement: "/expense" },
  { pattern: /nimegharamia/gi, replacement: "/expense" },
  { pattern: /nimelipa/gi, replacement: "/expense" },
  { pattern: /tafuta mteja/gi, replacement: "/customer" },
  { pattern: /tafuta msambazaji/gi, replacement: "/supplier" },
  { pattern: /ongeza mteja/gi, replacement: "/add-customer" },
  { pattern: /ongeza msambazaji/gi, replacement: "/add-supplier" },
  { pattern: /bei ya (.+)/gi, replacement: "/price $1" },
  { pattern: /ripoti ya (.+)/gi, replacement: "/report $1" },
  { pattern: /taarifa ya (.+)/gi, replacement: "/report $1" },
  { pattern: /hamisha stock/gi, replacement: "/transfer" },
  { pattern: /angalia pochi/gi, replacement: "/wallet" },
  { pattern: /maarifa ya biashara/gi, replacement: "/insights" },
  { pattern: /what's the stock of/gi, replacement: "/stock" },
  { pattern: /how much stock of/gi, replacement: "/stock" },
  { pattern: /check stock for/gi, replacement: "/stock" },
  { pattern: /i want to sell/gi, replacement: "/sell" },
  { pattern: /record a sale of/gi, replacement: "/sell" },
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
  let cleanedTranscript = transcript.trim().toLowerCase();

  const wakeResult = detectWakeWord(cleanedTranscript);
  if (wakeResult.detected) {
    cleanedTranscript = removeWakeWord(cleanedTranscript, wakeResult.wakeWord);
  }

  const analysis = analyzeVoiceIntent(cleanedTranscript);
  let normalized = cleanedTranscript;

  for (const vp of commonVoicePatterns) {
    normalized = normalized.replace(vp.pattern, vp.replacement);
  }

  const parsed = parseCommand(normalized);

  console.log(formatPipelineLog(analysis));
  console.log(`[Firdaus] Command normalized: "${normalized}"`);

  return {
    transcript,
    confidence: parsed.confidence > 0 ? Math.max(parsed.confidence, analysis.confidence) : analysis.confidence,
    parsed,
    analysis,
    normalized,
  };
}

export function isVoiceCommand(transcript: string): boolean {
  const commandIndicators = [
    /^(sell|check|show|find|look|add|create|make|record|how|what|nimeuza|nimenunua|nimetumia|tafuta|ongeza|angalia|hamisha|bei|ripoti)/i,
    /^\/(sell|stock|price|customer|staff|order|report|help|expense|purchase|supplier|transfer|wallet|insights)/i,
  ];
  return commandIndicators.some((p) => p.test(transcript.trim()));
}
