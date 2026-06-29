# Architecture Review & Refactoring Plan

**Date:** June 2026
**Scope:** Registration engines, membership models, role systems, multi-industry readiness, domain events

---

## 1. Architecture Score

| Dimension | Score | Rationale |
|---|---|---|
| **Maintainability** | 6/10 | Two clean engine classes with adapters. But 6 membership models, 2 invite implementations, 3 role systems create cognitive load. |
| **Extensibility** | 5/10 | Context adapter pattern is extensible. But BusinessType exists in schema yet drives zero behavior. Adding a new industry requires modifying engine internals. |
| **DDD Alignment** | 5/10 | `UserRegistrationEngine` + `RegistrationContext` enum is good domain modeling. But engines directly call notification/activity/audit services — violates domain event purity. `StaffAssignment.level` is a string — no value object. |
| **Multi-Tenancy Design** | 7/10 | Workspace scope + business scope handled. `Staff.userId @unique` blocks multi-business staff. No tenant isolation validation at the engine level. |
| **Industry Abstraction** | 2/10 | BusinessType model exists but is ignored. QR pricing, subscription creation, hardcoded hierarchies — all Commerce-specific. Adding Healthcare would require engine changes. |
| **Role Architecture** | 3/10 | Three incompatible role systems (enum, RBAC, SalesHierarchy). A user can have `WorkspaceMember.role=ADMIN` + `UserRole(admin)` + `SalesProfile(hierarchyId=manager)` — all unreconciled. |
| **Registration Architecture** | 7/10 | Clean `UserRegistrationEngine` + `BusinessRegistrationEngine`. Explicit context enum. Adapter pattern works. Transaction boundaries correct. Missing: domain events, BusinessType wiring. |
| **Event-Driven Readiness** | 1/10 | Event bus exists with 10 types and handlers but is completely dormant. Zero emit calls. Zero handler registration. Engines hardcode notification/activity/audit calls. |

**Overall: 4.5/10** — Good foundation with significant architectural debt in industry abstraction, role systems, and event-driven patterns.

> **Update:** Sprint 1 (Event Bus activation + BusinessTypeResolver + Permission checks) implemented as of June 2026. Score on event-driven readiness improves from 1/10 to 5/10 with registration domain events now active.

---

## 2. Critical Design Flaws

### Critical

| # | Flaw | Impact | File(s) |
|---|---|---|---|
| C1 | `Staff.userId @unique` — user can only be staff at one business | Blocks multi-business staff (doctor at 2 hospitals, consultant at 3 firms). Core multi-tenant violation. | `prisma/schema.prisma:718` |
| C2 | BusinessType exists in schema but engines ignore it | Every industry addition requires engine modification. Seed only creates Commerce. No Healthcare/Agriculture/Mining configs. | `registrations/business/index.ts`, `registrations/context/index.ts` |
| C3 | Event bus completely dormant | Engines hardcode notification/activity/audit calls. Domain events would decouple cross-cutting concerns. No extensibility hooks for post-registration workflows. | `modules/ai/events/event-bus.ts` |
| C4 | StaffAssignment.level is free-text string | Any code can write any level string. No validation boundary. Commerce-specific hierarchy (`store > branch > business`) is hardcoded in 3 places. | `prisma/schema.prisma`, `registrations/context/index.ts:104`, `registrations/staff/index.ts:91` |

### High

| # | Flaw | Impact | File(s) |
|---|---|---|---|
| H1 | 3 incompatible role systems | WorkspaceMemberRole enum, RBAC Role model, SalesHierarchy operate in parallel. Cannot express cross-context permissions. | `prisma/schema.prisma` (3 models) |
| H2 | Subscription always mandatory in `BusinessRegistrationEngine` | Blocks non-subscription industries (Agriculture seasonal, Education term, non-profit). | `registrations/business/index.ts:98-140` |
| H3 | Hardcoded Commerce pricing (QR stickers, daily_price, setup_fee) | QR pricing imported at registration time. `daily_price` and `setup_fee` set as settings. No pricing resolver abstraction. | `registrations/business/index.ts:119-121`, `subscriptions/constants/pricing.ts` |
| H4 | `retail`/`wholesale` branching hardcoded | Pricing logic and mode creation assume Commerce-specific modes. Healthcare would need inpatient/outpatient. | `registrations/business/index.ts`, `subscriptions/constants/pricing.ts:46-48` |
| H5 | Two invite service implementations | `features/users/services/invite-service.ts` and `registrations/shared/invite.ts` have overlapping but different field support. | Both invite files |
| H6 | TZS + Africa/Dar_es_Salaam defaulted | Hardcoded currency and timezone in business creation output strings. | `registrations/business/index.ts` |

### Medium

| # | Flaw | Impact | File(s) |
|---|---|---|---|
| M1 | `StaffForm` not converted to shared `InviteForm` | Third form implementation still separate. employeeCode/position/hireDate should be additive to shared form rather than blocking reuse. | `features/staff/components/staff-form.tsx` |
| M2 | `UserRegistrationEngine.assignUserToContext` has no email/password | Existing-user path generates temp password but user was already created — this password is sent but may conflict with existing Better Auth credentials. | `registrations/user/index.ts:assignUserToContext` |
| M3 | No `hasPermission` check in registration flows | Any authenticated user can invite users to any context. No verification that inviter has right to assign roles. | `features/sales-network/actions/invite-team-action.ts` (partially — checks hierarchy level) |

### Low

| # | Flaw | Impact | File(s) |
|---|---|---|---|
| L1 | `generateTempPassword` formats differ | Local function used `ENK-XXXX-XXXX` pattern in invite-team-action (now removed). Engine uses different format. | Multiple files |
| L2 | Invite expiry hardcoded to 7 days | Not configurable per context or per business type. | `registrations/user/index.ts` |

---

## 3. Membership Architecture Review

#> **Sprint 1 complete ✅:** Registration domain events active (`registration.user.registered`, `registration.user.assigned`, `registration.business.created`). Engines emit events instead of calling notification/activity/audit services directly. Handlers registered automatically on module load. `BusinessTypeResolver` interface + `CommerceResolver` implementation created. Subscription creation now conditional on `resolver.requiresSubscription()`. Permission checks added to both engines via `hasPermission()`.

## Current: 6 separate models

```
WorkspaceMember ─── Workspace scope (N:M user)
     Staff ──────── Business scope (1:1 user — BROKEN)
StaffAssignment ─── Business/Branch/Store level (via Staff)
   UserRole ─────── Platform or Business scope (N:M)
 SalesProfile ───── Sales network scope (1:1 user)
  UserInvite ────── Pre-membership (N:1 user)
```

### Assessment

**Should remain separate:** No. The current design has 3 overlapping membership concepts that should be rationalized.

**The `Staff` model is the core problem:**
1. `userId @unique` prevents multi-business staff (Critical flaw C1)
2. `StaffAssignment` is a separate join that could be merged into a single `BusinessMembership` model
3. `UserRole` partially overlaps with `StaffAssignment.roleId`

### Recommended Target Architecture

```typescript
// ONE unified membership model per domain context

enum MembershipContext { WORKSPACE, BUSINESS, SALES_NETWORK }

model BusinessStaff {
  id          String   @id @default(uuid())
  userId      String   @db.Uuid
  businessId  String   @db.Uuid

  // Role via RBAC (roleId nullable for sales-only staff)
  roleId      String?  @db.Uuid          // FK -> Role

  // Assignment levels (polymorphic)
  branchId    String?  @db.Uuid
  storeId     String?  @db.Uuid
  department  String?                     // Healthcare: cardiology
  ward        String?                     // Healthcare: ward-3
  pitId       String?                     // Mining
  fieldId     String?                     // Agriculture

  employeeCode String?
  position    String?
  hireDate    DateTime?
  isActive    Boolean  @default(true)

  @@unique([userId, businessId])          // User CAN be staff at multiple businesses
  @@index([businessId])
}
```

**Key changes:**
1. Remove `userId @unique` — user can be staff at N businesses
2. Merge `Staff` + `StaffAssignment` into single `BusinessStaff` model
3. Replace hardcoded `level` string with nullable industry-specific fields
4. Remove `StaffAssignment.roleId` — use RBAC `UserRole` for all role assignments
5. `WorkspaceMember` stays separate (N:M workspace scope)
6. `SalesProfile` stays separate (specialized sales hierarchy)
7. `UserInvite` stays separate (pre-membership state machine)

### Migration Strategy

1. **Phase 1:** Add `BusinessStaff` model alongside existing `Staff` (dual-write)
2. **Phase 2:** Migrate data from `Staff` + `StaffAssignment` to `BusinessStaff`
3. **Phase 3:** Remove `Staff` and `StaffAssignment` models
4. **Phase 4:** Add migration scripts for existing data

---

## 4. Role System Review

### Current State

| System | Model | Scope | Extensible? |
|---|---|---|---|
| WorkspaceMemberRole enum | `WorkspaceMember.role` | Workspace | ❌ Fixed: OWNER/ADMIN/MEMBER/GUEST |
| RBAC Role model | `UserRole` + `Role` | Platform + Business | ✅ Custom roles via Role table |
| SalesHierarchy | `SalesProfile.hierarchyId` | Sales Network | ✅ Custom levels via SalesHierarchy table |

### Assessment

**WorkspaceMemberRole should migrate into RBAC.** The fixed enum is a design artifact. Workspace roles (OWNER/ADMIN/MEMBER/GUEST) should be seeded roles in the RBAC `Role` table with `scope: WORKSPACE`.

**SalesHierarchy should remain separate.** Sales hierarchy represents a reporting structure, not permissions. A National Sales Manager manages Region Managers. This is an org chart, not an RBAC role.

**StaffAssignment.roleId should be removed.** `UserRole` already provides role assignment for business-scoped users. Having both `StaffAssignment.roleId` and `UserRole` creates two codepaths for the same concept.

### Recommended Target

```
WorkspaceMember.role ──→ Role model with scope=WORKSPACE
                             (seeded: owner, admin, member, guest)

StaffAssignment.roleId ──→ UserRole (business scope) only
                             (remove roleId from StaffAssignment)

SalesProfile.hierarchyId ──→ SalesHierarchy (stays as org chart)
                                  (remove role/perm mapping from sales hierarchy)
```

### Migration Steps

1. Add `scope: WORKSPACE` to Role enum or use `scope: WORKSPACE` on existing enum
2. Seed Workspace roles: `owner`, `admin`, `member`, `guest` with appropriate permissions
3. Migrate existing `WorkspaceMember.role` values to `UserRole` entries
4. Add NOT NULL + FK constraint on `WorkspaceMember.roleId` → `Role.id`
5. Remove `WorkspaceMember.role` enum field
6. Remove `StaffAssignment.roleId` — all role queries go through `UserRole`
7. Update engine adapters to use `UserRole` for workspace context

---

## 5. BusinessType Strategy

### Design: BusinessType Configuration

```typescript
interface BusinessTypeConfig {
  // Core
  id: string;
  slug: string;
  name: string;

  // Membership
  staffUniqueness: "single" | "multi";    // Could staff work at multiple businesses?
  defaultPosition: string;                 // "Owner" for commerce, "Supervisor" for healthcare

  // Hierarchy
  hierarchy: {
    levels: HierarchyLevel[];              // [{ key: "store", label: "Store" }, { key: "branch", label: "Branch" }]
    validLevels: string[];                 // ["business", "branch", "store"]
    assignmentRules: {
      requireParent: boolean;              // Must store have a branch?
      maxDepth: number;                    // 3 for commerce, 2 for clinic
    };
  };

  // Subscription
  subscription: {
    required: boolean;                     // Commerce: true, Agriculture: false
    defaultPlanId?: string;
    allowCustomPlans: boolean;
    pricingResolver: "commerce" | "healthcare" | "education" | "custom";
  };

  // Pricing
  pricing: {
    dailyPrice: number;
    setupFee: number;
    qrPrintingRequired: boolean;           // Commerce: true, Healthcare: false
    qrStickerCount: number;
    currency: string;                      // Override default TZS
  };

  // Modules
  requiredModules: string[];               // ["catalog", "inventory", "sales"]
  optionalModules: string[];               // ["qr_ordering", "delivery"]
  hiddenModules: string[];                 // Modules irrelevant to this industry

  // Provisioning
  postCreationHooks: Array<(businessId: string, userId: string) => Promise<void>>;

  // Settings
  defaultSettings: Record<string, string>; // { "business_size": "small", "tax_rate": "18" }
}
```

### Resolver Architecture

```typescript
interface BusinessTypeResolver {
  // Load config for a business type
  getConfig(businessTypeId: string): Promise<BusinessTypeConfig>;

  // Resolve hierarchy levels
  getValidLevels(businessTypeId: string): Promise<string[]>;
  resolveLevel(businessTypeId: string, input: { branchId?, storeId?, department?, ward? }): Promise<string>;

  // Resolve pricing
  getPricing(businessTypeId: string, planId: string): Promise<BusinessPricingInfo>;
  getDefaultPricing(businessTypeId: string): Promise<BusinessPricingInfo>;

  // Subscription rules
  requiresSubscription(businessTypeId: string): Promise<boolean>;
  getDefaultPlan(businessTypeId: string): Promise<string | null>;

  // Modules
  getEnabledModules(businessTypeId: string): Promise<string[]>;
  getRequiredModules(businessTypeId: string): Promise<string[]>;
}

// Default implementation for Commerce
class CommerceResolver implements BusinessTypeResolver {
  getValidLevels() { return ["business", "branch", "store"]; }
  resolveLevel(_, input) { return input.storeId ? "store" : input.branchId ? "branch" : "business"; }
  requiresSubscription() { return true; }
  // ...
}

// Healthcare implementation
class HealthcareResolver implements BusinessTypeResolver {
  getValidLevels() { return ["business", "department", "ward"]; }
  resolveLevel(_, input) { return input.ward ? "ward" : input.department ? "department" : "business"; }
  requiresSubscription() { return false; }
  // ...
}
```

### Integration Points

| Engine Location | Current (Commerce) | Target (BusinessType-aware) |
|---|---|---|
| `businessAdapter.assign` | `level: storeId ? "store" : branchId ? "branch" : "business"` | `level: resolver.resolveLevel(businessTypeId, { storeId, branchId, department, ward })` |
| `BusinessRegistrationEngine.register` | Always creates Subscription + Wallet | `if (resolver.requiresSubscription(businessTypeId)) { ... }` |
| `BusinessRegistrationEngine.register` | QR pricing import | `const pricing = resolver.getPricing(businessTypeId, planId)` |
| `BusinessRegistrationEngine.register` | Sets `daily_price` + `setup_fee` | `resolver.getConfig(businessTypeId).defaultSettings` |
| `BusinessRegistrationEngine.register` | Hardcoded modes | `resolver.getConfig(businessTypeId).hierarchy.levels` |

### Schema Updates Needed

```prisma
model BusinessType {
  // ... existing fields ...

  // Add config JSON for complex settings that don't need their own columns
  config Json?   @map("config")   // BusinessTypeConfig without runtime methods
}
```

---

## 6. Event-Driven Refactor

### Event Definitions

```typescript
// Registration Domain Events
enum RegistrationEventType {
  USER_REGISTERED = "registration.user.registered",
  USER_ASSIGNED_TO_CONTEXT = "registration.user.assigned",
  BUSINESS_CREATED = "registration.business.created",
  STAFF_ASSIGNED = "registration.staff.assigned",
  WORKSPACE_MEMBER_ADDED = "registration.workspace.member.added",
  SALES_AGENT_REGISTERED = "registration.sales.agent.registered",
  INVITE_SENT = "registration.invite.sent",
  INVITE_ACCEPTED = "registration.invite.accepted",
}

// Event Payloads
interface RegistrationEventPayload {
  timestamp: string;
  correlationId: string;           // Traceability across engine transaction
}

interface UserRegisteredPayload extends RegistrationEventPayload {
  userId: string;
  email: string;
  context: RegistrationContext;
  invitedById: string;
  businessId?: string;
}

interface BusinessCreatedPayload extends RegistrationEventPayload {
  businessId: string;
  name: string;
  businessTypeId: string;
  createdById: string;
  workspaceId: string;
  subscriptionId?: string;
}

interface StaffAssignedPayload extends RegistrationEventPayload {
  staffId: string;
  userId: string;
  businessId: string;
  roleId?: string;
  level: string;
}
```

### Handlers

```typescript
// File: registrations/events/handlers/notification-handler.ts
export function createNotificationHandlers(eventBus: FirdausEventBus) {
  eventBus.on(RegistrationEventType.USER_REGISTERED, async (event) => {
    const payload = event.payload as UserRegisteredPayload;
    await createNotification({
      userId: payload.invitedById,
      title: "User invited",
      message: `Invited ${payload.email} to ${payload.context} team`,
      type: "INFO",
      referenceType: "user",
      referenceId: payload.userId,
    });
  });

  eventBus.on(RegistrationEventType.BUSINESS_CREATED, async (event) => {
    const payload = event.payload as BusinessCreatedPayload;
    await createNotification({
      userId: payload.createdById,
      title: "Business created",
      message: `Created ${payload.name}`,
      type: "SUCCESS",
      referenceType: "business",
      referenceId: payload.businessId,
    });
  });
}

// File: registrations/events/handlers/activity-handler.ts
export function createActivityHandlers(eventBus: FirdausEventBus) {
  eventBus.on(RegistrationEventType.USER_REGISTERED, async (event) => {
    const payload = event.payload as UserRegisteredPayload;
    await recordActivity({
      userId: payload.invitedById,
      action: `user.invited.${payload.context}`,
      resourceType: "user",
      resourceId: payload.userId,
      metadata: { email: payload.email },
    });
  });

  eventBus.on(RegistrationEventType.BUSINESS_CREATED, async (event) => {
    const payload = event.payload as BusinessCreatedPayload;
    await recordActivity({
      userId: payload.createdById,
      action: "business.created",
      resourceType: "business",
      resourceId: payload.businessId,
      metadata: { name: payload.name },
    });
  });
}

// File: registrations/events/handlers/audit-handler.ts
export function createAuditHandlers(eventBus: FirdausEventBus) {
  eventBus.on(RegistrationEventType.USER_REGISTERED, (event) => {
    // EventBus.emit already writes auditLog automatically
    // (FirdausEventBus auto-audits every event — lines 50-62)
  });
}

// File: registrations/events/handlers/email-handler.ts
export function createEmailHandlers(eventBus: FirdausEventBus) {
  eventBus.on(RegistrationEventType.INVITE_SENT, async (event) => {
    const payload = event.payload as InviteSentPayload;
    await sendStaffInviteEmail(payload.email, payload.tempPassword, payload.invitedByName, "Enkai Business");
  });
}
```

### Engine Integration

```typescript
// Before — direct service calls
await createNotification({ ... });
await recordActivity({ ... });
await recordAuditLog({ ... });

// After — emit domain event
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { RegistrationEventType } from "./events";

await firdausEventBus.emit({
  type: RegistrationEventType.USER_REGISTERED,
  payload: {
    timestamp: new Date().toISOString(),
    correlationId: userId,
    userId,
    email: input.email,
    context,
    invitedById,
    businessId: input.businessId,
  },
});
```

### Handler Registration

```typescript
// File: registrations/events/index.ts
export function registerRegistrationEventHandlers(eventBus: FirdausEventBus) {
  createNotificationHandlers(eventBus);
  createActivityHandlers(eventBus);
  createAuditHandlers(eventBus);
  createEmailHandlers(eventBus);
}

// Called at app startup:
// app/layout.tsx or server initialization
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { registerRegistrationEventHandlers } from "@/server/registrations/events";

registerRegistrationEventHandlers(firdausEventBus);
```

---

## 7. Multi-Industry Readiness

### Commerce Assumptions Inventory

| # | Assumption | Location | Blocks |
|---|---|---|---|
| 1 | `Staff.userId @unique` — one staff per user globally | `prisma/schema.prisma:718` | Healthcare (doctor at 2 hospitals), Education (teacher at 2 schools) |
| 2 | `level: storeId ? "store" : branchId ? "branch" : "business"` | `registrations/context/index.ts:104` | Healthcare: ward/department, Mining: pit/site, Agriculture: field/farm |
| 3 | `branchId` + `storeId` in all input schemas | `registrations/shared/schemas.ts` | All non-Commerce industries |
| 4 | `branchId` + `storeId` in invite records | `registrations/shared/invite.ts` | All non-Commerce invite flows |
| 5 | Subscription always created | `registrations/business/index.ts:98-140` | Agriculture (seasonal), Education (term), non-profit |
| 6 | Wallet always created | `registrations/business/index.ts:110` | Non-subscription industries |
| 7 | Setup fee transaction | `registrations/business/index.ts:121` | Zero-setup-fee industries |
| 8 | QR pricing import (`QR_CODE_STICKER_COUNT`) | `registrations/business/index.ts:119-121` | Mining, Logistics (no QR need) |
| 9 | `BusinessPricingInfo` includes `qrPrintingFee` | `registrations/business/index.ts:17-22` | Any non-Commerce industry |
| 10 | Hardcoded settings `daily_price` + `setup_fee` | `registrations/business/index.ts:139-140` | Non-pricing-based industries |
| 11 | `COMMERCE_BASE_PRICE_PER_DAY` | `subscriptions/constants/pricing.ts:1` | Non-Commerce pricing models |
| 12 | `"retail"`/`"wholesale"` mode branching | `subscriptions/constants/pricing.ts:46-48` | Healthcare (inpatient/outpatient), Mining (extraction/processing) |
| 13 | `StaffAssignment.level` free-text string (no enum) | `prisma/schema.prisma` | No validation boundary for any industry's levels |
| 14 | Grace period hardcoded to 30 days | `registrations/business/index.ts` | Seasonal businesses (Agriculture: harvest cycle) |
| 15 | Subscription interval logic hardcoded (DAILY/WEEKLY/MONTHLY/YEARLY) | `registrations/business/index.ts` | Education: term-based, Agriculture: harvest-based |
| 16 | Owner role slug hardcoded as `"owner"` | `registrations/business/index.ts` | Industries with different role naming |

### Industry Impact Matrix

| Industry | Breaking Assumptions | Workaround Possible? | Effort |
|---|---|---|---|
| **Healthcare** | 1, 2, 3, 4, 5, 12, 13 | No — Staff @unique is schema-level, requires migration | Large |
| **Agriculture** | 2, 3, 4, 5, 6, 7, 14, 15, 16 | Partial — can disable subscription, but hierarchy requires schema change | Medium |
| **Mining** | 2, 3, 4, 5, 8, 9, 12, 13 | No — hierarchy levels and pricing model are incompatible | Large |
| **Education** | 2, 3, 4, 5, 6, 14, 15, 16 | Partial — no subscription works, but term-based billing needs new interval logic | Medium |
| **Logistics** | 2, 3, 4, 5, 8, 9, 12, 13 | No — mode system (retail/wholesale) doesn't map to fleet/delivery | Large |

### Verdict: Not production-ready for non-Commerce industries

Current architecture requires **schema migrations + engine modifications + new resolvers** for each new industry. The `BusinessType` model provides the right abstraction but has zero driving behavior. Without the BusinessType resolver architecture (Section 5), every industry addition is a rewrite.

---

## 8. Final Refactoring Roadmap

### P0 — Immediate Fixes (Effort: Small, Risk: Low)

| # | Task | Files | Effort | Risk | Impact |
|---|---|---|---|---|---|
| P0.1 | Initialize event bus at app startup — call `registerRegistrationEventHandlers()` | `app/layout.tsx` or app init, `modules/ai/events/event-bus.ts` | 1h | Low | Unlocks event-driven architecture foundation |
| P0.2 | Add `businessTypeId` to `CreateBusinessInput` and pass through engine | `registrations/shared/schemas.ts`, `registrations/business/index.ts` | 2h | Low | Enables BusinessType to eventually drive behavior |
| P0.3 | Audit that `invite-team-action.ts` `ensureManagerProfile` violates no rules | `features/sales-network/actions/invite-team-action.ts` | 1h | Low | Confirms no registration bypass remains |

### P1 — Architecture Stabilization (Effort: Medium, Risk: Medium)

| # | Task | Files | Effort | Risk | Impact |
|---|---|---|---|---|---|
| P1.1 | Create `BusinessTypeService` with basic CRUD + query by slug | New file: `features/business-types/services/business-type-service.ts` | 2d | Low | First step to make BusinessType useful |
| P1.2 | Create `BusinessTypeConfig` type and load it in engine | `registrations/business/types.ts`, `registrations/business/index.ts` | 2d | Low | Engine can read BusinessType config |
| P1.3 | Make subscription creation conditional on `BusinessTypeConfig.subscription.required` | `registrations/business/index.ts` | 1d | Medium | Breaks existing Commerce behavior if misconfigured |
| P1.4 | Add `BusinessTypeResolver` interface + `CommerceResolver` implementation | `registrations/resolvers/pricing.ts`, `registrations/resolvers/hierarchy.ts` | 3d | Medium | Decouples industry logic from engine |
| P1.5 | Migrate `StaffAssignment.level` from free-text to enum or validated field | `prisma/schema.prisma`, `registrations/context/index.ts` | 3d | High | Schema migration required — but unblocks industry safety |
| P1.6 | Replace direct notification/activity/audit calls with domain event emissions | `registrations/user/index.ts`, `registrations/business/index.ts` | 3d | Medium | Decouples cross-cutting concerns |

### P2 — Industry Abstraction (Effort: Large, Risk: High)

| # | Task | Files | Effort | Risk | Impact |
|---|---|---|---|---|---|
| P2.1 | Remove `Staff.userId @unique` — add `@@unique([userId, businessId])` | `prisma/schema.prisma`, migration | 2d | High | Schema migration, data dedup, query updates |
| P2.2 | Merge `Staff` + `StaffAssignment` into `BusinessStaff` | `prisma/schema.prisma`, all consumers | 5d | High | Touches every feature using Staff/StaffAssignment |
| P2.3 | Migrate `WorkspaceMemberRole` enum → RBAC `Role` model with `scope: WORKSPACE` | `prisma/schema.prisma`, engine adapters, all queries | 3d | Medium | Eliminates one of three role systems |
| P2.4 | Remove `StaffAssignment.roleId` — use `UserRole` exclusively | `prisma/schema.prisma`, all consumers | 2d | Medium | Eliminates role assignment duplication |
| P2.5 | Create Healthcare + Agriculture resolver implementations | New resolver files | 3d | Medium | Proves extensibility pattern works |
| P2.6 | Consolidate 2 invite service implementations | `invite-service.ts`, `registrations/shared/invite.ts` | 1d | Low | Eliminates duplicate logic |
| P2.7 | Seed Healthcare + Agriculture + Education BusinessType configs | `prisma/seed.ts` | 1d | Low | Prepares data for new industries |

### P3 — Long-Term Architecture (Effort: Large, Risk: High)

| # | Task | Files | Effort | Risk | Impact |
|---|---|---|---|---|---|
| P3.1 | Add `postCreationHooks` system to both engines | `registrations/business/index.ts`, `registrations/user/index.ts` | 3d | Medium | Extensibility for industry-specific provisioning |
| P3.2 | Add `BusinessType`-driven module provisioning | Business engine, module service | 3d | Medium | Each industry gets relevant modules only |
| P3.3 | Standardize membership status tracking across all models | All membership models | 3d | Medium | Consistency across WorkspaceMember, Staff, SalesProfile |
| P3.4 | Add permissions check to all registration flows | Engine + action callers | 2d | Medium | Security hardening |
| P3.5 | Convert `StaffForm` to use shared `InviteForm` with additive steps | `features/staff/components/staff-form.tsx` | 2d | Low | UI consistency |
| P3.6 | Add industry-specific event handlers (Healthcare compliance audit, Agriculture seasonal notifications) | New handler files | 5d | Medium | Proves domain event extensibility |

### Migration Order

```
P0     P1          P2              P3
│      │           │               │
├──────┤           │               │
│Event │           │               │
│init  │           │               │
├──────┤           │               │
│      ├───────────┤               │
│      │BusinessTyp│               │
│      │eService   │               │
│      ├───────────┤               │
│      │Conditional│               │
│      │Subscriptio│               │
│      ├───────────┤               │
│      │Resolvers  │               │
│      ├───────────┤               │
│      │Domain     ├───────────────┤
│      │Events     │               │
│      │           │Remove         │
│      │           │Staff @unique  │
│      │           ├───────────────┤
│      │           │Merge Staff +  │
│      │           │StaffAssign    │
│      │           ├───────────────┤
│      │           │Migrate        │
│      │           │WorkspaceRole  │
│      │           ├───────────────┤
│      │           │New Industries │
│      │           ├───────────────┤
│      │           │               │Post-creation
│      │           │               │hooks
│      │           │               ├───────────
│      │           │               │Module
│      │           │               │provisioning
│      │           │               ├───────────
│      │           │               │StaffForm
│      │           │               │consolidation
│      │           │               ├───────────
│      │           │               │Security
│      │           │               │hardening
└──────┴───────────┴───────────────┴───────────
Time ──────────────────────────────────────────→
```

---

## Appendix A: Event Bus Current State

```
FirdausEventBus
├── 10 event types in enum
├── 4 emit helper functions defined (SaleCreated, PurchaseCreated, InvoicePaid, ExpenseCreated)
├── 6 event types WITH NO emit helpers (StockTransferCreated, CustomerCreated, SupplierCreated, PaymentReceived, InventoryAdjusted, CreditGiven)
├── 0 emit helper functions called from any service or engine
├── registerDefaultHandlers() defined but NEVER called
├── registerAutomationHandlers() defined but NEVER called
└── Status: COMPLETELY DORMANT — zero runtime execution paths
```

## Appendix B: BusinessType Seed Status

```
prisma/seed.ts
└── BusinessType seed (lines 11-57)
    ├── Only ONE BusinessType seeded: "Commerce"
    ├── 3 modes: retail, wholesale, both
    ├── 16 modules: catalog (required), inventory (required), sales (required), pos (optional), ...
    └── 2 catalog types: product, service

NOT seeded:
    ├── Healthcare ❌
    ├── Agriculture ❌
    ├── Mining ❌
    ├── Education ❌
    └── Logistics ❌
```

## Appendix C: Staff @unique Constraint Impact

```prisma
model Staff {
  userId   String   @unique   // ← THIS LINE
  // ...
}
```

**Impact:** The `@unique` on `Staff.userId` means a user can only have one `Staff` profile in the entire system. If Dr. Aisha works at both "Mikocheni Hospital" and "Aga Khan Hospital", she cannot be created as `Staff` for both.

The `businessAdapter` (context system) guards against this:
```typescript
const existingStaff = await (tx as typeof prisma).staff.findUnique({
  where: { userId },
});
if (!existingStaff) {
  // Only creates Staff if none exists
}
```

This means the second business registration silently skips Staff creation. Dr. Aisha's second hospital would NOT get a staff record. She would have no employeeCode, position, or hireDate at the second hospital.
