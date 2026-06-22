# Firdaus — Current Architecture Report

**Date**: 2026-06-12  
**Version**: V7 (pre-Tanzania Business Language Intelligence)  
**Project**: Enkai Business — Intelligent Business Operating Platform  
**Stack**: Next.js 16 + TypeScript 5.7 + Prisma 6 + PostgreSQL 16  
**Primary Language**: Kiswahili (Simplified / "Rahisi")

---

## Table of Contents

1. [High Level Overview](#1-high-level-overview)
2. [Platform Mode](#2-platform-mode)
3. [Business / Workspace Mode](#3-business--workspace-mode)
4. [Current Wake Word System](#4-current-wake-word-system)
5. [Current Voice System](#5-current-voice-system)
6. [Current Command Parser](#6-current-command-parser)
7. [Current Business Brain](#7-current-business-brain)
8. [Current Memory System](#8-current-memory-system)
9. [Current Business Vocabulary Support](#9-current-business-vocabulary-support)
10. [Current Limitations](#10-current-limitations)
11. [Readiness for V8](#11-readiness-for-v8)
12. [File Inventory](#12-file-inventory)

---

## 1. High Level Overview

### 1.1 What Firdaus Is

Firdaus is a **voice-enabled AI business operating agent** embedded in the Enkai Business platform. It is not a chatbot — it is an autonomous agent designed to execute business operations (sales, purchases, expenses, stock checks) via natural language voice commands in Kiswahili.

Firdaus operates in **two modes**:
- **Platform Mode**: Queries cross-business analytics (users, businesses, subscriptions, leads, revenue)
- **Workspace/Business Mode**: Executes business-specific operations (sell, stock, purchase, expense, etc.)

### 1.2 Current Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                              │
│                                                                   │
│  ┌─────────────────────┐  ┌─────────────────────────────────┐   │
│  │ FirdausGlobalListener│  │      FirdausProvider             │   │
│  │  (invisible, always  │  │  (React Context)                 │   │
│  │   listening)         │  │                                  │   │
│  │                      │  │  State:                          │   │
│  │  • SpeechRecognition │  │    isListening, isSpeaking,      │   │
│  │  • Wake word detect  │  │    isAwake, messages,            │   │
│  │  • Mode detection    │  │    businessId, userId, mode,     │   │
│  │  • Auth integration  │  │    currentWorkflow, etc.         │   │
│  │  • Auto-restart      │  │                                  │   │
│  │  • 120s inactivity   │  │  Actions:                        │   │
│  │    auto-sleep        │  │    wake, sleep, speak,           │   │
│  └──────────┬───────────┘  │    sendMessage,                  │   │
│             │              │    setBusinessContext,            │   │
│             │              │    clearSession, markGreeted     │   │
│             │              └──────────────┬──────────────────┘ │
│             │                             │                     │
│  ┌──────────▼─────────────────────────────▼──────────────────┐ │
│  │              UI Components                                 │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │FirdausToast  │  │FirdausResp.  │  │FirdausInsights│   │ │
│  │  │(login greet) │  │Toast(response│  │(insight card) │   │ │
│  │  │ 14s auto     │  │ 10s auto    │  │ severity color│   │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Server Actions (Next.js)                     │   │
│  │  sendMessageAction → processMessage → processWithBrain    │   │
│  │  getGreetingDataAction → Revenue + Reorder + Debt + Health│   │
│  │  getProactiveInsightsAction → generateProactiveInsights   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                     SERVER LAYER                                 │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │  business-     │  │  assistant-    │  │  tool-registry.ts   │ │
│  │  brain.ts      │  │  service.ts    │  │  18 tools          │ │
│  │                │  │                │  │                    │ │
│  │  Intent router │  │  16 intent     │  │  check-stock       │ │
│  │  Permission    │  │  handlers      │  │  sell              │ │
│  │  checker       │  │                │  │  add-purchase      │ │
│  │  Workflow      │  │  processMsg()  │  │  add-expense       │ │
│  │  persistence   │  │  getHistory()  │  │  lookup-customer   │ │
│  │  Audit logging │  │  clearSession()│  │  view-report       │ │
│  └───────┬────────┘  └────────────────┘  └────────┬───────────┘ │
│          │                                        │             │
│  ┌───────▼────────────────────────────────────────▼───────────┐ │
│  │                SERVICES                                     │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │ │
│  │  │workflow-       │ │ permission-    │ │ memory-        │  │ │
│  │  │persistence.ts  │ │ service.ts     │ │ service.ts     │  │ │
│  │  │                │ │                │ │                │  │ │
│  │  │• DB-backed     │ │• Staff-based   │ │• Live memory   │  │ │
│  │  │  state machine │ │  RBAC          │ │• Learned       │  │ │
│  │  │• 6 states      │ │• Permission    │ │  patterns      │  │ │
│  │  │• Survives      │ │  keys          │ │• 5-min cache   │  │ │
│  │  │  restart       │ │• Wildcard "*"  │ │• Confidence    │  │ │
│  │  └────────────────┘ └────────────────┘ └────────────────┘  │ │
│  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐  │ │
│  │  │ proactive-     │ │ expense-       │ │ proactive-     │  │ │
│  │  │ advisor.ts     │ │ classifier     │ │ insights.ts    │  │ │
│  │  └────────────────┘ └────────────────┘ └────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Prisma ORM → PostgreSQL (Neon)                │  │
│  │  78 models, 18 enums — User, Business, Sale,             │  │
│  │  CatalogItem, Inventory, Customer, Supplier, Lead,        │  │
│  │  Subscription, Staff, FirdausWorkflow, BusinessMemory ... │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Main Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `FirdausProvider` | React Context | `provider/firdaus-provider.tsx` | State management, TTS, message sending |
| `FirdausContext` | React Context | `provider/firdaus-context.tsx` | State types, context access hook |
| `FirdausGlobalListener` | Component | `components/firdaus-global-listener.tsx` | SpeechRecognition, wake word, mode detection |
| `FirdausResponseToast` | Component | `components/firdaus-response-toast.tsx` | 10s auto-dismiss response bubble |
| `FirdausToast` | Component | `components/firdaus-toast.tsx` | 14s login greeting with proactive data |
| `FirdausInsights` | Component | `components/firdaus-insights.tsx` | Proactive insight card (severity-coded) |
| `processWithBrain` | Function | `brain/business-brain.ts` | Main orchestrator — intent routing, permissions, workflows |
| `processMessage` | Function | `assistant/assistant-service.ts` | Message processing pipeline with memory |
| `parseCommand` | Function | `commands/command-parser.ts` | NLU parser (slash + natural language patterns) |
| `toolRegistry` | Singleton | `tools/tool-registry.ts` | 18 business tools with DB operations |
| `workflowEngine` | Singleton | `services/workflow-engine.ts` | In-memory workflow state machine |
| `getBusinessMemory` | Function | `brain/memory-service.ts` | Business pattern memory with caching |
| `checkPermission` | Function | `services/permission-service.ts` | Staff-based RBAC permission check |
| `sendMessageAction` | Server Action | `actions/service-actions.ts` | Client-server bridge for messages |
| `getGreetingDataAction` | Server Action | `actions/greeting-actions.ts` | Aggregates greeting + AI module data |

### 1.4 Data Flow

```
User speaks → SpeechRecognition → wake word detected
  → sendMessage(cleanedText) [client]
  → sendMessageAction(text, context) [server action]
  → processMessage(input, context) [assistant-service]
  → processWithBrain({input, context}) [business-brain]
    → resolve business ID (if missing)
    → check active workflow
    → parseCommand(input) → Intent
    → checkPermission(userId, businessId, intent)
    → route to intent handler
    → toolRegistry.execute(intent, params)
    → Prisma query → result
    → createAuditLog
    → learnPattern (if successful)
    → BrainResponse {message, data, workflow, step}
  → AssistantResponse {message, intent, confidence, actionData}
  → sendMessage receives response [client]
  → replaces "Subiri kidogo..." with actual response
  → speak(response.message) via SpeechSynthesis
```

### 1.5 Voice Flow

```
┌──────────┐    ┌────────────────┐    ┌───────────────┐
│ Microphone│───▶│ SpeechRecog.   │───▶│ Wake Word     │
│          │    │ lang: "sw"     │    │ Regex Match   │
│          │    │ continuous:true │    │ /firdaus|.../i│
│          │    │ maxAlt: 5      │    │               │
└──────────┘    └────────────────┘    └───────┬───────┘
                                             │
                  ┌──────────────────────────┘
                  ▼
┌──────────────────────────────┐
│ Extract command after wake   │
│ word or wake-only → greet    │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ sendMessage(command) → Brain │
│ → response.message           │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ speak(response) →            │
│ SpeechSynthesisUtterance     │
│ lang: sw, rate: 0.8         │
│ Voice: Google sw > any sw >  │
│        Google en > en-US     │
└──────────────────────────────┘
```

### 1.6 Wake Word Flow

```
SpeechResult arrives
  → iterate from resultIndex
    → for each alternative (0..maxAlternatives)
      → transcript.toLowerCase()
      → test /firdaus|ferdaus|fir daus|ridausi?|dausi?|siridausi?/i
      → if match && isFinal:
        → cleaned = transcript.replace(wakeWords, "").trim()
        → if cleaned: actions.sendMessage(cleaned)
        → else: actions.wake() + speak("Ndio, nakusikiliza...")
        → return (stop processing further alternatives)
  → onerror: if "not-allowed" → show permission button
            else → restart in 300ms
  → onend: restart in 300ms
```

### 1.7 Business Brain Flow

```
processWithBrain({input, context})
│
├─ mode === "platform" → handlePlatformRequest(input) → return
│
├─ !businessId && userId → userRole.findFirst → if found, recurse
│
├─ !businessId → return "hakuna akaunti ya biashara" error
│
├─ getActiveWorkflow(businessId, userId)
│   └─ if active → handleActiveWorkflow(wf, input, context) → return
│
├─ parseCommand(input)
│   └─ intent === "unknown" → check DB workflow again → return error
│
├─ checkPermission(userId, businessId, intent)
│   └─ !allowed → return "hakuna ruhusa" error
│
├─ switch(intent):
│   ├─ "sell" → handleSalesIntent(params, context, pageContext)
│   ├─ "add-purchase" → handlePurchaseIntent(params, context)
│   ├─ "add-expense" → handleExpenseIntent(params, context)
│   ├─ "check-stock" → handleStockIntent(params, context, pageContext)
│   ├─ "transfer-stock" → handleTransferIntent(params, context)
│   └─ default → handleGenericIntent(parsed, context) → toolRegistry.execute()
│
├─ createAuditLog()
├─ learnPattern() if successful
└─ return BrainResponse
```

### 1.8 Memory Flow

```
getBusinessMemory(businessId)
  → Check in-memory cache (Map, 5-min TTL)
  → If stale or missing:
    → Promise.all([
        computeLiveMemory(businessId),     // Live DB queries
        getLearnedMemory(businessId)        // BusinessMemory table
      ])
    → Merge with Set dedup, slice(0, 10)
    → Cache result
  → Return BusinessMemory

learnPattern(businessId, type, key, value)
  → Try findUnique by composite key (businessId, type, key)
  → If exists: confidence = min(1, confidence + 0.1)
  → If not: create with confidence = 0.3
  → Invalidate cache
```

### 1.9 Workflow Flow

```
Workflow starts (intent matched but missing params)
  → getOrCreateWorkflow(businessId, userId, type)  [creates DB row]
  → saveWorkflowStep(id, nextStep, status)          [advances state]
  → return next question to user

User responds (provides missing param)
  → processWithBrain → getActiveWorkflow → handleActiveWorkflow
  → setWorkflowParam(id, key, value)                [stores in collectedData]
  → advance step → if not last step → return next question
  → if last step:
    → validateWorkflow(id)   → status = VALIDATING
    → executeWorkflow(id)    → status = EXECUTING
    → executeCollectedWorkflow(type, data, context) → actual tool call
    → completeWorkflow(id)   → status = COMPLETED
    → learnPattern(...)      → learn from completed workflow
    → return success message
```

---

## 2. Platform Mode

### 2.1 How Platform Mode Is Detected

**File**: `src/features/enkai/components/firdaus-global-listener.tsx:133-142`

```typescript
const segments = pathname.split("/").filter(Boolean);
const mode = segments[0] === "platform" ? "platform" as const
  : segments[0] === "workspaces" ? "workspace" as const
  : "generic" as const;
```

**Which routes activate platform mode**: Any route starting with `/platform/`:
- `/platform/dashboard`
- `/platform/sales`
- `/platform/leads`
- `/platform/marketing`
- `/platform/distribution`
- `/platform/commissions`
- `/platform/subscriptions`
- `/platform/finance`
- `/platform/users`
- `/platform/roles`
- `/platform/settings`
- `/platform/support`
- `/platform/onboarding`
- `/platform/profile`

**Which pathname patterns are checked**: `segments[0] === "platform"` — only the first path segment.

**Which permissions are used**: **NONE**. Platform mode does not call `checkPermission()`. Any authenticated user on a platform page can query all platform data.

**Which services are called**: Business brain → `handlePlatformRequest()` directly. No `parseCommand()`, no `checkPermission()`, no workflow system.

### 2.2 Platform Capabilities

All capabilities are in `src/features/enkai/brain/business-brain.ts:423-502`.

#### 2.2.1 User Statistics (`/watumiaji|users?|watumiaji/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "watumiaji", "users", "takwimu za watumiaji" |
| **Intent detection** | Direct keyword regex in `handlePlatformRequest()` — no `parseCommand()` |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.user.count()` + `prisma.user.findMany()` |
| **DB queries** | `SELECT COUNT(*) FROM users`, `SELECT COUNT(*) WHERE isActive=true`, `SELECT COUNT(*) WHERE isActive=false`, `SELECT * FROM users ORDER BY createdAt DESC LIMIT 5` |
| **Response** | `"Jumla ya watumiaji: {total}\nWanaotumia: {active}\nWaliozuiwa: {inactive}\n\nWatumiaji wapya 5:\n  • {name} ({email})\n  • ..."` |

**Code reference**:
```typescript
// business-brain.ts:430-441
if (/watumiaji|users?|watumiaji/.test(lower)) {
  const [total, active, inactive, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { firstName: true, lastName: true, email: true, createdAt: true } }),
  ]);
  ...
}
```

#### 2.2.2 Business Statistics (`/biashara|businesses?|business/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "biashara", "businesses", "takwimu za biashara" |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.business.count()` |
| **DB queries** | 3x `SELECT COUNT(*)` on `businesses` table (total, active, inactive) |
| **Response** | `"Jumla ya biashara: {total}\nZinazotumika: {active}\nHazitumiki: {inactive}"` |

**Code reference**: `business-brain.ts:444-451`

#### 2.2.3 Subscription Statistics (`/subscription|subscriptions|usajili|plan/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "subscription", "usajili", "plan", "hali ya usajili" |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.subscription.count()` |
| **DB queries** | 4x `SELECT COUNT(*)` on `subscriptions` table (total, ACTIVE, EXPIRED, CANCELLED) |
| **Response** | `"Jumla ya usajili: {total}\nWanaoendelea: {active}\nWameisha: {expired}\nWameghairi: {cancelled}"` |

**Code reference**: `business-brain.ts:454-462`

#### 2.2.4 Lead Statistics (`/leads?|lead|wateja watarajiwa/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "leads", "wateja watarajiwa", "lead statistics" |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.lead.count()` |
| **DB queries** | 4x `SELECT COUNT(*)` on `leads` table (total, NEW, CONTACTED, CONVERTED) |
| **Response** | `"Jumla ya leads: {total}\nMpya: {new}\nWamewasiliana: {contacted}\nWamebadilishwa kuwa wateja: {converted}"` |

**Code reference**: `business-brain.ts:465-473`

#### 2.2.5 Workspace Statistics (`/workspace|workspaces|kazi/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "workspace", "workspaces" |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.workspace.count()` |
| **DB queries** | 1x `SELECT COUNT(*)` on `workspaces` |
| **Response** | `"Jumla ya workspaces: {total}"` |

**Code reference**: `business-brain.ts:476-479`

#### 2.2.6 Cross-Business Revenue (`/mauzo|sales?|selling|income/`)

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | "mauzo", "sales", "mapato yote" |
| **Functions executed** | `handlePlatformRequest()` → keyword match → `prisma.sale.count()` + `prisma.sale.aggregate()` |
| **DB queries** | `SELECT COUNT(*) FROM sales`, `SELECT SUM(grandTotal) FROM sales` |
| **Response** | `"Jumla ya mauzo yote: {count}\nMapato yote: Tsh {revenue}"` |

**Code reference**: `business-brain.ts:482-489`

#### 2.2.7 Help / Default

| Aspect | Detail |
|--------|--------|
| **Utterance examples** | Anything not matching above keywords |
| **Response** | Lists all 6 available platform capabilities as help text |

**Code reference**: `business-brain.ts:492-501`

### 2.3 Platform Mode Limitations

1. **No intent parsing** — uses raw `RegExp.test()` on the full input string, not `parseCommand()`
2. **Overlapping keywords** — "users" matches `/users?/` but could also match inside other phrases
3. **No period/date filtering** — all queries are "all time"
4. **No detail beyond counts** — cannot drill into specific users, businesses, etc.
5. **No permission checks** — any authenticated user can query all data
6. **No aggregation** — no daily/weekly/monthly breakdowns
7. **Only 6 keyword handlers** — anything else returns help text
8. **No user role differentiation** — super admin, sales team, and regular users all get same data

---

## 3. Business / Workspace Mode

### 3.1 How Business Mode Is Detected

**File**: `src/features/enkai/components/firdaus-global-listener.tsx:133-142`

```typescript
const mode = segments[0] === "workspaces" ? "workspace" as const : ...;
```

Activated on any route starting with `/workspaces/`.

### 3.2 How Business ID Is Resolved

Three resolution paths in priority order:

**Path 1 — Pathname extraction** (firdaus-global-listener.tsx:159-175):
```typescript
const segments = pathname.split("/").filter(Boolean);
const businessIdx = segments.indexOf("businesses");
if (businessIdx >= 1 && segments[businessIdx - 1] === "workspaces" && segments[businessIdx + 1]) {
  const businessId = segments[businessIdx + 1];
  actions.setBusinessContext({ businessId, userId, mode: "workspace" });
}
```
Extracts from `/workspaces/businesses/{businessId}/...`.

**Path 2 — Auth context** (firdaus-global-listener.tsx:146-156):
```typescript
const key = `${user.id}|${user.currentBusinessId || ""}|${modeRef.current}`;
actions.setBusinessContext({
  userId: user.id,
  businessId: user.currentBusinessId || undefined,
  mode: modeRef.current,
});
```
Uses `user.currentBusinessId` from the auth session.

**Path 3 — Database fallback** (business-brain.ts:59-68):
```typescript
if (!businessId && userId) {
  const userBiz = await prisma.userRole.findFirst({
    where: { userId },
    select: { businessId: true },
  });
  if (userBiz?.businessId) {
    context.businessId = userBiz.businessId;
    return processWithBrain({ ...req, context });
  }
}
```
Queries `userRole` table for any associated business.

### 3.3 How Workspace ID Is Resolved

Workspace ID is **NOT actively resolved** by Firdaus. The `workspaceId` field exists in `AssistantContext` type but is **never set** by `FirdausGlobalListener` or `setBusinessContext()`. No code reads `context.workspaceId`.

### 3.4 How Staff Permissions Are Resolved

**File**: `src/features/enkai/services/permission-service.ts:11-42`

```typescript
async function checkPermission(userId, businessId, requiredPermission): Promise<PermissionCheck> {
  const staff = await prisma.staff.findFirst({
    where: { userId, businessId },
    include: {
      assignments: {
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
    },
  });
  if (!staff) return { allowed: false };

  for (const assignment of staff.assignments) {
    const perms = assignment.role.permissions.map(rp => rp.permission.key);
    if (perms.includes(requiredPermission) || perms.includes("*")) {
      return { allowed: true, role: assignment.role.name };
    }
  }
  return { allowed: false };
}
```

**Resolution flow**:
1. Find `Staff` record by `(userId, businessId)`
2. Load `assignments` → each assignment has a `role` → role has `permissions` → each permission has a `permission` with `key`
3. Check if `requiredPermission` key exists in the role's permissions
4. `"*"` wildcard grants all permissions
5. If no `Staff` record → `{ allowed: false }`

**Critical limitation**: Platform users (super admin, sales team) who have `UserRole` but NOT a `Staff` record will be **denied** for all business operations.

### 3.5 How Page Context Is Resolved

**File**: `src/features/enkai/hooks/use-firdaus.ts:27-67`

```typescript
export function usePageContext(): PageContext {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  // Detects page type:
  if (segments.includes("dashboard")) page = "dashboard";
  else if (segments.includes("sales")) page = "sales";
  else if (segments.includes("inventory")) page = "inventory";
  // ... etc
  // Detects businessId from /workspaces/businesses/[id]
  // Detects entityId + entityType for product/customer/supplier detail pages
}
```

The `PageContext` is passed to `processWithBrain()` but only used for:
- `handleSalesIntent`: uses `pageContext.entityId` as product name if on product detail page
- `handleStockIntent`: same pattern

### 3.6 Business Operations

All operations route through `processWithBrain()` → switch statement (business-brain.ts:113-131).

#### 3.6.1 Sales (`sell`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus nimeuza soda tatu", "Firdaus uza soda moja" |
| **Text commands** | `/sell 3 pcs soda`, `/sell` |
| **Intent detection** | NLU pattern: `/(?:nimeuza|nimewauzia|nimepauza)\s+(\d+)...(.+)/i` or `/uza|fanya mauzo ya.../i` or `/sell|record a sale of.../i` |
| **Workflow steps** | `awaiting_product → awaiting_quantity → awaiting_price → awaiting_payment_method → awaiting_customer → awaiting_store → completed` |
| **DB actions** | `catalogItem.findFirst` (by name/SKU) → check stock ≥ quantity → `sale.create` with items → `inventoryBalance.update` decrement |
| **Audit logging** | `AuditLog.create({ userId, resourceType: "FIRDAUS", resourceId: "sell", ... })` |
| **Memory learning** | Learns `POPULAR_PRODUCT` and `TOP_CUSTOMER` on success |

**Code reference**: `business-brain.ts:300-330` (handler), `tool-registry.ts:137-217` (tool)

#### 3.6.2 Purchases (`add-purchase`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus nimenunua mchele kilo 20 kwa 50000" |
| **Text commands** | `/purchase mchele 20 50000` |
| **Intent detection** | NLU: `/(?:nimenunua|nimeagiza|purchase|nimeleta)\s+(\d+)...(.+?)\s+...?(\d+)/i` |
| **Workflow steps** | `awaiting_supplier → awaiting_supplier_item → awaiting_supplier_quantity → awaiting_supplier_cost → completed` |
| **DB actions** | `catalogItem.findFirst` (or auto-create with 30% markup) → `inventoryBalance.upsert` increment |
| **Audit logging** | Same pattern |
| **Memory learning** | `PREFERRED_SUPPLIER`, `PAYMENT_METHOD` on success |

**Code reference**: `business-brain.ts:332-349`, `tool-registry.ts:357-444`

#### 3.6.3 Expenses (`add-expense`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus nimetumia 50000 kwa mafuta" |
| **Text commands** | `/expense 50000 mafuta` |
| **Intent detection** | NLU: `/(?:nimetumia|nimegharamia|nimelipa|expense)\s+(\d+)...(.+)/i` or `/(?:gharama|expense|matumizi)\s+(\d+)...(.+)/i` |
| **Workflow steps** | `awaiting_description → awaiting_category → awaiting_price → completed` |
| **DB actions** | `classifyExpense(description)` → if procurement-related, asks for allocation confirmation → `expense.create` |
| **Special** | Uses `expense-classifier.ts` to detect procurement costs (transport, loading, customs, storage, packaging, handling) |

**Code reference**: `business-brain.ts:351-377`, `tool-registry.ts:319-354`

#### 3.6.4 Inventory / Stock (`check-stock`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus stock ya maji imebaki ngapi?" |
| **Text commands** | `/stock maji` |
| **Intent detection** | NLU: `/(?:stock|hesabu|bidhaa)\s+(?:ya\s+)?(.+?)\s+(?:zimebaki|imebaki|inabaki)/i` or `/(?:angalia|check)\s+(?:stock|hesabu)...(.+)/i` |
| **Workflow steps** | `awaiting_product → completed` (single step if product provided) |
| **DB actions** | `catalogItem.findFirst` with `balances include location` → sum total stock per location |
| **Audit logging** | Creates audit log |

**Code reference**: `business-brain.ts:379-389`, `tool-registry.ts:39-89`

#### 3.6.5 Stock Transfer (`transfer-stock`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus hamisha stock ya mchele 20 kutoka store A kwenda store B" |
| **Text commands** | `/transfer mchele 20 storeA storeB` |
| **Intent detection** | NLU: `/(?:hamisha|transfer)\s+(?:stock\s+)?...(.+?)\s+(\d+)\s+(?:kutoka|from)\s+(.+?)\s+(?:kwenda|to)\s+(.+)/i` |
| **Workflow steps** | `awaiting_product → awaiting_from_location → awaiting_to_location → awaiting_quantity → completed` |
| **DB actions** | `stockTransfer.create` + `inventoryBalance.update` (decrement source, increment destination) |

**Code reference**: `business-brain.ts:391-410`, `tool-registry.ts:778-837`

#### 3.6.6 Customers (`lookup-customer`, `add-customer`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus tafuta mteja Juma", "Firdaus ongeza mteja Juma 0712345678" |
| **Text commands** | `/customer Juma`, `/add-customer Juma 0712345678` |
| **Intent detection** | NLU: `/(?:tafuta|find|lookup|search)\s+(?:mteja\s+)?(.+)/i` or `/(?:ongeza|add|register)\s+(?:mteja|customer)\s+(.+?)\s+(\+?\d+)/i` |
| **Workflow steps** | No multi-step workflow — direct execution |
| **DB actions** | `customer.findMany` with OR (name/phone/email) → customer list with credit info, or `customer.create` |

**Code reference**: `tool-registry.ts:220-316`

#### 3.6.7 Suppliers (`lookup-supplier`, `add-supplier`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus tafuta msambazaji", "Firdaus ongeza msambazaji Juma 0712345678" |
| **Text commands** | `/supplier Juma`, `/add-supplier Juma 0712345678` |
| **Intent detection** | NLU: `/(?:tafuta|find|lookup)\s+(?:msambazaji|supplier)\s+(.+)/i` or `/(?:ongeza|add)\s+(?:msambazaji|supplier)\s+(.+?)\s+(\+?\d+)/i` |
| **DB actions** | `supplier.findMany` or `supplier.create` |

**Code reference**: `tool-registry.ts:447-510`

#### 3.6.8 Reports (`view-report`)

| Aspect | Detail |
|--------|--------|
| **Voice commands** | "Firdaus ripoti ya mauzo", "Firdaus taarifa ya stock" |
| **Text commands** | `/report sales`, `/report stock`, `/report profit`, `/report expenses` |
| **Intent detection** | NLU: `/(?:ripoti|report|taarifa)\s+(?:ya\s+)?(?:mauzo|sales)/i` → type: "sales", plus patterns for stock/profit/expenses |
| **Report types** | `sales` (count + total revenue), `profit` (revenue, cost, margin), `stock` (item count, value, low stock), `expenses` (count + total), `staff` (placeholder — returns link to staff page) |
| **DB actions** | Sale.findMany (30 days default), Sale with items + costPrice, CatalogItem with balances, Expense.findMany |

**Code reference**: `tool-registry.ts:944-1030`

#### 3.6.9 Other Operations (via Generic Handler)

| Intent | Tool | Params | Permission |
|--------|------|--------|------------|
| `check-price` | `check-price` | item, businessId | `inventory.view` |
| `view-orders` | `view-orders` | businessId, limit (5) | `sales.view` |
| `create-sale` | `create-sale` | items[], customerId, businessId | `sales.create` |
| `create-quotation` | `create-quotation` | customerId, items[], businessId | `sales.create` |
| `create-invoice` | `create-invoice` | customerId, items[], businessId | `sales.create` |
| `create-return` | `create-return` | saleId, items[], businessId | `sales.create` |
| `adjust-stock` | `adjust-stock` | itemId, quantity, locationId, businessId | `inventory.adjust` |
| `create-purchase-order` | `create-purchase-order` | supplierId, items[], businessId | `purchases.create` |
| `check-wallet` | `check-wallet` | businessId | none |
| `check-staff` | `check-staff` | name?, businessId | none |
| `business-insights` | dynamic import | businessId | none |
| `send-notification` | `send-notification` | userId, title, message, businessId | none |
| `send-email` | `send-email` | to, subject, html | none |

---

## 4. Current Wake Word System

### 4.1 Source File

`src/features/enkai/components/firdaus-global-listener.tsx`

### 4.2 Current Wake Word Regex

**Line 55**:
```typescript
const wakeWords = /firdaus|ferdaus|fir daus|ridausi?|dausi?|siridausi?/i;
```

### 4.3 Supported Variations

| Variation | Matched | Why |
|-----------|---------|-----|
| "firdaus" | ✅ | Exact match |
| "Firdaus" | ✅ | Case-insensitive `/i` |
| "FERDAUS" | ✅ | Case-insensitive `/i` |
| "ferdaus" | ✅ | `ferdaus` alternative |
| "fir daus" | ✅ | Space variant |
| "ridausi" | ✅ | `ridausi?` — `i` is optional |
| "ridaus" | ✅ | Without `i` |
| "dausi" | ✅ | `dausi?` — `i` optional |
| "daus" | ✅ | Without `i` |
| "siridausi" | ✅ | `siridausi?` |
| "siridaus" | ✅ | Without `i` |

### 4.4 Unsupported Variations

| Variation | Why Not Matched |
|-----------|----------------|
| "Hey Firdaus" | Regex doesn't check for "Hey" prefix; `"hey firdaus".test(regex)` → **YES actually it does match** because regex is /firdaus|.../i and "firdaus" is contained within "hey firdaus". |
| "Halo Firdaus" | Same — matches because "firdaus" is substring |
| "Firdaus nisaidie" | Same — matches because "firdaus" is substring |
| "Firdausi" | ❌ **NOT matched** — regex has `siridausi?` and `ridausi?` but NOT `firdausi` |
| "Fidaus" | ❌ **NOT matched** — missing 'r' |
| "Fidausi" | ❌ **NOT matched** — missing 'r' |
| "Hei Firdaus" | ✅ Matches (substring "firdaus" present) |
| "Ferdausi" | ❌ **NOT matched** — regex has `ferdaus` but NOT `ferdausi` |

The substring matching means many prefixes/suffixes "work accidentally" — the actual word "firdaus" just needs to appear anywhere in the transcript.

### 4.5 Cooldown Behavior

**There is NO cooldown**. The code processes all results and alternatives:

```typescript
recognition.onresult = (event) => {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    for (let j = 0; j < result.length; j++) {
      const alternative = result[j];
      // ... checks wake word on EVERY alternative
      // ... if matched, calls a.sendMessage() or a.wake()
      // ... RETURN only exits the innermost loop, NOT the outer loops
    }
  }
};
```

**Bug risk**: The `return;` on line 66 only exits the innermost `for` loop (j), not the outer loop (i). If multiple results have the wake word, it can fire multiple times.

### 4.6 SpeechRecognition Configuration

```typescript
recognition.lang = "sw";              // Swahili
recognition.continuous = true;        // Stay alive across silence
recognition.interimResults = true;    // Fire on partial results
recognition.maxAlternatives = 5;      // Get 5 best guesses
```

### 4.7 maxAlternatives Usage

Set to `5` but **confidence is never checked**. All alternatives are iterated equally. The `alternative.confidence` field (defined in `speech-recognition.d.ts:26`) is never accessed.

### 4.8 Confidence Handling

**NONE**. There is no minimum confidence threshold for:
- Wake word detection (any regex match fires)
- Command execution (any text after wake word is sent to brain)
- No confirmation dialog for low-confidence matches

### 4.9 Auto-Restart Behavior

```typescript
recognition.onerror = (event) => {
  if (event.error === "aborted") return;     // Silent skip
  recognitionRef.current = null;
  if (event.error === "not-allowed") {
    setPermissionDenied(true);               // Show permission button
    return;
  }
  restartTimer.current = setTimeout(() => {
    if (mountedRef.current) startRecognition();
  }, 300);                                    // Restart after 300ms
};

recognition.onend = () => {
  recognitionRef.current = null;
  if (permissionDenied || !mountedRef.current) return;
  restartTimer.current = setTimeout(() => {
    if (mountedRef.current) startRecognition();
  }, 300);                                    // Restart after 300ms
};
```

- **Error**: Restarts after 300ms (unless `aborted` or `not-allowed`)
- **End**: Restarts after 300ms (unless permission denied or unmounted)
- **Permission denied**: Shows amber button "Bonyeza kuruhusu mikrofoni"
- **Unsupported**: Shows gray dot "Firdaus voice unavailable in this browser"

### 4.10 Complete Wake Word Flow

```
User speaks → "heyi firdaus ongeza maji"
  │
  ▼
SpeechRecognition.onresult fires
  │
  ▼
For each result (from resultIndex):
  For each alternative (0..maxAlternatives):
    transcript = "heyi firdaus ongeza maji".toLowerCase()
    wakeWords.test(transcript) → TRUE (contains "firdaus")
    if (!isFinal) continue;  ← Only acts on final results
    cleaned = "ongeza maji"  ← removes wake word
    actionsRef.current.sendMessage("ongeza maji")
    return (← exits only j-loop, not i-loop)
  │
  ▼
sendMessage("ongeza maji") → processWithBrain
  → parseCommand("ongeza maji")
  → NLU: no pattern matches "ongeza maji" (ongeza is not mapped to ADD_STOCK)
  → intent: "unknown"
  → returns "Samahani, sikuelewa..."
```

**Problem**: "ongeza maji" should map to `ADD_STOCK` but there's no NLU pattern for stock addition. The `voice-service.ts` has replacement `stock ya X imebaki` but no `ongeza stock` pattern.

---

## 5. Current Voice System

### 5.1 Source Files

- `src/features/enkai/provider/firdaus-provider.tsx` — TTS (speak function)
- `src/features/enkai/components/firdaus-global-listener.tsx` — STT (SpeechRecognition)
- `src/features/enkai/voice/voice-service.ts` — Server-side voice pattern normalization
- `src/types/speech-recognition.d.ts` — TypeScript type declarations

### 5.2 Voice Selection Strategy

**File**: `src/features/enkai/provider/firdaus-provider.tsx:89-114`

```typescript
const best = voices.find(v => v.lang.startsWith("sw") && v.name.includes("Google"))
  || voices.find(v => v.lang.startsWith("sw"))
  || voices.find(v => v.lang.startsWith("en") && v.name.includes("Google"))
  || voices.find(v => v.lang.startsWith("en-US"))
  || voices[0];
```

**Priority**:
1. Google Swahili (`sw-*` + "Google" in name)
2. Any Swahili voice (`sw-*`)
3. Google English (`en-*` + "Google")
4. US English (`en-US`)
5. First available voice

### 5.3 Swahili Voice Support

**Real-world availability**:
| Platform | Swahili Voices | Notes |
|----------|---------------|-------|
| Chrome Linux | ❌ None | Falls through to en-US |
| Chrome macOS | ⚠️ sw-KE only | Kenya Swahili, may mispronounce TZ terms |
| Chrome Windows | ✅ Google sw-TZ | Best experience |
| Chrome Android | ✅ Google sw-TZ | Best mobile experience |
| Firefox (any) | ❌ None | Uses OS voices |
| Safari macOS | ⚠️ Limited | Depends on macOS version |
| Edge Windows | ✅ Microsoft sw-KE | Different pronunciation |

### 5.4 English Fallback

When no Swahili voice exists (common on Linux/desktop):
1. Falls to Google English voice
2. Falls to en-US voice
3. Falls to first available

**Result**: Firdaus speaks Swahili words with English phonemes, causing mispronunciation of:
- `gh` sounds → English doesn't have voiced velar fricative
- `ng'` → English splits as "n-g" instead of velar nasal
- Vowels → English has 20+ vowel sounds, Swahili has 5 pure vowels
- Numbers → English voice reads digits, not Swahili number words

### 5.5 Speech Synthesis Flow

```typescript
speak(text) {
  window.speechSynthesis.cancel();               // Cancel previous
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = best?.lang || "en-US";         // Set language
  utterance.rate = 0.8;                           // Slow pace
  utterance.pitch = 1.05;                         // Slightly higher
  utterance.volume = 1;                           // Full volume
  if (best) utterance.voice = best;               // Set voice
  utterance.onstart = () => setState({ isSpeaking: true });
  utterance.onend = () => setState({ isSpeaking: false });
  utterance.onerror = (e) => {
    console.warn("[Firdaus] SpeechSynthesis error:", e);
    setState({ isSpeaking: false });
  };
  window.speechSynthesis.speak(utterance);
}
```

### 5.6 Speech Recognition Flow

```typescript
startRecognition() {
  const recognition = new SpeechRecognition();
  recognition.lang = "sw";
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;

  recognition.onresult = handle results + wake word check;
  recognition.onerror = handle error + restart;
  recognition.onend = restart;

  recognition.start();
}
```

### 5.7 Voice Service (Server-Side)

**File**: `src/features/enkai/voice/voice-service.ts`

Contains 16 text normalization patterns that convert Swahili/English phrases to slash commands:

| Input Pattern | Output | Purpose |
|--------------|--------|---------|
| `stock ya (.+) imebaki` | `/stock $1` | Stock query |
| `stock ya (.+) zimebaki` | `/stock $1` | Stock query (plural) |
| `nimeuza` | `/sell` | Sell command |
| `nimenunua` | `/purchase` | Purchase command |
| `nimetumia` | `/expense` | Expense command |
| `nimegharamia` | `/expense` | Expense (synonym) |
| `nimelipa` | `/expense` | Expense (paid) |
| `tafuta mteja` | `/customer` | Customer lookup |
| `tafuta msambazaji` | `/supplier` | Supplier lookup |
| `ongeza mteja` | `/add-customer` | Add customer |
| `ongeza msambazaji` | `/add-supplier` | Add supplier |
| `bei ya (.+)` | `/price $1` | Price check |
| `ripoti ya (.+)` | `/report $1` | Report |
| `taarifa ya (.+)` | `/report $1` | Report (synonym) |
| `hamisha stock` | `/transfer` | Stock transfer |
| `angalia pochi` | `/wallet` | Wallet check |
| `maarifa ya biashara` | `/insights` | Business insights |

**Important**: This service is **server-only** (`import "server-only"` at line 1) but processes voice input patterns. The `processVoiceAction` server action in `service-actions.ts` can call it, but the main wake word flow in `firdaus-global-listener.tsx` does NOT use it — text is sent directly to `sendMessage()` without voice pattern normalization.

---

## 6. Current Command Parser

### 6.1 Source File

`src/features/enkai/commands/command-parser.ts`

### 6.2 All Intents (27 total)

Defined in `src/features/enkai/commands/types.ts:1-27`:

```typescript
export type IntentType =
  | "sell" | "check-stock" | "create-sale" | "check-price"
  | "lookup-customer" | "add-customer" | "check-staff"
  | "view-orders" | "create-order" | "view-report" | "help"
  | "add-expense" | "add-purchase" | "lookup-supplier" | "add-supplier"
  | "transfer-stock" | "adjust-stock" | "check-wallet"
  | "create-purchase-order" | "create-quotation" | "create-invoice"
  | "create-return" | "send-notification" | "setup-business"
  | "business-insights" | "unknown";
```

### 6.3 All Slash Commands (17 total)

| Slash | Intent | Params | Permission |
|-------|--------|--------|------------|
| `/sell` | `sell` | quantity, item | `sales.create` |
| `/stock` | `check-stock` | item | `inventory.view` |
| `/price` | `check-price` | item | `inventory.view` |
| `/customer` | `lookup-customer` | phone | `customers.view` |
| `/add-customer` | `add-customer` | name, phone | `customers.create` |
| `/supplier` | `lookup-supplier` | name | none |
| `/add-supplier` | `add-supplier` | name, phone | `purchases.create` |
| `/staff` | `check-staff` | name | none |
| `/orders` | `view-orders` | none | `sales.view` |
| `/order` | `create-order` | item, quantity | `purchases.create` |
| `/expense` | `add-expense` | amount, description | `expenses.create` |
| `/purchase` | `add-purchase` | item, quantity, cost | `purchases.create` |
| `/transfer` | `transfer-stock` | item, quantity | `inventory.transfer` |
| `/insights` | `business-insights` | none | none |
| `/wallet` | `check-wallet` | none | none |
| `/report` | `view-report` | type | none |
| `/help` | `help` | none | none |

### 6.4 All NLU Patterns (23 total)

| # | Pattern (regex) | Intent | Confidence | Example Match |
|---|-----------------|--------|------------|---------------|
| 1 | `/(?:nimeuza\|nimewauzia\|nimepauza)\s+(\d+)...(.+)/i` | `sell` | 0.7 | "nimeuza 3 soda" |
| 2 | `/(?:uza\|fanya mauzo ya\|record sale of)\s+(\d+)...(.+)/i` | `sell` | 0.7 | "uza 2 maji" |
| 3 | `/(?:sell\|record)\s+(?:a\s+)?(?:sale\s+of\s+)?(\d+)...(.+)/i` | `sell` | 0.7 | "sell 3 bottles of soda" |
| 4 | `/(?:stock\|hesabu\|bidhaa)\s+(?:ya\s+)?(.+?)\s+(?:zimebaki\|imebaki\|inabaki)/i` | `check-stock` | 0.7 | "stock ya maji imebaki" |
| 5 | `/(?:angalia\|check)\s+(?:stock\|hesabu)\s+(?:ya\s+\|for\s+)?(.+)/i` | `check-stock` | 0.7 | "angalia stock ya maji" |
| 6 | `/(?:check\|what'?s?\|how much)\s+(?:stock\|inventory\|the stock)\s+(?:of\s+\|for\s+)?(.+)/i` | `check-stock` | 0.7 | "check stock of maji" |
| 7 | `/(?:bei\|gharama\|price)\s+(?:ya\s+)?(.+)/i` | `check-price` | 0.7 | "bei ya mchele" |
| 8 | `/(?:check\|what'?s?\|how much)\s+(?:price\|the price)\s+(?:of\s+\|for\s+)?(.+)/i` | `check-price` | 0.7 | "check price of mchele" |
| 9 | `/(?:tafuta\|find\|lookup\|search)\s+(?:mteja\s+)?(.+)/i` | `lookup-customer` | 0.7 | "tafuta mteja Juma" |
| 10 | `/(?:ongeza\|add\|register)\s+(?:mteja\|customer)\s+(.+?)\s+(\+?\d+)/i` | `add-customer` | 0.7 | "ongeza mteja Juma 0712" |
| 11 | `/(?:nimetumia\|nimegharamia\|nimelipa\|expense)\s+(\d+)...(.+)/i` | `add-expense` | 0.7 | "nimetumia 50000 mafuta" |
| 12 | `/(?:gharama\|expense\|matumizi)\s+(?:ya\s+)?(\d+)...(.+)/i` | `add-expense` | 0.7 | "gharama ya 30000 usafiri" |
| 13 | `/(?:nimenunua\|nimeagiza\|purchase\|nimeleta)\s+(\d+)...(.+?)\s+...?(\d+)/i` | `add-purchase` | 0.7 | "nimenunua 20 mchele 50000" |
| 14 | `/(?:tafuta\|find\|lookup)\s+(?:msambazaji\|supplier)\s+(.+)/i` | `lookup-supplier` | 0.7 | "tafuta msambazaji Juma" |
| 15 | `/(?:ongeza\|add)\s+(?:msambazaji\|supplier)\s+(.+?)\s+(\+?\d+)/i` | `add-supplier` | 0.7 | "ongeza msambazaji Juma 0712" |
| 16 | `/(?:ripoti\|report\|taarifa)\s+(?:ya\s+)?(?:mauzo\|sales)/i` | `view-report` | 0.7 | "ripoti ya mauzo" |
| 17 | `/(?:ripoti\|report\|taarifa)\s+(?:ya\s+)?(?:stock\|hesabu)/i` | `view-report` | 0.7 | "ripoti ya stock" |
| 18 | `/(?:ripoti\|report\|taarifa)\s+(?:ya\s+)?(?:faida\|profit)/i` | `view-report` | 0.7 | "ripoti ya faida" |
| 19 | `/(?:ripoti\|report\|taarifa)\s+(?:ya\s+)?(?:gharama\|expense)/i` | `view-report` | 0.7 | "ripoti ya gharama" |
| 20 | `/(?:create\|make\|add)\s+(?:a\s+)?(?:sale\|order)\s+(?:for\s+\|of\s+)?(.+)/i` | `create-sale` | 0.7 | "create sale for soda" |
| 21 | `/(?:hamisha\|transfer)\s+(?:stock\s+)?(?:ya\s+)?(.+?)\s+(\d+)\s+(?:kutoka\|from)\s+(.+?)\s+(?:kwenda\|to)\s+(.+)/i` | `transfer-stock` | 0.7 | "hamisha mchele 20 kutoka A kwenda B" |
| 22 | `/(?:maarifa\|insights\|intelligence\|uelewa)\s+(?:ya\s+)?(?:biashara\|business)/i` | `business-insights` | 0.7 | "maarifa ya biashara" |
| 23 | `/(?:biashara\|business)\s+(?:inaendelea\|ikoje\|status)/i` | `business-insights` | 0.7 | "biashara ikoje" |

### 6.5 Unsupported Natural Language Patterns

These common Tanzanian business phrases have NO matching pattern:

| Phrase | Should Map To | Why Missing |
|--------|--------------|-------------|
| "ongeza maji" | ADD_STOCK | No "ongeza" → add-stock pattern |
| "toa soda" | SELL | "toa" is not in any pattern |
| "soda zimetoka" | SELL | "zimetoka" not recognized |
| "zinaisha nini" | LOW_STOCK | No "zinaisha" pattern |
| "wadeni" | DEBT_REPORT | No debt report intent |
| "nipe mauzo ya leo" | REPORT_TODAY | "nipe" + "leo" not handled |
| "leo nimeuza kiasi gani" | DAILY_SALES | Not matched |
| "mteja anadaiwa" | CUSTOMER_DEBT | No debt intent |
| "mzigo umebaki ngapi" | STOCK_QUERY | "mzigo" not synonym for stock |
| "rekodi mauzo ya soda" | SELL | "rekodi" not in sell patterns |
| "punguza soda moja" | SELL | "punguza" not recognized |
| "mteja amechukua soda" | SELL | Not recognized |

---

## 7. Current Business Brain

### 7.1 Source File

`src/features/enkai/brain/business-brain.ts` (522 lines)

### 7.2 Main Orchestration Flow

```
processWithBrain(req: BrainRequest): BrainResponse
  │
  ├─ [1] MODE CHECK ───────────── platform → handlePlatformRequest()
  │
  ├─ [2] BUSINESS RESOLUTION ──── !businessId && userId → userRole.findFirst
  │                                !businessId → return error
  │
  ├─ [3] ACTIVE WORKFLOW ──────── getActiveWorkflow() → handleActiveWorkflow()
  │
  ├─ [4] COMMAND PARSING ──────── parseCommand(input) → {intent, confidence, params}
  │                                intent === "unknown" → check DB workflow → return error
  │
  ├─ [5] PERMISSION CHECK ─────── checkPermission(userId, businessId, intent)
  │                                !allowed → return error
  │
  ├─ [6] INTENT ROUTING ───────── switch(intent):
  │                                sell → handleSalesIntent()
  │                                add-purchase → handlePurchaseIntent()
  │                                add-expense → handleExpenseIntent()
  │                                check-stock → handleStockIntent()
  │                                transfer-stock → handleTransferIntent()
  │                                default → handleGenericIntent()
  │
  ├─ [7] AUDIT LOG ────────────── createAuditLog(context, intent, input, message)
  │
  └─ [8] MEMORY LEARNING ──────── if success → learnPattern(POPULAR_PRODUCT/TOP_CUSTOMER)
```

### 7.3 Routing Logic

**Platform routing** (line 55-56):
- Mode `"platform"` → `handlePlatformRequest()` — bypasses all permission/workflow/parser checks
- Returns immediately — no further processing

**Workspace routing** (lines 59-146):
- Resolves business ID if missing
- Checks active workflows
- Parses command
- Checks permissions
- Routes by intent type

### 7.4 Permission Checks

**File**: `business-brain.ts:104-109`

```typescript
const hasPerm = await checkPermission(userId, businessId, parsed.intent);
if (!hasPerm.allowed) {
  return {
    message: "Samahani, huna ruhusa ya kufanya operesheni hiyo. Tafadhali wasiliana na msimamizi wa mfumo.",
  };
}
```

The intent string (e.g., `"sell"`, `"check-stock"`) is passed as the `requiredPermission` parameter to `checkPermission()`. This means the **intent name must match a permission key** in the database.

**Permission keys used**:
| Intent | Permission Key |
|--------|---------------|
| `sell` | `"sell"` |
| `check-stock` | `"check-stock"` |
| ... | ... (same as intent name) |

### 7.5 Workflow Execution

**Active workflow check** (lines 88-91):
```typescript
const activeWf = await getActiveWorkflow(businessId, userId);
if (activeWf && activeWf.status !== "COMPLETED") {
  return handleActiveWorkflow(activeWf, input, context);
}
```

**Workflow sequences** (lines 220-228):
```
sales:     awaiting_product → awaiting_quantity → awaiting_price → awaiting_payment_method → awaiting_customer → awaiting_store → completed
purchases: awaiting_supplier → awaiting_supplier_item → awaiting_supplier_quantity → awaiting_supplier_cost → completed
expenses:  awaiting_description → awaiting_category → awaiting_price → completed
inventory: awaiting_product → awaiting_from_location → awaiting_to_location → awaiting_quantity → completed
business_setup: awaiting_business_name → awaiting_business_type → awaiting_branch_name → completed
```

### 7.6 Memory Usage

Memory is used in TWO places:

1. **Sales response enhancement** (lines 321-328):
```typescript
if (result.success) {
  const memory = await getBusinessMemory(context.businessId || "");
  return {
    message: `Mauzo yamekamilika.\n${result.message}` +
      (memory.topProducts?.length ? `\n\nBidhaa zinazotamba: ${memory.topProducts.slice(0, 3).join(", ")}` : ""),
    data: result.data,
  };
}
```

2. **Pattern learning on success** (lines 135-144):
```typescript
if (response.message.includes("yamekamilika") || ...) {
  // Learn POPULAR_PRODUCT and TOP_CUSTOMER
}
```

### 7.7 Audit Logging

**File**: `business-brain.ts:504-522`

```typescript
async function createAuditLog(context, action, input, response) {
  await prisma.auditLog.create({
    data: {
      userId: context.userId,
      resourceType: "FIRDAUS",
      resourceId: action,
      action,
      before: { input },
      after: { response, timestamp: new Date().toISOString() },
    },
  });
}
```

Audit is created for EVERY processed intent (except platform mode queries and unknown intents).

### 7.8 Sequence Diagram

```
User                  FirdausGlobal        FirdausProvider      Server Actions        Business Brain          Database
 │                        │                    │                    │                     │                    │
 │  "Firdaus nimeuza      │                    │                    │                     │                    │
 │  soda moja"            │                    │                    │                     │                    │
 │───────────────────────▶│                    │                    │                     │                    │
 │                        │  wake word match   │                    │                     │                    │
 │                        │───────────────────▶│                    │                     │                    │
 │                        │  sendMessage()     │                    │                     │                    │
 │                        │───────────────────▶│                    │                     │                    │
 │                        │                    │  sendMessageAction │                     │                    │
 │                        │                    │───────────────────▶│                     │                    │
 │                        │                    │                    │  processMessage()   │                    │
 │                        │                    │                    │────────────────────▶│                    │
 │                        │                    │                    │                     │  processWithBrain()│
 │                        │                    │                    │                     │───────────────────▶│
 │                        │                    │                    │                     │                    │
 │                        │                    │                    │                     │─ parseCommand()    │
 │                        │                    │                    │                     │─ checkPermission() │────▶ Staff
 │                        │                    │                    │                     │                    │◀────┘
 │                        │                    │                    │                     │─ handleSalesIntent│
 │                        │                    │                    │                     │  → sell tool      │────▶ Sale/Catalog
 │                        │                    │                    │                     │                    │◀────┘
 │                        │                    │                    │                     │─ createAuditLog()  │────▶ AuditLog
 │                        │                    │                    │                     │─ learnPattern()    │────▶ BusinessMemory
 │                        │                    │                    │                     │◀───────────────────│
 │                        │                    │                    │  ◀──────────────────│                    │
 │                        │                    │  ◀─────────────────│                     │                    │
 │                        │                    │  speak(response)   │                     │                    │
 │                        │                    │───────────────────▶│ (browser TTS)       │                    │
 │◀───────────────────────│────────────────────│                    │                     │                    │
 │  "Mauzo yamekamilika:  │                    │                    │                     │                    │
 │   1 x Soda = TZS 1500  │                    │                    │                     │                    │
 │   Bidhaa zinazotamba:  │                    │                    │                     │                    │
 │   Maji, Soda, Mchele"  │                    │                    │                     │                    │
```

---

## 8. Current Memory System

### 8.1 Source Files

- `src/features/enkai/brain/memory-service.ts` — Business memory with caching
- `src/features/enkai/memory/memory-store.ts` — In-memory session storage

### 8.2 Memory Types (BusinessMemory)

**Prisma enum** (`prisma/schema.prisma:2486-2493`):
```typescript
enum MemoryType {
  PREFERRED_SUPPLIER
  TOP_CUSTOMER
  COMMON_EXPENSE
  POPULAR_PRODUCT
  PAYMENT_METHOD
  FREQUENT_PRODUCT
}
```

**TypeScript interface** (`memory-service.ts:5-14`):
```typescript
interface BusinessMemory {
  topProducts: string[];
  topCustomers: string[];
  topSuppliers: string[];
  preferredPaymentMethods: string[];
  recentExpenseCategories: string[];
  totalSales?: number;
  totalExpenses?: number;
  totalCustomers?: number;
}
```

### 8.3 Learning Rules

| MemoryType | Learned From | Trigger Code | Confidence Start | Increment | Max |
|-----------|-------------|--------------|-----------------|-----------|-----|
| `POPULAR_PRODUCT` | `handleSalesIntent` success | `business-brain.ts:138` | 0.3 | +0.1 | 1.0 |
| `TOP_CUSTOMER` | `handleSalesIntent` success (with customer) | `business-brain.ts:141` | 0.3 | +0.1 | 1.0 |
| `PREFERRED_SUPPLIER` | Workflow purchase completion | `business-brain.ts:191` | 0.3 | +0.1 | 1.0 |
| `PAYMENT_METHOD` | Workflow completion with payment_method | `business-brain.ts:192` | 0.3 | +0.1 | 1.0 |
| `COMMON_EXPENSE` | Workflow expense completion | `business-brain.ts:192` (implied) | 0.3 | +0.1 | 1.0 |
| `FREQUENT_PRODUCT` | **NEVER** | Defined in type but no code writes it | — | — | — |

### 8.4 Cache Logic

```typescript
const cache = new Map<string, { data: BusinessMemory; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

getBusinessMemory(businessId) {
  const cached = cache.get(businessId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  // ... recompute ...
  cache.set(businessId, { data: memory, timestamp: Date.now() });
  return memory;
}
```

**Cache invalidation**: Only happens when `learnPattern()` is called (adds/deletes cache entry).

### 8.5 Retrieval Logic

```typescript
getBusinessMemory(businessId) {
  // 1. Check cache
  // 2. If stale/missing → computeLiveMemory() + getLearnedMemory() in parallel
  // 3. Merge with Set dedup, slice(0, 10)
  // 4. Cache result
  // 5. Return
}

computeLiveMemory(businessId) {     // 10+ DB queries in parallel
  // - Top 5 products by sale quantity (saleItem.groupBy)
  // - Top 5 customers by sale total (sale.groupBy)
  // - Recent 5 supplier names (purchaseOrder.findMany)
  // - Recent 10 payment methods (payment.findMany)
  // - Top 5 expense categories (expense.groupBy)
  // - Customer count
  // - Sales total (aggregate)
  // - Expense total (aggregate)
  // - Resolve product IDs → names (catalogItem.findMany)
  // - Resolve customer IDs → names (customer.findMany)
}

getLearnedMemory(businessId) {
  // Query BusinessMemory table, order by confidence desc, limit 30
  // Filter by type into respective arrays
}
```

### 8.6 Memory Influence on Responses

Memory is only used in ONE place:

**Sales success response** (`business-brain.ts:322-326`):
```typescript
const memory = await getBusinessMemory(context.businessId || "");
return {
  message: `Mauzo yamekamilika.\n${result.message}` +
    (memory.topProducts?.length
      ? `\n\nBidhaa zinazotamba: ${memory.topProducts.slice(0, 3).join(", ")}`
      : ""),
};
```

No other response type uses memory. No intent parsing uses memory. No vocabulary uses memory.

### 8.7 Session Memory (MemoryStore)

**File**: `src/features/enkai/memory/memory-store.ts`

```typescript
class MemoryStore {
  private sessions: Map<string, SessionStore>;
  private maxMessagesPerSession = 100;

  getOrCreateSession(sessionId) → SessionStore
  addMessage(sessionId, message) → void
  getHistory(sessionId) → AssistantMessage[]
  getRecentMessages(sessionId, count) → AssistantMessage[]
  setContext(sessionId, key, value) → void
  getContext(sessionId, key) → unknown
  clear(sessionId) → void
  clearAll() → void
  getStats() → { totalSessions, totalMessages }
}
```

- **In-memory** — lost on server restart
- **Max 100 messages** per session (oldest dropped)
- **Used by**: `assistant-service.ts` `processMessage()`, `getSessionHistory()`, `clearSession()`
- Not used by business brain or any other service

---

## 9. Current Business Vocabulary Support

### 9.1 Does Industry-Specific Vocabulary Exist?

**NO**. There is no industry-specific vocabulary anywhere in the codebase.

The `business.industry_mode` field exists in the database but is:
- **Never read** by Firdaus
- **Never used** to influence vocabulary, intent parsing, or responses
- **Never checked** during any code path

### 9.2 Is Business Type Used During Parsing?

**NO**. The `parseCommand()` function has zero awareness of business type. The same 23 NLU patterns are applied to every business regardless of whether it's a retail shop, pharmacy, restaurant, or hardware store.

### 9.3 Is Business Type Used During Responses?

**NO**. All response templates are generic Swahili. A pharmacy and a restaurant receive identical vocabulary:
- "Bidhaa gani?" (for both, even though a pharmacy would say "Dawa gani?")
- "Njia ya malipo?" (same for all)
- "Stock ya X imebaki" (same for all, even hardware vs grocery)

### 9.4 Is Business Type Used During Voice Interactions?

**NO**. SpeechRecognition language is always `"sw"`. Wake word is always the same regex. No business-type-specific voice patterns exist.

### 9.5 What Code Paths Exist Today?

**Code path 1 — Database schema**: `prisma/schema.prisma` has `Business.type` field (line 325+), and possibly an `industry_mode` field. This data exists but is not queried by Firdaus.

**Code path 2 — No service layer**: There is no `getBusinessType()` or `getIndustryMode()` service called by Firdaus. The `prisma.business.findUnique()` is never called to get business type.

**Code path 3 — No vocabulary switching**: There is no `if (type === "pharmacy") use pharmacy vocabulary` conditional anywhere.

### 9.6 Exact Finding

| Question | Answer | Evidence |
|----------|--------|----------|
| Industry-specific vocabulary exists? | ❌ No | No vocabulary map, no industry terms in codebase |
| Business type checked during parsing? | ❌ No | `parseCommand()` receives only `input: string`, no context |
| Business type checked during responses? | ❌ No | All responses from templates, no branching by type |
| Business type checked during voice? | ❌ No | SpeechRecognition config is same for all businesses |
| Any code references business type? | ⚠️ Minimal | `prisma.business` exists but Firdaus never queries it |
| Any vocabulary switching infrastructure? | ❌ No | No vocabulary map, no switch statements, no conditional logic |

---

## 10. Current Limitations

### 10.1 Wake Word Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 1 | No fuzzy matching | `firdaus-global-listener.tsx:55` — single regex | "Fidaus", "Firdausi" not matched |
| 2 | No "Hey Firdausi" variant | No pattern for "Firdausi" (with 'i' suffix) | User saying "Firdausi" not detected |
| 3 | No "Ferdausi" variant | Regex has `ferdaus` but not `ferdausi` | User saying "Ferdausi" not detected |
| 4 | No confidence threshold | `alternative.confidence` never read | Any match at any confidence fires |
| 5 | No dedup | `return` only exits j-loop, not i-loop | Can fire multiple times per utterance |
| 6 | No cooldown timer | No timestamp-based throttle | Rapid re-trigger possible |
| 7 | Only fires on `isFinal` | Line 57: `if (!isFinal) continue;` | Slow response — must wait for speech end |

### 10.2 Speech Recognition Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 8 | `maxAlternatives: 5` but unused | Line 38 set, line 46 loops, but confidence (line 26 in types) never read | All alternatives treated equally |
| 9 | No language confidence checking | Browser returns confidence per alternative, ignored | Cannot distinguish "firdaus" from noise |
| 10 | No background noise handling | No noise threshold configuration | False wake triggers possible |
| 11 | Chrome Linux no Swahili STT | OS/browser limitation | Poor recognition accuracy on desktop |

### 10.3 TTS / Speech Synthesis Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 12 | No Swahili TTS on desktop | Chrome Linux has zero Swahili voices | English-accented Swahili speech |
| 13 | No SSML support | `utterance.text` is plain string | No prosody, emphasis, or pauses |
| 14 | No number-to-Swahili conversion | `utterance.text` = raw message string | "TZS 15000" read as digits, not "elfu kumi na tano" |
| 15 | No long-response chunking | Single `utterance` for whole text | Browser may truncate long responses |
| 16 | No server-side TTS fallback | Only browser SpeechSynthesis | No reliable Kiswahili voice available |

### 10.4 Language Understanding Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 17 | Only 23 NLU patterns | `command-parser.ts:170-308` | 50%+ natural queries fail |
| 18 | No synonym engine | Each intent = 1-3 exact regex patterns | "nimetoa soda" ≠ "nimeuza soda" |
| 19 | No Swahili number words | Patterns use `\d+` only | "soda tatu" → quantity=NaN |
| 20 | No multi-intent resolution | First pattern match wins, no scoring | Wrong intent for ambiguous phrases |
| 21 | "Book Swahili" responses | `prompts.ts` — formal literary Swahili | Sounds unnatural to Tanzanian users |
| 22 | No casual Tanzanian responses | No "boss", "nipo", "poa" usage | Feels robotic, not local |

### 10.5 Vocabulary Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 23 | No industry vocabulary | No vocabulary map files | Pharmacy and restaurant get same words |
| 24 | No business type awareness | `business.type` never queried | Cannot adapt to retail/wholesale/pharmacy |
| 25 | No term learning from voice | `learnPattern()` only from completed workflows | New business terms not learned |
| 26 | `FREQUENT_PRODUCT` dead code | `memory-service.ts:139` — defined but never called | Wasted schema + code |

### 10.6 Memory Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 27 | No memory influence on parsing | `parseCommand()` has no memory parameter | Learned patterns don't improve recognition |
| 28 | No vocabulary in memory | Only product/customer/supplier/payment/expense | Business-specific terms not stored |
| 29 | Cache never invalidated on writes | Only invalidated on `learnPattern()` | Stale data for 5 minutes after sales/purchases |

### 10.7 Platform Mode Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 30 | No permission checks | `handlePlatformRequest()` skips `checkPermission()` | Any user can see all data |
| 31 | No period filtering | All queries are "all time" | Cannot ask "watumiaji wa mwezi huu" |
| 32 | Only 6 keyword handlers | 6 `RegExp.test()` checks | Most platform queries return help text |
| 33 | No aggregation | Only COUNT(s) and latest 5 | No daily/weekly/monthly breakdowns |

### 10.8 Permission Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 34 | Only checks Staff table | `permission-service.ts:19` — `prisma.staff.findFirst` | Platform users (UserRole) denied for business ops |
| 35 | Intent = permission key | `checkPermission(userId, businessId, parsed.intent)` — line 104 | Permission keys must match intent names |
| 36 | No `UserRole` table check | `prisma.userRole` never queried for permissions | Super admin has no Firdaus permissions |

### 10.9 Workflow Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 37 | Duplicate workflow on completion | `business-brain.ts:179` — `getOrCreateWorkflow()` called after `validateWorkflow()` | Orphan workflow records |
| 38 | In-memory workflow for some types | `workflow-engine.ts` — customers, suppliers, user_creation | Lost on page refresh |
| 39 | Only 5 persistent workflow types | `business-brain.ts:221-227` | No workflow for returns, quotations, invoices |
| 40 | No workflow cancellation | No `cancelWorkflow()` function | Stuck workflows stay in DB |

### 10.10 Business Intelligence Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 41 | Revenue Intelligence not voice-accessible | Only in `greeting-actions.ts:12` | Cannot ask "nipe revenue ya leo" |
| 42 | Smart Reorder not voice-accessible | Only in `greeting-actions.ts:13` | Cannot ask "nini kinahitaji kuagizwa" |
| 43 | Debt Collection not voice-accessible | Only in `greeting-actions.ts:14` | Cannot ask "wadeni wako wangapi" |
| 44 | Procurement Advisor not wired at all | Module exists in `@/modules/ai/procurement/` | Dead code — no Firdaus integration |
| 45 | Health Score only in greeting toast | Only in `greeting-actions.ts:15` | Cannot ask "health score ikoje" |

### 10.11 QR Ordering Limitations

| # | Limitation | Code Evidence | Impact |
|---|-----------|--------------|--------|
| 46 | Zero Firdaus integration | No QR-related code in enkai directory | Cannot query QR stats or menus |
| 47 | No QR UI components | `schema.prisma` has models but no routes/UI | No frontend for QR management |
| 48 | QRCode.mode is String not enum | `schema.prisma:2074` — `mode String?` | Loose typing, no validation |

### 10.12 Identified Bugs

| # | Bug | File | Line | Description |
|---|-----|------|------|-------------|
| B1 | `sale.total` used but field is `grandTotal` | `tool-registry.ts` | 537, 965, 980 | Sale model has `grandTotal`, not `total` |
| B2 | `sale.total` in memory aggregation | `memory-service.ts` | 90, 114 | Same field mismatch |
| B3 | `payment.method` used but Payment model uses different field | `memory-service.ts` | 80, 106 | Type error at runtime |
| B4 | `Expense.category` vs `categoryId` | `memory-service.ts` | 83-88 | `category` is a relation, not scalar field |
| B5 | `getOrCreateWorkflow()` after validate | `business-brain.ts` | 179 | Creates duplicate workflow in some states |
| B6 | Swahili number words not parsed | `command-parser.ts` | 177-179 | "tatu" → NaN, not 3 |
| B7 | `prisma.fields.reorderPoint` API | `proactive-advisor.ts` | 59 | Prisma 6 API compatibility uncertain |
| B8 | Two audit log functions, different schemas | `assistant-service.ts:476`, `business-brain.ts:504` | Both | Inconsistent logging; one uses `entity`/`entityId`, other uses `resourceType`/`resourceId` |
| B9 | Workflow `return` inside nested loops | `firdaus-global-listener.tsx` | 66 | `return` in j-loop doesn't exit i-loop |
| B10 | `voice-service.ts` is server-only | `voice-service.ts:1` | 1 | Voice pattern normalization runs on server, not used by client-side wake flow |

---

## 11. Readiness for V8

### 11.1 Assessment

| Area | Rating | Evidence |
|------|--------|----------|
| **Tanzania Language Intelligence** | **NOT READY** | No vocabulary pack, no industry awareness, no synonym engine, 23 patterns only |
| **"Hey Firdaus" wake word** | **PARTIAL** | Current regex substring-matches "firdaus" within "hey firdaus" but NOT "firdausi" or "fidaus" |
| **Fuzzy matching** | **NOT READY** | No Levenshtein, no confidence scoring, exact regex only |
| **Synonym engine** | **NOT READY** | 1-3 patterns per intent, no synonym expansion, no priority scoring |
| **Industry vocabulary packs** | **NOT READY** | Zero vocabulary infrastructure, business type never queried |
| **Voice confidence system** | **NOT READY** | `maxAlternatives: 5` set but confidence never read, no thresholds |
| **Number-to-Swahili conversion** | **NOT READY** | No number formatting utility, English voice reads digits |
| **Google Cloud TTS** | **NOT READY** | No server-side TTS integration, browser SpeechSynthesis only |
| **Swahili number word parsing** | **NOT READY** | Patterns use `\d+` only, "tatu" → NaN |
| **Business-specific responses** | **NOT READY** | All businesses get identical generic Swahili |
| **Voice normalization pipeline** | **PARTIAL** | `voice-service.ts` has 16 patterns but NOT wired into client wake flow |
| **Memory vocabulary learning** | **NOT READY** | `FREQUENT_PRODUCT` is dead code, no term learning from voice |
| **Platform permissions** | **NOT READY** | Platform mode has zero permission checks |
| **Platform BI queries** | **PARTIAL** | 6 basic COUNT queries work, but no period/aggregation/detail |

### 11.2 Readiness Summary

| Area | Rating |
|------|--------|
| Voice | NOT READY |
| Swahili Understanding | NOT READY |
| Business Vocabulary | NOT READY |
| Platform Intelligence | PARTIAL |
| QR Intelligence | NOT READY |
| Memory | NOT READY |
| Workflow Automation | PARTIAL |

### 11.3 What Is Already V8-Ready

- **Architecture**: `FirdausGlobalListener` + `FirdausProvider` + `FirdausContext` is well-structured for extension
- **Mode detection**: Platform/workspace mode detection works correctly
- **Business resolution**: Business ID resolution (pathname + auth + DB fallback) is comprehensive
- **Workflow persistence**: DB-backed state machine survives restarts
- **Audit logging**: All operations logged
- **Permission framework**: `checkPermission()` infrastructure exists (even if limited to Staff table)
- **Memory framework**: `BusinessMemory` table + `learnPattern()` function exists (even if limited types)
- **Tool registry**: 18 tools with permission checks exist
- **Voice service**: 16 pattern normalization rules exist (even if not wired correctly)

### 11.4 What Blocks V8

- **No vocabulary infrastructure** — must create vocab files, industry mapping, and integration
- **No fuzzy matching** — must add Levenshtein to wake word detection
- **No synonym engine** — must build synonym table and scoring
- **No confidence system** — must add thresholds and confirmation dialogs
- **No TTS fallback** — must integrate Google Cloud TTS or similar
- **No Swahili numbers** — must build number parser + formatter
- **Business type unused** — must query and branch on `business.industry_mode`

---

## 12. File Inventory

### 12.1 Core Files

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 1 | `src/features/enkai/provider/firdaus-provider.tsx` | State management, TTS, sendMessage | **ACTIVE** | `firdaus-context`, `service-actions`, `assistant/types` | Root layout via `providers.tsx` |
| 2 | `src/features/enkai/provider/firdaus-context.tsx` | Context definition, types, hook | **ACTIVE** | `assistant/types` | All Firdaus components |
| 3 | `src/features/enkai/components/firdaus-global-listener.tsx` | STT, wake word, mode detection, auth | **ACTIVE** | `firdaus-context`, `auth-provider` | Root layout via `providers.tsx` |
| 4 | `src/features/enkai/components/firdaus-response-toast.tsx` | 10s response bubble | **ACTIVE** | `firdaus-context` | `providers.tsx` |
| 5 | `src/features/enkai/components/firdaus-toast.tsx` | 14s login greeting toast | **ACTIVE** | `firdaus-context`, `greeting-actions` | Business layout |
| 6 | `src/features/enkai/components/firdaus-insights.tsx` | Proactive insight card | **ACTIVE** | `service-actions` | Dashboard pages |

### 12.2 Server-Side / Logic Files

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 7 | `src/features/enkai/brain/business-brain.ts` | Main orchestrator, intent routing, platform mode | **ACTIVE** | `prisma`, `command-parser`, `tool-registry`, `permission-service`, `memory-service`, `workflow-persistence` | `assistant-service` |
| 8 | `src/features/enkai/brain/memory-service.ts` | Business memory, caching, pattern learning | **ACTIVE** | `prisma` | `business-brain` |
| 9 | `src/features/enkai/assistant/assistant-service.ts` | Message pipeline, intent handlers, session | **ACTIVE** | `prisma`, `command-parser`, `tool-registry`, `prompts`, `memory-store`, `business-brain` | `service-actions` |
| 10 | `src/features/enkai/assistant/types.ts` | Types: AssistantMessage, AssistantContext, AssistantResponse | **ACTIVE** | `commands/types` | All enkai files |
| 11 | `src/features/enkai/commands/command-parser.ts` | NLU parser: 17 slash + 23 NLU patterns | **ACTIVE** | `commands/types` | `assistant-service`, `business-brain`, `voice-service` |
| 12 | `src/features/enkai/commands/types.ts` | IntentType, ParsedCommand, CommandDefinition | **ACTIVE** | none | All command/logic files |
| 13 | `src/features/enkai/tools/tool-registry.ts` | 18 business tools with Prisma operations | **ACTIVE** | `prisma`, `tools/types` | `assistant-service`, `business-brain` |
| 14 | `src/features/enkai/tools/types.ts` | ToolDefinition, ToolResult, ToolRegistry | **ACTIVE** | none | `tool-registry` |
| 15 | `src/features/enkai/prompts/prompts.ts` | System prompt + response templates | **ACTIVE** | none | `assistant-service` |

### 12.3 Service Files

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 16 | `src/features/enkai/services/workflow-engine.ts` | In-memory workflow state machine | **ACTIVE** | `workflow-persistence` (types) | `business-brain` |
| 17 | `src/features/enkai/services/workflow-persistence.ts` | DB-backed workflow persistence | **ACTIVE** | `prisma` | `business-brain` |
| 18 | `src/features/enkai/services/permission-service.ts` | Staff-based RBAC permission check | **ACTIVE** | `prisma` | `business-brain` |
| 19 | `src/features/enkai/services/proactive-advisor.ts` | Business scan, notifications, greeting data | **ACTIVE** | `prisma` | `greeting-actions` |
| 20 | `src/features/enkai/services/proactive-insights.ts` | Proactive insight generation | **ACTIVE** | `prisma` | `service-actions` |
| 21 | `src/features/enkai/services/expense-classifier.ts` | Expense categorization (operating vs procurement) | **ACTIVE** | none | `business-brain` |

### 12.4 Action Files (Server Actions)

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 22 | `src/features/enkai/actions/service-actions.ts` | Server actions: sendMessage, insights, forecasts | **ACTIVE** | `assistant-service`, AI modules | `firdaus-provider` |
| 23 | `src/features/enkai/actions/greeting-actions.ts` | Greeting data: revenue, reorder, debt, health | **ACTIVE** | AI modules (`revenue-engine`, `reorder-engine`, etc.) | `firdaus-toast` |

### 12.5 Supporting Files

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 24 | `src/features/enkai/voice/voice-service.ts` | Voice pattern normalization (16 patterns) | **ACTIVE** (but unused in wake flow) | `command-parser` | `service-actions` (unused) |
| 25 | `src/features/enkai/hooks/use-firdaus.ts` | React hooks: useFirdaus, useFirdausBusiness, usePageContext | **ACTIVE** | `firdaus-context` | Page components |
| 26 | `src/features/enkai/memory/memory-store.ts` | In-memory session storage | **ACTIVE** | `assistant/types` | `assistant-service` |
| 27 | `src/features/enkai/index.ts` | Barrel exports | **ACTIVE** | All enkai files | External imports |
| 28 | `src/types/speech-recognition.d.ts` | TypeScript declarations for Web Speech API | **ACTIVE** | none | `firdaus-global-listener` |

### 12.6 Workflow Files

| # | Path | Purpose | Status | Dependencies | Used By |
|---|------|---------|--------|--------------|---------|
| 29 | `src/features/enkai/workflows/business-setup.ts` | Business creation workflow | **ACTIVE** | `prisma` | Exported, not directly used by Firdaus |

### 12.7 Prisma Schema Files

| # | Path | Lines | Purpose |
|---|------|-------|---------|
| 30 | `prisma/schema.prisma` (FirdausWorkflow model) | 2462-2482 | Workflow persistence table |
| 31 | `prisma/schema.prisma` (BusinessMemory model) | 2495-2511 | Learned memory/patterns table |
| 32 | `prisma/schema.prisma` (MemoryType enum) | 2486-2493 | Memory type enum |
| 33 | `prisma/schema.prisma` (FirdausWorkflowStatus enum) | 2453-2460 | Workflow state enum |

### 12.8 Total File Count

| Category | Count |
|----------|-------|
| Core Components | 6 |
| Server-Side Logic | 9 |
| Services | 6 |
| Server Actions | 2 |
| Supporting | 5 |
| Workflows | 1 |
| Prisma (related) | 4 |
| **Total** | **33 files** |

---

*End of Architecture Report — Based on actual source code analysis of 33 files*
