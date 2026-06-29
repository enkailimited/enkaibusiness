# AI Engineering Constitution

These rules apply to every project regardless of technology stack, programming language, architecture, or business domain.

---

## 1. Understand Before Acting

Never modify code before understanding:

* The problem
* The existing implementation
* The architecture
* The affected modules

Inspect first.

Implement second.

---

## 2. Do Not Assume

Never assume:

* Missing functionality
* Missing files
* Missing permissions
* Missing business logic

Verify through code inspection.

Evidence before conclusions.

---

## 3. Preserve Existing Behavior

Working functionality is a business asset.

Before changing code:

* Identify dependencies
* Identify consumers
* Identify side effects

Avoid breaking existing features.

---

## 4. Fix Root Causes

Do not patch symptoms.

Always identify:

* Why the issue exists
* Where the issue originates
* What systems are affected

Solve causes, not consequences.

---

## 5. Small Changes First

Prefer:

* Small commits
* Small refactors
* Small migrations

Avoid large unreviewed changes.

Incremental improvements reduce risk.

---

## 6. Respect Existing Architecture

Follow established patterns.

Before introducing:

* New services
* New abstractions
* New libraries
* New frameworks

Verify whether the project already has an accepted pattern.

Consistency is more valuable than cleverness.

---

## 7. Reuse Before Creating

Before creating:

* Tables
* APIs
* Services
* Components
* Utilities

Check whether similar functionality already exists.

Avoid duplication.

---

## 8. Backward Compatibility First

When changing systems:

* Existing users must continue working
* Existing APIs should not break
* Existing data should remain valid

Prefer additive changes over destructive changes.

---

## 9. Security By Default

Always verify:

* Authentication
* Authorization
* Data ownership
* Access control
* Sensitive data exposure

Security is mandatory.

---

## 10. Multi-Tenant Awareness

If the application supports multiple organizations, customers, teams, or businesses:

Always verify:

* Ownership
* Scope
* Isolation

Prevent data leakage between tenants.

---

## 11. Minimize Complexity

Prefer:

* Simpler solutions
* Existing patterns
* Existing infrastructure

Avoid unnecessary abstractions.

Avoid over-engineering.

---

## 12. Database Discipline

Before creating new tables:

Check:

* Existing entities
* Existing relationships
* Existing indexes

Prefer extending valid models over duplication.

---

## 13. API Discipline

Before creating endpoints:

Verify:

* Existing routes
* Existing controllers
* Existing services

Avoid API duplication.

Maintain consistency.

---

## 14. Performance Awareness

Consider:

* Query count
* N+1 problems
* Memory usage
* Network requests

Do not introduce obvious inefficiencies.

---

## 15. Logging And Observability

When fixing issues:

Ensure the system can be observed.

Prefer:

* Audit logs
* Error logs
* Activity tracking
* Monitoring hooks

Invisible systems are difficult to maintain.

---

## 16. Test Before And After

Before changes:

Understand current behavior.

After changes:

Validate expected behavior.

Never assume success.

Verify.

---

## 17. Ask When Uncertain

Stop and request clarification when:

* Requirements conflict
* Architecture is unclear
* Data loss is possible
* Security implications exist

Do not guess.

---

## 18. Documentation Matters

When significant changes are made:

Update:

* Documentation
* Architecture notes
* Migration guides
* Developer references

Code and documentation should remain aligned.

---

## 19. Token Efficiency

Keep outputs concise.

Avoid repeating information.

Focus on:

* Findings
* Risks
* Impact
* Actions

Reduce unnecessary verbosity.

---

## 20. Standard Investigation Format

Before implementation always provide:

CURRENT STATE

FINDINGS

AFFECTED FILES

RISKS

ROOT CAUSE

IMPLEMENTATION PLAN

Only after approval should implementation begin.



Rule #21

Never redesign a system when a localized fix is sufficient.

Prefer evolution over replacement.



---

## Anchored Summary — Session Context

### Goal
- Transform ENKAI from a bug-fixed ERP into a modular, event-driven, AI-native enterprise SaaS platform with Firdaus as the central Business AI Operating System.

### Progress
#### Done
1. **Bootstrap & Audit**: Read project structure, AGENTS.md, docs, key services, Prisma schema, action files across 24 categories.
2. **Critical Bug Fixes** (3/3): Fixed `PaymentMethod.create` (removed non-existent `code`/`workspaceId`), swapped inverted cash inflow/outflow in `financial-service.ts`, verified activation setup fee is correct (no double-count).
3. **Data Integrity**: `updateSale` restores old inventory + deducts new; `voidSale` → `"refunded"` throughout; invoice status aligned.
4. **N+1 Elimination**: Batched catalog lookups in sale, purchase, goods-received services (2N → 1 query each).
5. **Zod Validation**: Added to all 29 action functions across roles, permissions, settings, enkai actions.
6. **RBAC**: Added `hasPermission()` checks to all 8 roles/permissions mutation actions.
7. **Phase 1 — Durable Event Bus**: DB-backed `EventRecord` with 33 event types, retry (3x), poison-queue, startup recovery.
8. **Phase 2 — Job Queue**: pg-boss (PostgreSQL-native, no Redis). `JobRecord` model, email/notification/analytics/report workers, `GET/POST /api/jobs` route.
9. **Phase 3 — Notification Engine**: Unified `dispatch()` with 4 channels (in-app, email, SMS, WhatsApp), preference checks, template interpolation. `NotificationTemplate` model.
10. **Phase 4 — Firdaus AI OS**: Created `src/ai/` with multi-provider LLM abstraction (OpenAI, Anthropic, Gemini), RAG pipeline (keyword retrieval + context injection), multi-layer memory (session + DB-backed business), 11 domain knowledge layers. Backward-compatible with old import paths.
11. **Phase 5 — Search Abstraction Layer**: Created `src/server/search/` with adapter pattern (`PrismaSearchAdapter` implementing `SearchAdapter` interface), `SearchService` class with typed methods for all 18 searchable models. Migrated 6 critical services (customer, catalog, user, supplier, invoice, expense) from inline ILIKE queries.
12. **Phase 6 — Industry Engine**: Created `src/server/industry/` with complete multi-industry platform engine. All 10 industries (Commerce, Restaurant, Education, Healthcare, Manufacturing, Agriculture, Services, Logistics, Real Estate, Non-Profit) with 50+ business modes, 80+ modules, 200+ permissions, industry-specific AI knowledge, reports, dashboards, KPIs, workflows, voice commands, and navigation. Adapter pattern design — everything flows from industry + mode config. Backward-compatible with existing commerce ERP.
13. **Schema Update**: Added EDUCATION, LOGISTICS, REAL_ESTATE, NON_PROFIT to Industry enum.
14. **Final Audit**: `FINAL-AUDIT-REPORT-2026-06-29.md` generated. Zero TODO/FIXME/HACK in source. Typecheck passes. `prisma generate` succeeds.

### Key Decisions
- **Event Bus**: DB persistence over in-memory. Retry 3x → poison-queue. Fire-and-forget emission. `processPendingEvents()` on startup.
- **Job Queue**: pg-boss over Bull/BullMQ — no Redis dependency. Workers via `/api/jobs` route or separate process.
- **Notification Engine**: Wraps existing systems under one `dispatch()` API rather than replacing them.
- **AI Architecture**: LLM abstraction with swap-via-env-var. RAG uses keyword search first (zero deps), embeddings ready to plug in. Backward-compat re-exports from old locations.
- **Search Service**: Adapter pattern — `PrismaSearchAdapter` today, easy swap to Meilisearch/Typesense later. Only `where.OR` conditions go through the abstraction; non-search filters remain inline.
- **Industry Engine**: Configuration-driven — all 10 industries defined as TypeScript config objects in a registry, not hardcoded if/else. Runtime resolvers derive everything (modules, permissions, AI, reports, dashboards, workflows) from industry + mode. Existing commerce ERP is just `commerce` + `retail` in the registry.

### Next Steps
- **Phase 5a**: Migrate remaining 23 search sites (sales, purchases, purchase orders, returns, goods received, quotations, support tickets, leads, sales profiles, campaigns, uploads, cash registers, support service, platform, monitoring, login-service, auth-service, AI tools).
- **Phase 6b**: Workflow engine (approval chains, conditions, escalations).
- **Phase 7**: Automation rule engine (IF inventory < min → generate PO → notify).
- **Phase 8**: Public API platform (REST + OAuth + API keys + webhooks).
- **Phases 9-23**: Marketplace, Firdaus improvements, analytics, observability, security, performance, school AI prep.

### Critical Context
- **Firdaus has NO LLM today** — the 10,850-line rule engine is 100% regex/intent-based. The `src/ai/llm/provider.ts` is ready but no code paths call it yet.
- **Event bus is live** — sale/purchase/goods-received/activation services emit events. `EventRecord` will accumulate rows. Monitor via `GET /api/jobs`.
- **Job queue needs worker process** — in production, call `GET /api/jobs?action=init` on startup or run a separate Node process calling `initializeWorkers()`.
- **Search abstraction is live** — 6 services migrated. Remaining 23 sites still use inline `contains + mode: insensitive`. The adapter can be swapped to Meilisearch/Typesense by replacing `PrismaSearchAdapter` with `MeilisearchSearchAdapter`.
- **Env vars needed for LLM**: `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.
- **No WebSocket/real-time** — push requires future infrastructure.
- **No CSRF/rate limiting/security headers** — only session-cookie check in middleware.

### Relevant Files
- **Industry Engine**: `src/server/industry/types.ts` (types), `src/server/industry/registry.ts` (10 industries, 50+ modes, 80+ modules), `src/server/industry/module-resolver.ts` (runtime module resolution), `src/server/industry/permission-resolver.ts` (200+ permissions), `src/server/industry/ai-resolver.ts` (industry AI knowledge + voice commands), `src/server/industry/report-resolver.ts` (industry reports), `src/server/industry/dashboard-resolver.ts` (industry dashboards + KPIs), `src/server/industry/workflow-resolver.ts` (industry workflows), `src/server/industry/ui-adapter.ts` (navigation filtering), `src/server/industry/index.ts` (barrel exports).
- **Search**: `src/server/search/adapter.ts` (PrismaSearchAdapter), `src/server/search/index.ts` (SearchService + typed methods).
- **Event Bus**: `src/modules/ai/events/event-bus.ts` (DB-backed, 33 event types, retry, processPendingEvents).
- **Job Queue**: `src/server/jobs/queue.ts` (pg-boss), `src/server/jobs/workers/`, `src/server/jobs/index.ts`, `src/app/api/jobs/route.ts`.
- **Notifications**: `src/features/notifications/services/dispatch-service.ts`, `src/features/notifications/index.ts`.
- **AI**: `src/ai/llm/provider.ts`, `src/ai/rag/pipeline.ts`, `src/ai/memory/index.ts`, `src/ai/knowledge/index.ts`, `src/ai/index.ts`.
- **Schema**: `prisma/schema.prisma` — `EventRecord`, `JobRecord`, `NotificationTemplate`, Industry enum (10 values). 107 models, 187 indexes.
- **Migrated to Search Service**: `customer-service.ts`, `catalog-service.ts`, `user-service.ts`, `supplier-service.ts`, `invoice-service.ts`, `expense-service.ts`.
- **Still on inline ILIKE**: `sale-service.ts`, `purchase-service.ts`, `purchase-order-service.ts`, `return-service.ts`, `goods-received-service.ts`, `quotation-service.ts`, `ticket-service.ts`, `lead-service.ts`, `profile-service.ts`, `campaign-service.ts`, `upload-service.ts`, `register-service.ts`, `platform-service.ts`, `support-service.ts`, `monitoring/index.ts`, `login-service.ts`, `auth-service.ts`, `auth/actions/index.ts`, `lib/auth.ts`, `business-brain.ts`, `product-resolver.ts`, `tool-registry.ts`.
