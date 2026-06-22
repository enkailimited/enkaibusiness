export interface WakeWordResult {
  detected: boolean;
  confidence: number;
  command: string;
}

export const WAKE_VARIANTS = ["dausi", "boka"];
export const PREFIXES = ["hey", "halo", "hee", "hello", "oi", "eh"];
export const SUFFIXES = ["nisaidie", "tafadhali", "sikiliza", "njoo", "kuja", "saidia"];

export const HIGH_CONFIDENCE = 0.75;
export const MEDIUM_CONFIDENCE = 0.45;
export const COOLDOWN_MS = 2000;

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
  if (!normalized) return { detected: false, confidence: 0, command: "" };

  const words = normalized.split(" ");

  // Check each single word for wake word similarity
  let bestIndex = -1;
  let bestSim = 0;

  for (let i = 0; i < words.length; i++) {
    const sim = bestWakeWordSimilarity(words[i]!);
    if (sim > bestSim) {
      bestSim = sim;
      bestIndex = i;
    }
  }

  // Check bigrams (consecutive pairs) for split wake words like "fir daus"
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = (words[i]!) + (words[i + 1]!);
    const sim = bestWakeWordSimilarity(bigram);
    if (sim > bestSim) {
      bestSim = sim;
      bestIndex = i;
    }
  }

  if (bestSim < MEDIUM_CONFIDENCE || bestIndex === -1) {
    return { detected: false, confidence: 0, command: "" };
  }

  // Determine command: everything after the wake word
  // Skip suffix words that directly follow the wake word
  let commandStart = bestIndex + 1;
  if (commandStart < words.length && SUFFIXES.includes(words[commandStart]!)) {
    commandStart = commandStart + 1;
  }

  const command = words.slice(commandStart).join(" ");

  // Boost confidence for exact matches
  const exact =
    isExactWakeWord(words[bestIndex]!) ||
    (bestIndex < words.length - 1 && isExactWakeWord((words[bestIndex]!) + (words[bestIndex + 1]!)));
  const confidence = exact ? Math.max(bestSim, 0.92) : bestSim;

  return { detected: true, confidence, command };
}
