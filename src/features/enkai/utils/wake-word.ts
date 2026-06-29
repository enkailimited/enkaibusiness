export interface WakeWordResult {
  detected: boolean;
  confidence: number;
  command: string;
  wakeWord: string;
}

export const WAKE_VARIANTS = ["firdaus", "firdausi"];
export const PREFIXES = ["hey", "halo", "hee", "hello", "oi", "eh"];
export const SUFFIXES = ["nisaidie", "tafadhali", "sikiliza", "njoo", "kuja", "saidia"];

export const HIGH_CONFIDENCE = 0.85;
export const MEDIUM_CONFIDENCE = 0.65;
export const COOLDOWN_MS = 3000;

const REJECT_WORDS = new Set([
  "tausi", "dausi", "daus", "dous", "doubles", "doubs", "doubsi",
  "newzealand", "zealand", "fidaus", "fidausi",
]);

const REJECT_PATTERNS = [
  /fir.*dous/i,
  /fir.*daus/i,
  /^daus/i,
  /^taus/i,
];

function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;
  const cols = aLen + 1;
  const matrix: number[] = new Array<number>((bLen + 1) * cols);
  for (let i = 0; i <= bLen; i++) matrix[i * cols] = i;
  for (let j = 0; j <= aLen; j++) matrix[j] = j;
  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      const idx = i * cols + j;
      const aVal = matrix[(i - 1) * cols + j]!;
      const bVal = matrix[i * cols + j - 1]!;
      const cVal = matrix[(i - 1) * cols + j - 1]!;
      matrix[idx] = Math.min(aVal + 1, bVal + 1, cVal + cost);
    }
  }
  return matrix[bLen * cols + aLen]!;
}

function similarity(word: string, target: string): number {
  const norm = word.toLowerCase().replace(/[^a-z]/g, "");
  const dist = levenshtein(norm, target);
  const maxLen = Math.max(norm.length, target.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

function isRejected(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (REJECT_WORDS.has(w)) return true;
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(w)) return true;
  }
  return false;
}

function bestWakeWordSimilarity(word: string): number {
  let best = 0;
  for (const variant of WAKE_VARIANTS) {
    const sim = similarity(word, variant);
    if (sim > best) best = sim;
  }
  return best;
}

function isExactWakeWord(word: string): boolean {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  return WAKE_VARIANTS.includes(w);
}

export function detectWakeWord(transcript: string): WakeWordResult {
  const normalized = transcript.toLowerCase().trim().replace(/\s+/g, " ");
  if (!normalized) return { detected: false, confidence: 0, command: "", wakeWord: "" };

  const words = normalized.split(" ");

  let bestIndex = -1;
  let bestSim = 0;
  let bestWakeWord = "";

  for (let i = 0; i < words.length; i++) {
    if (isRejected(words[i]!)) continue;
    const sim = bestWakeWordSimilarity(words[i]!);
    if (sim > bestSim) {
      bestSim = sim;
      bestIndex = i;
      bestWakeWord = words[i]!;
    }
  }

  for (let i = 0; i < words.length - 1; i++) {
    const bigram = (words[i]!) + (words[i + 1]!);
    if (isRejected(bigram)) continue;
    const sim = bestWakeWordSimilarity(bigram);
    if (sim > bestSim) {
      bestSim = sim;
      bestIndex = i;
      bestWakeWord = bigram;
    }
  }

  if (bestSim < MEDIUM_CONFIDENCE || bestIndex === -1) {
    return { detected: false, confidence: 0, command: "", wakeWord: "" };
  }

  let commandStart = bestIndex + 1;
  if (commandStart < words.length && SUFFIXES.includes(words[commandStart]!)) {
    commandStart = commandStart + 1;
  }

  const command = words.slice(commandStart).join(" ");

  const exact =
    isExactWakeWord(words[bestIndex]!) ||
    (bestIndex < words.length - 1 && isExactWakeWord((words[bestIndex]!) + (words[bestIndex + 1]!)));

  let confidence = exact ? Math.max(bestSim, 0.95) : bestSim;

  if (confidence >= HIGH_CONFIDENCE && isRejected(bestWakeWord)) {
    confidence = Math.min(confidence, 0.3);
  }

  if (
    bestWakeWord === "tausi" ||
    bestWakeWord === "dausi" ||
    bestWakeWord.includes("doubles") ||
    bestWakeWord.includes("doubs") ||
    bestWakeWord.includes("zealand")
  ) {
    return { detected: false, confidence: 0, command: "", wakeWord: "" };
  }

  return { detected: true, confidence, command, wakeWord: bestWakeWord };
}

export function removeWakeWord(transcript: string, wakeWord: string): string {
  const t = transcript.trim();
  const w = wakeWord.toLowerCase().trim();

  let result = t.toLowerCase();

  result = result.replace(new RegExp(`^${escapeRegex(w)}\\s*`, "i"), "");
  result = result.replace(new RegExp(`\\s+${escapeRegex(w)}$`, "i"), "");
  result = result.replace(new RegExp(`\\s+${escapeRegex(w)}\\s+`, "i"), " ");

  for (const prefix of PREFIXES) {
    result = result.replace(new RegExp(`^${escapeRegex(prefix)}\\s+`, "i"), "");
  }

  for (const suffix of SUFFIXES) {
    result = result.replace(new RegExp(`\\s+${escapeRegex(suffix)}$`, "i"), "");
  }

  return result.trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
