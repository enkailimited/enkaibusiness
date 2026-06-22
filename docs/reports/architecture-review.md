# Firdaus Architecture Review & Implementation Plan

**Tarehe**: 2026-06-12  
**Project**: Firdaus V7.0 — Tanzania Business Language Intelligence  
**Goal**: Make Firdaus feel like a real Tanzanian business assistant, not a translated AI

---

## 1. Wake Word System — Current vs Required

### Current State (`firdaus-global-listener.tsx`)
- Regex: `/firdaus|ferdaus|fir daus|ridausi?|dausi?|siridausi?/i`
- Single regex, no fuzzy matching
- Any text after wake word is sent directly as a command
- No minimum confidence threshold for wake words
- No support for "Hey Firdaus", "Halo Firdaus", "Firdaus nisaidie" etc.

### Required
| Feature | Status | Action |
|---------|--------|--------|
| "Hey Firdaus" / "Hei Firdaus" | ❌ | Add prefix matching |
| "Halo Firdaus" | ❌ | Add greeting prefix |
| "Firdaus nisaidie / sikiliza / njoo" | ❌ | Add imperative suffixes |
| Levenshtein fuzzy matching | ❌ | Match "Fidaus"/"Firdausi"/"Fidausi" |
| Confidence scoring | ❌ | Score per match, threshold config |
| Cooldown / dedup | ❌ | Prevent double-fire on one utterance |

### Risks
- Current regex misses "Hei Firdausi" and "Halo Firdaus" entirely
- No dedup means one utterance with alternating results fires multiple times

---

## 2. Tanzania Business Language Pack

### Current State
- **No structured language pack exists**
- Business types exist (RETAIL, WHOLESALE, PHARMACY, RESTAURANT, SUPERMARKET, HARDWARE)
- BUT: Firdaus uses the **same vocabulary** for all business types
- The command parser has 23 NLU patterns — all generic Swahili/English
- The prompts use "book Swahili" (formal, literary)

### Required
| Category | Existing | Needed | Status |
|----------|----------|--------|--------|
| Retail vocabulary | ❌ | bidhaa, stock, mzigo, deni, mauzo, cash, risiti | New file |
| Wholesale vocabulary | ❌ | katoni, boksi, gunia, pallet, jumla | New file |
| Restaurant vocabulary | ❌ | menu, meza, oda, jikoni | New file |
| Pharmacy vocabulary | ❌ | dawa, prescription, expiry | New file |
| Hardware vocabulary | ❌ | mbao, saruji, msumari, rangi | New file |
| Supermarket vocabulary | ❌ | bidhaa, shelf, barcode, label | New file |
| Distribution vocabulary | ❌ | delivery, route, customer, invoice | New file |

### Files to Create
- `src/features/enkai/language/business-vocabulary.ts`

---

## 3. Intent Synonym Engine

### Current State (`command-parser.ts`)
- 23 NLU patterns, each a single regex
- Pattern matching is one-to-one (one pattern → one intent)
- No synonym expansion or variation handling
- "nimeuza soda" matches, but "soda zimetoka" / "nimetoa soda" do not

### Required Per Intent (examples)

| Intent | Synonyms (Swahili + English) |
|--------|------------------------------|
| SELL | nimeuza, nimetoa, zimetoka, rekodi mauzo, punguza, mteja amechukua, customer bought |
| STOCK_QUERY | imebakije, umebakije, zimebaki ngapi, inabaki nini, what's left, remaining |
| ADD_STOCK | ongeza, jaza, weka, add stock, replenish, restock |
| EXPENSE | nimetumia, gharama ya, nimegharamia, nimelipa, I paid, I spent |
| CUSTOMER_LOOKUP | tafuta mteja, customer yupi, search customer, find client |
| REPORT | ripoti, taarifa, muhtasari, summary, show me, onyesha, nionyeshe |
| DEBT | deni, wanadaiwa, owed, outstanding, debtors |

### Files to Create
- `src/features/enkai/language/synonym-engine.ts`

---

## 4. Conversational Tanzanian Swahili

### Current State (`prompts.ts`)
```
systemPrompt: "Mimi ni Firdaus, wakala wako wa uendeshaji biashara..."
greetingSwahili: "Habari! Mimi ni Firdaus..."
helpSwahili: "Ninaweza kukusaidia kwa mambo yafuatayo..."
noPermission: "Huna ruhusa ya kufanya hili..."
```

### Required

| Context | Current | Desired |
|---------|---------|---------|
| Activation | "Nikusaidie nini?" | "**Nipo boss.**" / "**Ndiyo boss, nakusikiliza.**" |
| Greeting | "Habari! Mimi ni Firdaus..." | "**Karibu boss.**" |
| Understanding | "Nimekuelewa" | "**Nimekupata boss.**" |
| Success | "Imefanikiwa" | "**Imefanyika boss.**" / "**Poa, imekwisha.**" |
| Thinking | "Subiri kidogo..." | "**Ngoja kidogo boss, ninafanyia kazi...**" |
| Confirmation | "Je, una uhakika?" | "**Boss, uko sure?**" |
| Numbers | "TZS 700,500" | "**laki saba na elfu hamsini**" |
| Money | "TZS 5,000" | "**ng'oo elfu tano**" |
| Error | "Samahani, tatizo limetokea" | "**Pole boss, kuna tatizo. Jaribu tena.**" |
| Unknown | "Sikuelewa vizuri" | "**Boss, si kupata vizuri. Rudia tena.**" |

### Risks
- Too casual could feel unprofessional for some businesses
- Need per-business toggle (formal/casual) stored in memory

---

## 5. Context-Aware Business Vocabulary

### Current State
- `usePageContext()` detects page type and entity
- BUT: the detected page context is **never used** to influence vocabulary
- `business-brain.ts` receives `pageContext` but only uses entity for sales intent
- **No business-type vocabulary switching**

### Required Flow
```
User says "dawa"
  → check business.industry_mode
  → if pharmacy: treat as product lookup
  → if restaurant: "Dawa? Unamaanisha nini?" (not a restaurant item)
```

| Business Type | Vocabulary Pack | Special Intent |
|---------------|----------------|----------------|
| Restaurant | meza, oda, jikoni, menu | Table management, menu items |
| Pharmacy | dawa, prescription, expiry, dosage | Expiry tracking, prescription |
| Wholesale | katoni, boksi, gunia, pallet, jumla | Bulk pricing, unit conversion |
| Retail | rejareja, cash, risiti, bidhaa | Regular POS operations |
| Hardware | mbao, saruji, msumari, rangi | Category-specific stock |
| Supermarket | shelf, barcode, label, section | Shelf management |
| Distribution | delivery, route, customer, gari | Route planning, delivery |

---

## 6. Voice Output Improvements

### Current State (`firdaus-provider.tsx`)
- Voice priority: Google sw-TZ → any sw → Google en-US → en-US → first available
- Rate: 0.8, Pitch: 1.05
- **No SSML support**
- **No number-to-word conversion** (reads "15000" as digits, not "elfu kumi na tano")
- **Chrome on Linux has zero Swahili voices** (blocker)

### Required
| Feature | Implementation | Priority |
|---------|---------------|----------|
| Number-to-Swahili words | `15000` → "elfu kumi na tano" | MEDIUM |
| Currency-to-Swahili | `TZS 5000` → "ng'oo elfu tano" | MEDIUM |
| SSML pauses | Break after commas, periods | LOW |
| Server-side TTS (Google Cloud) | Fallback when browser has no sw voice | MEDIUM |
| Chunk long responses | Split >200 chars into multiple utterances | LOW |

### Number Format Examples
| Number | Current | Desired |
|--------|---------|---------|
| 500 | "500" | "mia tano" |
| 1,500 | "1500" | "elfu moja na mia tano" |
| 50,000 | "50000" | "elfu hamsini" |
| 700,500 | "700500" | "laki saba na elfu hamsini" |
| 1,000,000 | "1000000" | "milioni moja" |

---

## 7. Business Memory Learning

### Current State (`memory-service.ts`)
- 6 MemoryTypes: PREFERRED_SUPPLIER, TOP_CUSTOMER, COMMON_EXPENSE, POPULAR_PRODUCT, PAYMENT_METHOD, FREQUENT_PRODUCT
- Learns from completed workflows only
- Confidence scoring (0.3 new, +0.1 per use, max 1.0)
- Cache TTL: 5 minutes

### Required Addition
| MemoryType | What It Stores | Source |
|------------|---------------|--------|
| FREQUENT_TERM | Business-specific vocabulary the user repeats | Voice input + text input |
| PREFERRED_STYLE | Formal vs casual | User interaction pattern |
| COMMAND_PATTERN | How the user phrases commands | Voice history |

### Learning Flow
```
User says "ongeza maji makubwa" 3 times
  → learnPattern("FREQUENT_TERM", "maji makubwa")
  → confidence increases 0.3 → 0.4 → 0.5
  → future intent parsing weights "maji makubwa" higher
```

---

## 8. Voice Confidence System

### Current State
- **Does not exist at all**
- `maxAlternatives: 5` is set but never used
- Only the first (highest confidence) alternative is processed
- No minimum confidence threshold before executing commands
- No confirmation for low-confidence matches

### Required
| Confidence Range | Action |
|-----------------|--------|
| ≥ 0.8 | Execute immediately |
| 0.5 – 0.8 | Ask confirmation: "Boss, umesema ongeza stock au toa stock?" |
| < 0.5 | Ignore, continue listening |

### Thresholds by Operation Type
| Operation | Execute Threshold | Confirm Threshold |
|-----------|------------------|-------------------|
| Read (check stock, view report) | ≥ 0.6 | 0.4 – 0.6 |
| Write (sell, expense, purchase) | ≥ 0.8 | 0.5 – 0.8 |
| Delete / sensitive | ≥ 0.9 | 0.7 – 0.9 |
| Wake word | ≥ 0.5 | n/a |

---

## 9. Files Summary

### New Files Required
| # | File | Purpose |
|---|------|---------|
| 1 | `src/features/enkai/language/business-vocabulary.ts` | Per-industry vocabulary maps |
| 2 | `src/features/enkai/language/synonym-engine.ts` | Synonym → intent mapping with confidence |
| 3 | `src/features/enkai/language/number-utils.ts` | Swahili number/currency formatter |
| 4 | `src/features/enkai/language/tanzanian-prompts.ts` | Casual Tanzanian response templates |
| 5 | `src/features/enkai/voice/voice-confidence.ts` | Confidence thresholds, confirmation logic |
| 6 | `src/features/enkai/language/index.ts` | Barrel exports |

### Files to Modify
| # | File | Changes |
|---|------|---------|
| 1 | `firdaus-global-listener.tsx` | Fuzzy wake word, "hey/halo" prefixes, cooldown, confidence |
| 2 | `command-parser.ts` | Integrate synonym engine, expand to 60+ patterns |
| 3 | `firdaus-provider.tsx` | SSML, number formatting, server-side TTS fallback |
| 4 | `prompts.ts` | Replace book Swahili with Tanzanian casual responses |
| 5 | `business-brain.ts` | Pass business type to vocabulary, industry-aware matching |
| 6 | `memory-service.ts` | Add FREQUENT_TERM type, learn from voice input |
| 7 | `memory-store.ts` | Add business vocabulary to session context |
| 8 | `assistant/types.ts` | Add confidence + alternative types for voice |
| 9 | `schema.prisma` | Add FREQUENT_TERM to MemoryType enum |

---

## 10. Database Changes

```prisma
// In MemoryType enum — ADD ONE VALUE:
FREQUENT_TERM
```

Hakuna table mpya. Prisma migration moja tu.

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large synonym tables slow parsing | Medium | Pre-compile to Map, O(1) lookup |
| Overlapping synonyms = wrong intent | High | Priority scoring by business type + context |
| Casual Swahili too informal | Low | Configurable per-business (formal/casual toggle) |
| Browser TTS has no Swahili voices | **High** | Server-side TTS via Google Cloud API |
| SpeechRecognition unavailable | Medium | Graceful fallback to text input |
| Fuzzy matching too aggressive | Medium | Configurable threshold (default 0.75) |
| Prisma migration on production | Low | Non-breaking (add enum value only) |

---

## 12. Implementation Order

### Phase 1 — Wake Word & Voice Confidence (HIGHEST IMPACT)
1. `firdaus-global-listener.tsx` — Fuzzy wake word, "Hey/Halo" prefixes, cooldown, dedup
2. `voice-confidence.ts` — Confidence thresholds, confirmation flow
3. `firdaus-provider.tsx` — Alternative display, confirmation dialogs
4. `assistant/types.ts` — Add confidence types

### Phase 2 — Language Pack & Synonym Engine
5. `business-vocabulary.ts` — All 7 industry vocabularies
6. `synonym-engine.ts` — 60+ synonym patterns, priority scoring
7. `command-parser.ts` — Integrate synonym engine + vocabulary
8. `business-brain.ts` — Industry-aware intent routing

### Phase 3 — Tanzanian Swahili Conversation
9. `tanzanian-prompts.ts` — Casual response templates
10. `prompts.ts` — Replace book Swahili
11. `number-utils.ts` — Number/currency formatter
12. `firdaus-provider.tsx` — SSML, number formatting in TTS

### Phase 4 — Memory & Learning
13. `schema.prisma` — Add FREQUENT_TERM to MemoryType
14. `memory-service.ts` — Learn business terms, influence parsing

### Phase 5 — Polish
15. Server-side TTS integration (Google Cloud)
16. Testing
17. Fine-tune wake word thresholds
