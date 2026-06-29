# Shared Registration Engine

Consolidates user/staff registration and business creation into reusable engines, eliminating duplicated logic across the codebase.

## Compliance Status

| Requirement | Status | Issues |
|---|---|---|
| **User Registration** — all users through `UserRegistrationEngine` or `createAuthUser` | ✅ Compliant | All 3 direct `prisma.user.create` bypasses eliminated. Lead conversion uses `createAuthUser()` (engine utility). Onboarding uses `UserRegistrationEngine.register(WORKSPACE)`. Self-registration via `auth.api.signUpEmail` accepted as separate domain. |
| **Business Registration** — sole path through `BusinessRegistrationEngine` | ✅ Compliant | All 5 `prisma.business.create` bypasses eliminated. `onboarding-service.ts`, `business-setup.ts` refactored. Legacy service files (`business-service.ts` x2, `server/actions/businesses.ts`) deleted. ESLint rule enforces ban. |
| **UI Consolidation** — shared `InviteForm` component | ✅ Done | Shared `InviteForm` with `PersonalInfoStep`, `GenderSelectStep`, `RoleAssignStep`, `StepIndicator`. `UserInviteForm` and `InviteTeamMemberForm` are thin wrappers (~20 lines each). `StaffForm` remains unconverted (has additional staff-specific fields). |
| **Legacy Service Cleanup** — `server/services/lead-service.ts`, `sales-service.ts`, `workspace-service.ts`, `rbac-service.ts` | ✅ Deleted | All 4 legacy duplicates deleted. Consumers (`server/actions/leads.ts`, `sales.ts`, `workspaces.ts`, `rbac.ts`) now import from canonical `features/*/services/` equivalents. |
| **Invite existing-user path** — `invite-team-action.ts` | ✅ Engine | Existing-user path now uses `UserRegistrationEngine.assignUserToContext()` instead of inline `prisma.salesProfile.create` + `prisma.userInvite.create`. |
| **Legacy `prisma.user.create` bypasses** | **0 remaining** ✅ | All 3 direct calls eliminated from lead-service.ts x2 and onboarding-service.ts. ESLint enforces ban. |
| **Event Bus Activation** — registration domain events | ✅ Active | 3 registration event types (`UserRegistered`, `UserAssignedToContext`, `BusinessCreated`) extended on existing `FirdausEventBus`. Emit helpers call `firdausEventBus.emit()`. Commerce handlers also activated via `registerDefaultHandlers()`. Auto-initialized on module load. |
| **BusinessTypeResolver** — industry abstraction | ✅ 3 resolvers | `BusinessTypeResolver` interface + `CommerceResolver`, `HealthcareResolver`, `AgricultureResolver` implementations. `DbBusinessTypeResolver` auto-selects by slug. Level resolution, pricing, subscription rules extracted from engine into resolver. |
| **BusinessTypeService** — DB-driven config | ✅ Active | `BusinessTypeService` at `business-type/service.ts` with `findById`, `findBySlug`, `findAllActive`. Seeded with Commerce, Healthcare, Agriculture types. |
| **Permission Checks** — registration security | ✅ Added | `hasPermission("users.invite")` guards `UserRegistrationEngine.register()` and `assignUserToContext()`. `hasPermission("businesses.create")` guards `BusinessRegistrationEngine.register()`. |
| **Conditional Subscription** — non-subscription industries unblocked | ✅ Done | `resolver.requiresSubscription()` controls whether subscription + wallet + pricing settings are created. Agriculture, Education, NGO now possible without engine changes. |
| **Staff Multi-Business** — `Staff.userId @unique` removed | ✅ Migrated | `@@unique([userId, businessId])` enables staff at multiple businesses. 4 callers updated (`findUnique` → `findFirst`). User relation renamed `staffProfile` → `staffProfiles`. |
| **Invite Consolidation** — 3 duplications eliminated | ✅ Unified | `generateTempPassword`/`generateToken` now re-exported from canonical source. `sendStaffInviteEmail` delegates to `sendInviteEmail`. 3 inline `prisma.userInvite.create` replaced with `createUserInviteRecord()`. |
| **Workspace → RBAC Migration** | ✅ Done | `WORKSPACE` added to `RoleScope`. 4 workspace roles seeded. `workspaceAdapter` + `workspace-service.ts` create/update/remove `UserRole` records alongside `WorkspaceMember`. |
| **Schema Migration Required** | ⚠️ Run `npx prisma migrate dev` | RoleScope (+WORKSPACE), Staff (userId @unique removed → @@unique userId+businessId), User (staffProfile → staffProfiles) |

---

# COMPLIANCE AUDIT REPORT

## CURRENT STATE

| Metric | Count |
|---|---|---|
| Total user creation entry points | 10 (5 through engine/utility, 3 auth self-registration, 1 system hook, 1 still auth.api.signUpEmail direct) |
| Total business creation paths | 6 (all through engine — 2 legacy files deleted) |
| Total direct Prisma creation calls | 30 across 12 files (4 legacy service files + 3 inline invite creates → shared helper) |
| Direct `prisma.userInvite.create` calls | **0** — all use `createUserInviteRecord()` |
| Direct `prisma.staff.create` calls | 3 (all inside engines — acceptable) |
| Direct `prisma.business.create` calls | **0** — all through engine |
| Direct `prisma.user.create` calls outside engine | **0** ✅ |
| Direct `prisma.user.upsert` calls outside engine | 2 (lib/auth.ts hook + seed — acceptable) |
| Direct `prisma.business.create` calls outside engine | **0** ✅ |
| Legacy server/service duplicate files deleted | **4** ✅ (lead-service, sales-service, workspace-service, rbac-service) |
| Distinct invite form implementations | 3 (2 refactored to shared InviteForm) |

---

## USER CREATION PATHS — 12 entry points

### Compliant (5 of 12 — 42%)

| # | Path | File | Method |
|---|---|---|---|
| 1 | `StaffRegistrationEngine.register` | `registrations/staff/index.ts:34` | via engine |
| 2 | `admin-user-service` | `features/users/services/admin-user-service.ts:26` | delegates to engine |
| 3 | `createWorkspaceForLead` | `onboarding-service.ts:185` | `UserRegistrationEngine.register(WORKSPACE)` ✅ Fixed |
| 4 | Lead conversion (feature) | `leads/services/lead-service.ts:170` | `createAuthUser()` (engine utility) ✅ Fixed |
| 5 | Lead conversion (legacy) | `server/services/lead-service.ts:201` | `createAuthUser()` (engine utility) ✅ Fixed |

### Non-compliant / Accepted (5 of 10 — 50%)

| # | Path | File | Method | Status |
|---|---|---|---|---|
| 6 | `inviteSalesTeamMemberAction` | `sales-network/actions/invite-team-action.ts` | `UserRegistrationEngine.register(SALES_TEAM)` for new users; `assignUserToContext()` for existing | ✅ Engine for both paths |
| 7 | `registerCustomerBusinessAction` | `sales-team/register/actions.ts:25` | Pre-existing user only | Acceptable — user created by lead conversion |
| 8 | `registerAction` | `auth/actions/index.ts:70` | `auth.api.signUpEmail` | Self-registration (acceptable) |
| 9 | `auth-service.signUp` | `auth/services/auth-service.ts:34` | `auth.api.signUpEmail` | Same |
| 10 | `public register page` | `(auth)/register/page.tsx:77` | `authClient.signUp.email` | Client-side signup |
| 11 | Auth DB hook | `lib/auth.ts:102` | `prisma.user.upsert` | System hook — acceptable |

**Architectural Violation (FIXED):** All 3 paths that called `prisma.user.create` directly (5, 10, 11) now use engine utilities with Better Auth integration. ✅

---

## BUSINESS CREATION PATHS — 6 code paths

### Compliant (6 of 6 — 100% ✅)

| # | Path | File | Method |
|---|---|---|---|
| 1 | `BusinessRegistrationEngine.register` | `registrations/business/index.ts:25` | Canonical engine |
| 2 | `createBusinessAction` (features) | `features/businesses/actions/index.ts:20` | Delegates to engine ✅ |
| 3 | `registerCustomerBusinessAction` | `sales-team/register/actions.ts:25` | Workspace pre-step → engine call ✅ |
| 4 | `createWorkspaceForLead` | `onboarding-service.ts:166` | `UserRegistrationEngine` + `BusinessRegistrationEngine` ✅ Fixed |
| 5 | `createBusiness` (Enkai workflow) | `features/enkai/workflows/business-setup.ts:23` | Delegates to engine ✅ Fixed |
| — | Legacy `createBusiness` (features) | `features/businesses/services/business-service.ts` | **DELETED** |
| — | Legacy `createBusiness` (server) | `server/services/business-service.ts` | **DELETED** |
| — | Legacy `createBusinessAction` (server) | `server/actions/businesses.ts` | **DELETED** |

All business creation now flows through `BusinessRegistrationEngine.register()`. Legacy service files removed. ✅

---

## MEMBERSHIP CREATION PATHS — 45 direct Prisma calls across 23 files

### WorkspaceMember (1 call, 0 through engine)

| File | Line | Violation |
|---|---|---|
| `features/workspaces/services/workspace-service.ts` | 115 | Direct create — bypasses engine |

### SalesProfile (5 calls, 0 through engine)

| File | Line | Violation |
|---|---|---|
| `features/sales-network/actions/team-actions.ts` | 79 | Direct create |
| `features/sales-network/actions/team-actions.ts` | 300 | Direct create |
| `features/sales-network/services/profile-service.ts` | 41 | Direct create (post-registration management) |
| `features/sales-network/actions/invite-team-action.ts` | 117 | Manager profile — not registration flow |
| `features/sales-network/actions/invite-team-action.ts` | 125 | `ensureManagerProfile` — not registration flow |

### Staff (2 calls, 2 through engine — compliant)

| File | Line | Status |
|---|---|---|
| `registrations/business/index.ts` | 64 | Inside engine ✅ |
| `sales-team/register/actions.ts` | 98 | Acceptable (duplicate path but uses same pattern) |

### StaffAssignment (4 calls, 2 through engine, 2 outside)

| File | Line | Status |
|---|---|---|
| `registrations/business/index.ts` | 74 | Inside engine ✅ |
| `registrations/staff/index.ts` | 87 | Inside engine ✅ |
| `features/staff/services/staff-service.ts` | 153 | **Outside engine** ❌ |
| `sales-team/register/actions.ts` | 106 | Acceptable (duplicate path) |

### UserRole (7 calls, 2 through engine, 5 outside)

| File | Line | Violation |
|---|---|---|
| `registrations/business/index.ts` | 52 | Inside engine ✅ |
| `platform/roles/index.ts` | 22 | Direct create ❌ |
| `sales-team/register/actions.ts` | 87 | Duplicate path |
| `features/roles/services/assignment-service.ts` | 28 | Direct create ❌ |
| `features/rbac/services/rbac-service.ts` | 57 | Direct create ❌ |
| `prisma/seed.ts` | 362 | Seed — acceptable |
| `scripts/assign-owner-roles.ts` | 49 | Standalone script — acceptable |

### UserInvite (2 calls, 1 through engine, 1 outside)

| File | Line | Violation |
|---|---|---|
| `registrations/shared/invite.ts` | 66 | Inside engine ✅ |
| `features/users/services/invite-service.ts` | 103 | **Separate implementation** ❌ |

### Subscription (4 calls, 1 through engine, 3 outside)

| File | Line | Violation |
|---|---|---|
| `registrations/business/index.ts` | 98 | Inside engine ✅ |
| `sales-team/register/actions.ts` | 130 | Duplicate path ❌ |
| `features/subscriptions/services/subscription-service.ts` | 63 | Direct create (standalone subscribe) — acceptable |
| `server/services/subscription-service.ts` | 103 | Legacy duplicate |

### SubscriptionWallet (3 calls, 1 through engine, 2 outside)

| File | Line | Violation |
|---|---|---|
| `registrations/business/index.ts` | 108 | Inside engine ✅ |
| `sales-team/register/actions.ts` | 140 | Duplicate path ❌ |
| `features/subscriptions/wallet/services/wallet-service.ts` | 24 | Direct create (standalone wallet) — acceptable |

---

## UI DUPLICATION — Fixed

| Component | File | Steps | Role Assignment | Context | Status |
|---|---|---|---|---|---|
| `InviteForm` | `components/registrations/invite-form.tsx` | 3 | Pluggable: RBAC Role grid or SalesHierarchy picker via `context` prop | Any | ✅ Shared |
| `PersonalInfoStep` | `components/registrations/personal-info-step.tsx` | — | — | Any | ✅ Shared |
| `GenderSelectStep` | `components/registrations/gender-select-step.tsx` | — | — | Any | ✅ Shared |
| `RoleAssignStep` | `components/registrations/role-assign-step.tsx` | — | RBAC Role grid | Platform/Business | ✅ Shared |
| `StepIndicator` | `components/registrations/step-indicator.tsx` | — | — | Any | ✅ Shared |
| `UserInviteForm` | `features/users/components/user-invite-form.tsx` | Thin wrapper | Delegates to InviteForm | Platform/Business | ✅ Refactored |
| `InviteTeamMemberForm` | `features/sales-network/components/invite-team-member-form.tsx` | Thin wrapper | Delegates to InviteForm | Sales Team | ✅ Refactored |
| `StaffForm` | `features/staff/components/staff-form.tsx` | Full impl | Has extra staff fields (employeeCode, position, hireDate) | Business | ❌ Not converted |

**Before:** 3 forms with 70% duplicated field implementations (~1000 lines combined).
**After:** 1 shared `InviteForm` orchestrating 4 reusable step components. The two most-used forms (`UserInviteForm`, `InviteTeamMemberForm`) are ~20-line thin wrappers. `StaffForm` retains its custom step for staff-specific fields.

---

## DIRECT CREATION PATHS SUMMARY

| Record | Total `.create` | Outside Engine | Bypass % |
|---|---|---|---|---|
| `user` | 3 (1 createAuthUser in engine + 2 upsert) | **0** | **0% ✅** |
| `business` | 1 | **0** | **0% ✅** |
| `workspaceMember` | 1 | 1 | 100% |
| `salesProfile` | 5 | 5 | 100% |
| `staff` | 2 | 0 | 0% |
| `staffAssignment` | 4 | 2 | 50% |
| `userRole` | 7 | 5 | 71% |
| `userInvite` | 2 | 1 | 50% |
| `subscription` | 4 | 3 | 75% |
| `subscriptionWallet` | 3 | 2 | 66% |
| **TOTAL** | **32** | **19** | **59%** |

**`prisma.user.create` and `prisma.business.create` bypasses: 0. ✅ Enforced by ESLint rule.**

---

## ENGINE BYPASSES — All FIXED ✅

### User registration engine bypasses — ALL FIXED ✅

| File | What it did | Fix |
|---|---|---|
| `features/sales-network/actions/invite-team-action.ts` | `auth.api.signUpEmail` + inline `prisma.salesProfile.create` + `prisma.userInvite.create` for existing users | ✅ New users: `UserRegistrationEngine.register(SALES_TEAM)`. Existing users: `UserRegistrationEngine.assignUserToContext(SALES_TEAM)`. |
| `server/services/onboarding-service.ts` | `prisma.user.create` (no auth) | ✅ `UserRegistrationEngine.register(WORKSPACE)` |
| `features/leads/services/lead-service.ts` | `prisma.user.create` (no auth) | ✅ `createAuthUser()` (engine utility) |
| `server/services/lead-service.ts` | `prisma.user.create` (no auth) | ✅ Deleted (legacy file removed, features lead-service used instead) |

### Business registration engine bypasses — ALL FIXED ✅

| File | What it did | Fix |
|---|---|---|
| `app/platform/sales-team/register/actions.ts` | Was full duplicate of engine | ✅ Was already delegating to engine (workspace pre-step + engine call) |
| `server/services/onboarding-service.ts` | `prisma.business.create` | ✅ `BusinessRegistrationEngine.register()` |
| `features/businesses/services/business-service.ts` | `prisma.business.create` (modes only) | ✅ **DELETED** |
| `server/services/business-service.ts` | `prisma.business.create` (modes only) | ✅ **DELETED** |
| `server/actions/businesses.ts` | Called lean service | ✅ **DELETED** (was already delegating to engine) |
| `features/enkai/workflows/business-setup.ts` | `prisma.business.create` + branch + store | ✅ `BusinessRegistrationEngine.register()` |

---

## ROLE SYSTEM CONFLICTS

| System | Models | Where | Problem |
|---|---|---|---|
| Fixed enum `WorkspaceMemberRole` | `WorkspaceMember.role` | Prisma schema | Not extensible — every new workspace role requires schema migration |
| RBAC `Role` model (scope: PLATFORM/BUSINESS) | `UserRole`, `StaffAssignment.roleId` | `Role` table | Cannot represent workspace roles (no WORKSPACE scope) or sales hierarchy |
| Sales hierarchy | `SalesProfile.hierarchyId` → `SalesHierarchy` | `SalesHierarchy` table | Cannot represent RBAC permissions — only title/level |

**Conflicts:**
1. A user can be a `WorkspaceMember.role = "ADMIN"` AND have `UserRole(admin)` AND have `SalesProfile(hierarchyId = managerId)` — 3 parallel, unreconciled role assignments
2. `StaffAssignment.roleId` duplicates what `UserRole` already provides — both assign roles but through different models
3. No `Role.scope = WORKSPACE` exists — workspace roles cannot use the RBAC system

---

## COMMERCE COUPLING RISKS

| Location | Assumption | Blocks |
|---|---|---|
| `registrations/staff/index.ts:91` | `level: storeId ? "store" : branchId ? "branch" : "business"` | Healthcare (ward/department), Mining (pit/site), Agriculture (field/farm) |
| `shared/schemas.ts:12-13` | `branchId` + `storeId` in staff input | Any non-Commerce hierarchy |
| `shared/invite.ts:58-59,72-73` | `branchId` + `storeId` in invite records | Any non-Commerce invite |
| `business/index.ts:98-140` | Subscription + Wallet always created | Farm (seasonal), Education (term), non-profit |
| `business/index.ts:119-121` | QR pricing import (`QR_CODE_STICKER_COUNT`) | Mining, Logistics, Agriculture (no QR) |
| `business/index.ts:17-22` | `BusinessPricingInfo` includes `qrPrintingFee` | Any non-Commerce industry |
| `business/index.ts:139-140` | Hardcoded keys `daily_price` + `setup_fee` | Subscription-free industries |
| `subscriptions/constants/pricing.ts:1` | `COMMERCE_BASE_PRICE_PER_DAY` | Base price is Commerce-specific |
| `subscriptions/constants/pricing.ts:46-48` | `"retail"`/`"wholesale"` mode branching | Healthcare (inpatient/outpatient), Mining (extraction/processing) |
| Prisma schema | `StaffAssignment.level` free-text string | Invalid levels can be stored |

---

## MULTI-INDUSTRY RISKS

| Risk | Severity | Details |
|---|---|---|
| `Staff.userId @unique` | HIGH | User can only be staff at ONE business. Doctor at 2 hospitals, Chef at 2 restaurants, Consultant at 2 firms = impossible |
| `StaffAssignment.level` no enum | HIGH | Any code can write any string. No validation boundary |
| Branch→Store hierarchy mandatory | HIGH | `StaffAssignment`, `UserInvite`, schemas all assume Business→Branch→Store. No generic `locationId`/`locationType` pattern |
| Subscription always mandatory | HIGH | No "no subscription" mode in engine. Creates Subscription + Wallet + Transaction for every business |
| Commerce pricing model | HIGH | `dailyPrice` + `setupFee` + `qrPrintingFee` embedded in generic engine. No pricing resolver abstraction |
| 3 incompatible role systems | MEDIUM | Fixed enum, RBAC, and SalesHierarchy cannot interoperate. Cross-context user management is fragmented |
| "retail"/"wholesale" modes assumed | MEDIUM | Pricing logic branches on Commerce-specific mode strings |
| No industry hooks in engine | HIGH | Post-creation behavior is identical for all industries. No `BusinessType`-driven provisioning or validation |

---

## MISSING DOMAIN EVENTS

### Current state: A custom `FirdausEventBus` exists but is completely dormant

| Check | Status |
|---|---|
| Event bus implementation | ✅ `src/modules/ai/events/event-bus.ts` — in-process pub/sub with Map<EventType, Handler[]> |
| Event types defined (10) | ✅ SaleCreated, PurchaseCreated, InvoicePaid, ExpenseCreated, StockTransferCreated, CustomerCreated, SupplierCreated, PaymentReceived, InventoryAdjusted, CreditGiven |
| Emit helper functions defined | ✅ `emitSaleCreated`, `emitPurchaseCreated`, `emitInvoicePaid`, `emitExpenseCreated` |
| Handler registrations defined | ✅ `registerDefaultHandlers()`, `registerAutomationHandlers()` |
| **Any emit function called from services** | ❌ **ZERO** — dead code, never invoked |
| **Any handler registered during app boot** | ❌ **ZERO** — `registerDefaultHandlers()` never called |
| **Registration events** (UserRegistered, StaffAssigned, BusinessCreated, etc.) | ❌ **NONE** — no event types defined for registration flows |

### Gaps

The registration engine directly calls:
- `createNotification(...)` — should emit `UserRegistered` / `BusinessCreated`
- `recordActivity(...)` — should emit `StaffAssigned`
- `recordAuditLog(...)` — duplicates what the event bus already does automatically

### Required new event types

| Event | When | Context |
|---|---|---|
| `UserRegistered` | User created | All contexts |
| `StaffAssigned` | Staff + Assignment created | BUSINESS |
| `BusinessCreated` | Business created | BUSINESS |
| `WorkspaceMemberAdded` | WorkspaceMember created | WORKSPACE |
| `SalesAgentRegistered` | SalesProfile created | SALES_TEAM |
| `SubscriptionCreated` | Subscription created | BUSINESS |

---

## ARCHITECTURAL VIOLATIONS — RESOLVED

| # | Violation | Severity | Status |
|---|---|---|---|
| 1 | 3 lead/onboarding paths create users via `prisma.user.create` with no auth | HIGH | ✅ All 3 fixed — use `createAuthUser()` or engine. Legacy `server/services/lead-service.ts` deleted. |
| 2 | `invite-team-action.ts` combines auth signup + SalesProfile creation inline instead of using engine | HIGH | ✅ Both new-user and existing-user paths use engine. Dead code removed. |
| 3 | `registerCustomerBusinessAction` is a full duplicate of BusinessRegistrationEngine (150 lines copied) | HIGH | ✅ Already delegating to engine (workspace pre-step + engine call). |
| 4 | Engines have no RegistrationContext parameter — context is inferred implicitly | MEDIUM | ✅ `UserRegistrationEngine` uses explicit `RegistrationContext` enum. |
| 5 | `BusinessType` is modeled, seeded, and partially plumbed but completely ignored by registration engine | MEDIUM | ❌ Still not wired — no `BusinessTypeService` exists. |
| 6 | 10 hardcoded Commerce-specific assumptions in the registration engines | HIGH | ❌ Still present — no `BusinessType`-driven resolvers. |
| 7 | 4 legacy/feature service pairs with identical logic | MEDIUM | ✅ All 4 legacy files deleted (`lead-service`, `sales-service`, `workspace-service`, `rbac-service`). |
| 8 | 2 separate invite service implementations with different field support | LOW | ❌ Still exists — `invite-service.ts` vs `registrations/shared/invite.ts`. |
| 9 | Registration flows tightly coupled to notification/activity/audit services — no domain events | MEDIUM | ❌ Still direct calls. |
| 10 | 3 invite forms with 70% duplicated field implementations | LOW | ✅ 2 of 3 refactored to shared `InviteForm`. `StaffForm` not converted. |

---

## RECOMMENDED REFACTOR

### Phase 1: Fix P0 gaps (incomplete)

| Fix | Status |
|---|---|
| Owner Staff + StaffAssignment in BusinessRegistrationEngine | ✅ Applied |
| Business creation audit trail in engine | ✅ Applied |
| Owner Staff in sales-team register action | ✅ Applied |
| **Still missing:** 4 other paths lack owner staff + audit trail | ❌ Not done |

### Phase 2: Create UserRegistrationEngine (P1)

```typescript
// Current:
StaffRegistrationEngine.register(invitedById, staffInput)

// Target:
UserRegistrationEngine.register(context: RegistrationContext, input: RegisterUserInput)
```

With 4 context adapters:

| Context | Creates | Role System |
|---|---|---|
| PLATFORM | User + UserRole | RBAC Role.scope = PLATFORM |
| WORKSPACE | User + WorkspaceMember | RBAC Role.scope = WORKSPACE |
| BUSINESS | User + Staff + StaffAssignment + UserRole | RBAC Role.scope = BUSINESS |
| SALES_TEAM | User + SalesProfile | SalesHierarchy |

### Phase 3: Enforce BusinessRegistrationEngine as sole path (P1)

1. Extract workspace pre-step from `registerCustomerBusinessAction`, call engine for business portion
2. Add "no subscription" mode or BusinessType-driven conditional to engine for `createWorkspaceForLead`
3. Retire `server/actions/businesses.ts` and both `business-service.ts` files

### Phase 4: Wire BusinessType (P1)

1. Add `businessTypeId` to `CreateBusinessInput`
2. Create `BusinessTypeService` with basic CRUD + queries
3. Load BusinessType in engine to drive: subscription requirement, pricing resolver, valid hierarchy levels

### Phase 5: Build shared InviteForm UI (P2) — ✅ Done

```tsx
<InviteForm
  context={context}           // "platform" | "workspace" | "business" | "sales_team"
  businessId={businessId}     // for business context
  roles={roles}               // for platform/business context
  hierarchyOptions={hierarchies} // for sales_team context
  action={serverAction}       // context-specific server action
/>
```

Extracted `PersonalInfoStep`, `GenderSelectStep`, `RoleAssignStep`, `StepIndicator` as shared components at `src/components/registrations/`.

`UserInviteForm` and `InviteTeamMemberForm` are now thin wrappers that wire context-specific actions/props to the shared `InviteForm`.

**Not yet converted:** `StaffForm` — has additional staff-specific fields (employeeCode, position, hireDate) that don't fit the current shared step pattern.

### Phase 6: Abstract Commerce coupling (P2)

| Current | Target |
|---|---|
| `level: storeId ? "store" : branchId ? "branch" : "business"` | `levelResolver.resolve(businessTypeId, input)` |
| `QR_CODE_STICKER_COUNT` import | `pricingResolver.getAddOns(businessTypeId)` |
| Hardcoded `dailyPrice`/`setupFee`/`qrPrintingFee` | `pricingResolver.getPricingConfig(businessTypeId, modes)` |
| Mandatory subscription | `businessTypeConfig.requiresSubscription` |
| `branchId`/`storeId` in schemas | `hierarchyConfig.getValidLevels(businessTypeId)` |

### Phase 7: Activate domain events (P2)

1. Define registration event types: `UserRegistered`, `StaffAssigned`, `BusinessCreated`, `WorkspaceMemberAdded`, `SalesAgentRegistered`, `SubscriptionCreated`
2. Replace direct notification/activity/audit calls in engines with event emissions
3. Create handlers that translate events → notification + activity + audit log
4. Initialize event bus with `registerDefaultHandlers()` during app startup

### Phase 8: Membership consolidation (P3)

1. Migrate `WorkspaceMemberRole` enum → RBAC `Role` model with `scope: WORKSPACE`
2. Eliminate `StaffAssignment.roleId` → `UserRole` with location scope
3. Standardize status tracking (boolean → enum where appropriate)

---

## TARGET END STATE

```
src/server/registrations/
├── index.ts
├── shared/
│   ├── schemas.ts          # RegisterUserInput (context-agnostic)
│   ├── response.ts         # RegistrationResponse<T>
│   ├── user-creation.ts    # createAuthUser()
│   └── invite.ts           # Password gen, invite records, email
├── user/
│   └── index.ts            # UserRegistrationEngine (4 contexts)
├── business/
│   └── index.ts            # BusinessRegistrationEngine (industry-aware)
├── adapters/
│   ├── platform.ts         # PlatformStaffAdapter
│   ├── workspace.ts        # WorkspaceMemberAdapter
│   ├── business.ts         # BusinessStaffAdapter
│   └── sales-team.ts       # SalesAgentAdapter
└── resolvers/
    ├── pricing.ts          # PricingResolver (per BusinessType)
    ├── hierarchy.ts        # LevelResolver (per BusinessType)
    └── settings.ts         # SettingKeysResolver (per BusinessType)
```

**Key properties:**
- Every user flows through `UserRegistrationEngine.register(context, input)`
- Every business flows through `BusinessRegistrationEngine.register(input)`
- BusinessType drives industry-specific behavior
- Domain events replace direct service calls
- Shared `InviteForm` component for all invite UIs
- Commerce assumptions abstracted behind BusinessType resolvers

---

## MIGRATION ORDER (P0 → P3)

| Order | Phase | Tasks | Effort | Impact |
|---|---|---|---|---|
| 1 | P0 | Complete missing audit trails on remaining 4 business creation paths | Small | ✅ Done |
| 2 | P1 | Refactor `invite-team-action.ts` → UserRegistrationEngine(SALES_TEAM) | Medium | ✅ Both new + existing-user paths |
| 3 | P1 | Wire `businessTypeId` through BusinessRegistrationEngine + CreateBusinessInput | Medium | ✅ Done |
| 4 | P1 | Delete `server/actions/businesses.ts` + both `business-service.ts` files | Small | ✅ **DELETED** |
| 5 | P1 | Add audit trail to `registerCustomerBusinessAction` | Small | ✅ Done |
| 6 | P2 | Split `registerCustomerBusinessAction` — workspace pre-step + engine call | Medium | ✅ Already done |
| 7 | P2 | Eliminate `prisma.user.create` bypasses in lead-service.ts x2 | Medium | ✅ `createAuthUser()` + legacy file deleted |
| 8 | P2 | Refactor `createWorkspaceForLead` to use engine | Medium | ✅ Done |
| 9 | P2 | Delete 4 remaining legacy service files | Medium | ✅ **DELETED** (lead, sales, workspace, rbac) |
| 10 | P2 | Build shared InviteForm component | Medium | ✅ Done |
| 11 | P2 | Add ESLint enforcement rule | Small | ✅ Done |
| 12 | P2 | Create BusinessTypeService + businessTypeId UI selector | Medium | Pending |
| 13 | P2 | Activate domain events for registration flows | Medium | Pending |
| 14 | P3 | Abstract Commerce coupling behind BusinessType resolvers | Large | Pending |
| 15 | P3 | Migrate WorkspaceMemberRole → RBAC Role model | Large | Pending |
| 16 | P3 | Eliminate StaffAssignment.roleId redundancy | Large | Pending |
| 17 | P3 | Standardize membership status tracking | Medium | Pending |

```
src/server/registrations/
├── index.ts              # Top-level re-exports
├── shared/
│   ├── index.ts          # Re-exports all shared utilities
│   ├── schemas.ts        # Input/output type definitions
│   ├── response.ts       # RegistrationResponse<T> + helpers
│   ├── user-creation.ts  # Better Auth user creation
│   └── invite.ts         # Password gen, email, invite records
├── context/
│   └── index.ts          # RegistrationContext enum + 4 context adapters
├── staff/
│   └── index.ts          # StaffRegistrationEngine (legacy, delegating)
├── user/
│   └── index.ts          # UserRegistrationEngine (multi-context)
└── business/
    └── index.ts          # BusinessRegistrationEngine (business + subscription creation)
```

## StaffRegistrationEngine

Creates a user + staff member + invite in a single transaction.

```typescript
import { StaffRegistrationEngine } from "@/server/registrations";

const result = await StaffRegistrationEngine.register(invitedById, {
  email: "staff@example.com",
  password: "temporary-password", // will be generated if empty
  firstName: "John",
  lastName: "Doe",
  phone: "+255712345678",
  username: "johndoe",
  gender: "male",
  businessId: "business-uuid",
  branchId: "branch-uuid",     // optional
  storeId: "store-uuid",       // optional
  roleId: "role-uuid",         // optional
  position: "Cashier",         // optional
  employeeCode: "EMP-001",     // optional
  hireDate: "2024-01-01",      // optional
});
```

**What it does:**
1. Checks for duplicate email
2. Creates auth user via Better Auth (`signUpEmail`)
3. In a Prisma `$transaction`:
   - Updates user profile fields
   - Creates `UserRole` (if `roleId` provided)
   - Creates `Staff` record (if `businessId` provided)
   - Creates `StaffAssignment` (if role/branch/store provided — hard-codes Commerce 3-tier hierarchy)
   - Creates `UserInvite` with 7-day expiry
4. Sends invitation email with temp password
5. Creates notification, activity feed entry, and audit log

**Returns:**
```typescript
RegistrationResponse<{
  userId: string;
  staffId: string | null;
  staffAssignmentId: string | null;
  userRoleId: string | null;
  inviteId: string | null;
}>
```

> **Note:** The `StaffAssignment.level` logic (`storeId → "store" / branchId → "branch" / else → "business"`) hard-codes a Commerce-specific three-tier hierarchy. Future industries (Healthcare: ward/department, Mining: pit/site, Agriculture: field/farm) would require different level mappings.

## BusinessRegistrationEngine

Creates a business with subscription, wallet, settings, and audit trail.

```typescript
import { BusinessRegistrationEngine } from "@/server/registrations";

const result = await BusinessRegistrationEngine.register(
  {
    name: "My Business",
    slug: "my-business",
    workspaceId: "workspace-uuid",
    createdById: "user-uuid",
    email: "business@example.com",
    phone: "+255712345678",
    address: "123 Main St",
    currency: "TZS",
    timezone: "Africa/Dar_es_Salaam",
    taxId: "123-456-789",
    industry: "RETAIL",
    modes: ["retail", "wholesale"],
    planId: "plan-uuid",
    businessSize: "small",
  },
  { id: "plan-uuid", amount: 50000, interval: "MONTHLY", name: "Standard" },
  { dailyPrice: 1667, setupFee: 80000, qrPrintingFee: 0, totalSetupFee: 80000 },
);
```

**What it does:**
1. Creates `Business` with `BusinessMode` records
2. Assigns owner role (`Role` with slug `owner`)
3. Creates `Staff` + `StaffAssignment` (isPrimary) for the business owner — **fixes P0 gap where owner had no Staff record**
4. Creates `Subscription` with calculated start/end/grace dates
5. Creates `SubscriptionWallet` with initial balance
6. Records setup fee `SubscriptionTransaction`
7. Sets business settings (`business_size`, `daily_price`, `setup_fee`)
8. Creates notification, activity feed entry, and audit log — **fixes P0 gap where business creation was un-auditable**

**Returns:**
```typescript
RegistrationResponse<{
  businessId: string;
  subscriptionId: string;
  walletId: string | null;
  ownerStaffId?: string;     // set when Staff record was created
}>
```

> **Note:** The engine always creates a Subscription + Wallet, imports QR sticker pricing constants, and sets `daily_price`/`setup_fee` settings. These are Commerce-specific assumptions. Non-Commerce industries (Healthcare, Agriculture, Mining) would need different behavior driven by BusinessType configuration.

## Shared Types

```typescript
interface CreateStaffUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  username?: string | null;
  gender?: string | null;
  businessId?: string | null;
  branchId?: string | null;     // Commerce-specific hierarchy
  storeId?: string | null;      // Commerce-specific hierarchy
  roleId?: string | null;
  position?: string | null;
  employeeCode?: string | null;
  hireDate?: string | null;
}

interface CreateBusinessInput {
  name: string;
  slug: string;
  workspaceId: string;
  createdById: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  currency?: string;
  timezone?: string;
  taxId?: string | null;
  industry: Industry;         // Prisma enum
  modes: string[];
  planId: string;
  businessSize?: string;
}

interface RegistrationResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
```

---

# User Lifecycle — All 12 Registration Flows

The platform has **12 distinct entry points** that create users:

| # | Flow | File | Auth Method | Context | Records Created |
|---|---|---|---|---|---|
| 1 | `StaffRegistrationEngine.register` | `staff/index.ts:34` | via createAuthUser | BUSINESS | user, userRole?, staff?, staffAssignment?, userInvite, notification, activity, auditLog |
| 2 | `admin-user-service` | `admin-user-service.ts:26` | delegates to #1 | BUSINESS | Same as #1 |
| 3 | `inviteSalesTeamMemberAction` | `sales-network/actions/invite-team-action.ts` | ✅ `UserRegistrationEngine.register/assignUserToContext` | SALES_TEAM | user, salesProfile, userInvite, notification, activity, auditLog |
| 4 | `registerCustomerBusinessAction` | `sales-team/register/actions.ts:25` | ✅ Engine workspace pre-step + engine call | WORKSPACE+BUSINESS | workspace, workspaceMember, business, modes, userRole, staff, staffAssignment, subscription, wallet, tx, settings, leadActivity |
| 5 | `createWorkspaceForLead` | `onboarding-service.ts:185` | ✅ `UserRegistrationEngine` + `BusinessRegistrationEngine` | WORKSPACE | user, workspace, workspaceMember, business, staff, staffAssignment, subscription, wallet, notification, activity, auditLog |
| 6 | `registerAction` | `auth/actions/index.ts:70` | auth.api.signUpEmail | SELF | user only |
| 7 | `registerService` | `auth/services/auth-service.ts:34` | auth.api.signUpEmail | SELF | user only |
| 8 | `registerService` (validated) | `auth/services/register-service.ts:45` | auth.api.signUpEmail | SELF | user only |
| 9 | Public registration page | `(auth)/register/page.tsx:77` | authClient.signUp.email | SELF | user only |
| 10 | Lead conversion (feature) | `leads/services/lead-service.ts:170` | ✅ `createAuthUser()` (engine utility) | LEAD | user with auth (password set) |
| — | Lead conversion (legacy) | ~~server/services/lead-service.ts:201~~ | **DELETED** | — | — |
| 11 | Auth DB hook | `lib/auth.ts:102` | triggers on signup | — | prisma.user.upsert (profile) |

### Common user lifecycle

```
┌──────────────────────────────────────────────┐
│            COMMON USER LIFECYCLE             │
├──────────────────────────────────────────────┤
│  1. Identity Creation                        │
│     ├── Check existing user by email         │
│     ├── Create auth user (Better Auth)       │
│     └── Update user profile                  │
│                                              │
│  2. Context Assignment                       │
│     ├── Workspace  → WorkspaceMember         │
│     ├── Business   → Staff + StaffAssignment │
│     ├── SalesTeam  → SalesProfile            │
│     └── Platform   → UserRole only           │
│                                              │
│  3. Role Assignment                          │
│     ├── Workspace  → inline enum             │
│     ├── Business   → UserRole / StaffAssign  │
│     ├── SalesTeam  → SalesHierarchy level    │
│     └── Platform   → UserRole                │
│                                              │
│  4. Notification                             │
│     ├── Email (invite flows)                 │
│     ├── In-app notification                  │
│     ├── Activity record                      │
│     └── Audit log                            │
│                                              │
│  5. Post-creation hooks                      │
│     ├── Lead activity (sales context)        │
│     ├── Subscription (business context)      │
│     └── Revalidation / cache                 │
└──────────────────────────────────────────────┘
```

---

# Membership Architecture — 6 Models Linking User to Context

| Model | Context | Cardinality | Role System | Status Field |
|---|---|---|---|---|
| `WorkspaceMember` | Workspace | N:M | Fixed enum OWNER/ADMIN/MEMBER/GUEST | None |
| `Staff` | Business | 1:1 user (`@unique`) | Via StaffAssignment | `isActive` |
| `StaffAssignment` | Business/Branch/Store | Via Staff | Full RBAC `Role` model | None |
| `UserRole` | Platform or Business | N:M | Full RBAC `Role` model | None |
| `SalesProfile` | Sales Network | 1:1 user (`@unique`) | SalesHierarchy (level+title) | `SalesProfileStatus` enum |
| `UserInvite` | Pre-membership | N:1 | Optional `Role` model | `status` string |

### 3 incompatible role systems

| System | Models | Description |
|---|---|---|
| Fixed enum | `WorkspaceMember.role` | OWNER/ADMIN/MEMBER/GUEST — not extensible |
| RBAC Role model | `UserRole`, `StaffAssignment.roleId` | Scope PLATFORM/BUSINESS — full permission system |
| Sales hierarchy | `SalesProfile.hierarchyId` → `SalesHierarchy` | National Manager → Region Manager → Team Leader → Freelancer |

### Inconsistent status tracking

| Model | Field | Type | States |
|---|---|---|---|
| Staff | `isActive` | boolean | true/false |
| SalesProfile | `status` | enum | ACTIVE/INACTIVE/SUSPENDED |
| WorkspaceMember | none | — | — |
| UserInvite | `status` | string (free) | "PENDING" (default, no constraint) |

### Staff.userId @unique constraint prevents a user from being staff at multiple businesses (breaks for doctors at multiple hospitals, chefs at multiple restaurants).

### Direct membership creation counts (outside engine)

| Record | Call Sites | Outside Engine? |
|---|---|---|
| `prisma.workspaceMember.create` | 2 | ✅ Both outside (workspace-service.ts x2) |
| `prisma.salesProfile.create` | 7 | ✅ All outside (sales-network domain) |
| `prisma.staff.create` | 2 | ❌ Both inside registrations |
| `prisma.userRole.create` | 8 | ✅ 6 outside, 2 inside registrations |
| `prisma.userInvite.create` | 4 | ✅ 3 outside, 1 inside registrations/shared/invite.ts |

### Duplicated service pairs — ALL RESOLVED ✅

| Domain | Legacy | Status |
|---|---|---|
| Workspace member | `server/services/workspace-service.ts` | ✅ **DELETED** — consumer uses `features/workspaces/services/workspace-service.ts` |
| Lead conversion | `server/services/lead-service.ts` | ✅ **DELETED** — consumer uses `features/leads/services/lead-service.ts` |
| Business create | `server/services/business-service.ts` + `features/businesses/services/business-service.ts` | ✅ **DELETED** (both) — engine handles all creation |
| Sales profile | `server/services/sales-service.ts` | ✅ **DELETED** — consumer uses `features/sales-network/services/profile-service.ts` + `hierarchy-service.ts` |
| RBAC assign | `server/services/rbac-service.ts` | ✅ **DELETED** — consumer uses `features/rbac/services/rbac-service.ts` |

### Key recommendation

Migrate `WorkspaceMemberRole` enum into RBAC `Role` model; eliminate `StaffAssignment.roleId` in favor of `UserRole` with location scope. Do NOT create a unified `Membership` model — contexts serve different purposes.

---

# Registration Context Analysis

The engine currently infers context implicitly from which fields are filled, not from an explicit parameter:

```typescript
// Current: context by convention
engine.register(invitedById, {
  businessId: "...",  // → infer BUSINESS context
  branchId: "...",    // → infer assignment level
  storeId: "...",     // → infer assignment level
});
```

### Recommended target: explicit context

```typescript
enum RegistrationContext {
  PLATFORM = "platform",
  WORKSPACE = "workspace",
  BUSINESS = "business",
  SALES_TEAM = "sales_team",
}

interface ContextConfig {
  requireBusinessId: boolean;
  createStaff: boolean;
  createAssignment: boolean;
  createWorkspaceMember: boolean;
  createSalesProfile: boolean;
  allowedAssignmentLevels: string[];
  postRegistrationHooks: Array<(result: Result) => Promise<void>>;
}
```

### Context-specific configurations

| Context | Register as | Creates | Role system |
|---|---|---|---|
| PLATFORM | Platform Staff | UserRole (platform scope) | RBAC `Role.scope = PLATFORM` |
| WORKSPACE | Workspace Member | WorkspaceMember | `Role.scope = WORKSPACE` (migrated from enum) |
| BUSINESS | Business Staff | Staff + StaffAssignment + UserRole | RBAC `Role.scope = BUSINESS` |
| SALES_TEAM | Sales Agent | SalesProfile | SalesHierarchy |

---

# UI Consolidation Analysis

### 3 invite forms — 70% identical

| Field | UserInviteForm | StaffForm | InviteTeamMemberForm |
|---|---|---|---|
| firstName | ✅ required | ✅ required | ✅ required |
| lastName | ✅ required | ✅ required | ✅ required |
| email | ✅ required | ✅ required | ✅ required |
| phone | ✅ required | ✅ required | ✅ required |
| username | ✅ required | ✅ required | ✅ required |
| gender | ✅ required | ✅ required | ✅ required |
| Role type | `roleId` (RBAC Role) | `roleId` (RBAC Role) | `hierarchyId` (SalesHierarchy) |
| Business scope | `businessId` (optional) | `businessId` (required) | ❌ none |
| Staff details | ❌ | employeeCode, position, hireDate | ❌ |

The 6 fields `firstName`, `lastName`, `email`, `phone`, `username`, `gender` are **identical and required** across all 3 invite forms with the same step structure (Step 1: personal info, Step 2: gender).

### Shared InviteForm component — ✅ Done

```typescript
<InviteForm
  context={context}           // "platform" | "workspace" | "business" | "sales_team"
  businessId={businessId}     // for business context
  roles={roles}               // for platform/business context
  hierarchyOptions={hierarchies} // for sales_team context
  action={serverAction}       // context-specific server action
  onSuccess={callback}
/>
```

Implemented at `src/components/registrations/invite-form.tsx` with 4 reusable step components.

### Self-registration + business registration — separate domains

Self-registration (password chosen by user, terms agreement, no role assignment) and business registration (business-level data: name, slug, industry, modes, plan, size) are fundamentally different from user invite flows and should remain independent.

---

# Business Creation — 8 Paths

## All business creation paths

| # | Path | File | Uses Engine? | Creates Full Stack? | Creates Modes? | Staff? | Sub/Wallet? | Audit? |
|---|---|---|---|---|---|---|---|---|
| 1 | `BusinessRegistrationEngine.register` | `registrations/business/index.ts:25` | ✅ ENGINE | ✅ Full | ✅ | ✅ | ✅ | ✅ |
| 2 | `createBusinessAction` (features) | `features/businesses/actions/index.ts:20` | ✅ YES | via engine | ✅ | ✅ | ✅ | ✅ |
| 3 | ~~`createBusinessAction` (server/legacy)~~ | ~~`server/actions/businesses.ts:9`~~ | ❌ DELETED | ❌ — | — | — | — | — |
| 4 | ~~`createBusiness` (features service)~~ | ~~`features/businesses/services/business-service.ts:7`~~ | ❌ DELETED | ❌ — | — | — | — | — |
| 5 | ~~`createBusiness` (server service)~~ | ~~`server/services/business-service.ts:7`~~ | ❌ DELETED | ❌ — | — | — | — | — |
| 6 | `registerCustomerBusinessAction` | `sales-team/register/actions.ts:25` | ✅ Engine | via engine + workspace pre-step | ✅ | ✅ | ✅ | ✅ |
| 7 | `createWorkspaceForLead` | `onboarding-service.ts:166` | ✅ Engine | via engine | ✅ | ✅ | ✅ | ✅ |
| 8 | `createBusiness` (Enkai) | `enkai/workflows/business-setup.ts:23` | ✅ Engine | via engine | ✅ | ✅ | ✅ | ✅ |

## Direct business creation paths (circumventing engine)

| File | Line | Also Creates | Missing |
|---|---|---|---|
| `features/businesses/services/business-service.ts` | 15 | modes only | sub/staff/role/audit |
| `server/services/business-service.ts` | 15 | modes only | sub/staff/role/audit |
| `sales-team/register/actions.ts` | 62 | **full duplicate** of engine (sub+wallet+staff+role) | audit trail |
| `onboarding-service.ts` | 209 | workspace only | modes/sub/staff/role/audit |
| `enkai/workflows/business-setup.ts` | 28 | branch+store+inventory | sub/staff/role/audit |

## 4 different `createBusiness` function definitions (same name)

| File | Lines | Signature |
|---|---|---|
| `registrations/business/index.ts` | 25 | `static async register(input, plan, pricing)` |
| `features/businesses/services/business-service.ts` | 7 | `async function createBusiness(data, workspaceId, userId)` |
| `server/services/business-service.ts` | 7 | `async function createBusiness(data, workspaceId, userId)` |
| `features/enkai/workflows/business-setup.ts` | 23 | `async function createBusiness(userId, workspaceId, data)` |

**Engine callers:** Only 1 production caller — `features/businesses/actions/index.ts:66`.

---

# Future Industry Readiness — Commerce Assumptions

## Where the engines break for future industries

| Engine | Specific Assumption | Line(s) | Breaks For |
|---|---|---|---|
| `StaffRegistrationEngine` | `level: storeId ? "store" : branchId ? "branch" : "business"` | staff/index.ts:91 | Healthcare (ward/department), Mining (pit/site) |
| `StaffRegistrationEngine` | `branchId` + `storeId` in `CreateStaffUserInput` | schemas.ts:12-13 | Any non-Commerce hierarchy |
| `StaffRegistrationEngine` | `branchId` + `storeId` in invite records | invite.ts:58-59,72-73 | Any non-Commerce hierarchy |
| `StaffRegistrationEngine` | Staff is 1:1 with user (`userId @unique`) | schema | Doctor at 2 hospitals, Chef at 2 restaurants |
| `BusinessRegistrationEngine` | Always creates Subscription + Wallet | business/index.ts:98-140 | Farm (seasonal), Education (term) |
| `BusinessRegistrationEngine` | QR pricing import (`QR_CODE_STICKER_COUNT`) | business/index.ts:119-121 | Mining, Logistics (no QR need) |
| `BusinessRegistrationEngine` | `BusinessPricingInfo` includes `qrPrintingFee` | business/index.ts:17-22 | Any non-Commerce industry |
| `BusinessRegistrationEngine` | Hardcoded setting keys `daily_price` + `setup_fee` | business/index.ts:139-140 | Subscription-free industries |
| `BusinessRegistrationEngine` | `COMMERCE_BASE_PRICE_PER_DAY` | subscriptions/constants/pricing.ts:1 | Base price is Commerce-specific |
| `BusinessRegistrationEngine` | `"retail"`/`"wholesale"` branching in pricing | subscriptions/constants/pricing.ts:46-48 | Healthcare (inpatient/outpatient), Mining (extraction/processing) |
| `StaffAssignment` | `level` is free-text string (no enum) | schema | Invalid levels can be stored |

## BusinessType Integration Gaps

The Prisma schema has 4 BusinessType models (BusinessType, BusinessTypeMode, BusinessTypeModule, CatalogType) and `Business.businessTypeId` FK — but registration engines **completely ignore them**:

| Check | Status |
|---|---|
| Models exist in Prisma | ✅ |
| Seed creates Commerce BusinessType | ✅ `prisma/seed.ts:13-55` |
| `Business.businessTypeId` FK | ✅ optional nullable |
| Feature schema has `businessTypeId` | ✅ `features/businesses/schemas/index.ts:30` (optional) |
| **Registration engine `CreateBusinessInput` has `businessTypeId`** | ❌ **MISSING** |
| **Engine receives or sets `businessTypeId`** | ❌ **NEVER** |
| **Dedicated BusinessType services** | ❌ **NONE** — no CRUD, no queries |
| **BusinessType API routes** | ❌ **NONE** |
| **BusinessType UI/components** | ❌ **NONE** |

**Flow gap:** Features schema → Features service passes `businessTypeId` → `BusinessRegistrationEngine.register()` drops it because `CreateBusinessInput` lacks the field → Prisma saves business without `businessTypeId`.

## Future industry risk summary

| Risk | Blocks | Severity |
|---|---|---|
| `Staff.userId @unique` | Multi-business staff (doctor at 2 hospitals) | HIGH |
| `StaffAssignment.level` no enum | Any industry with different hierarchy | HIGH |
| Branch→Store hierarchy mandatory | Healthcare, Mining, Education hierarchies | HIGH |
| Subscription always mandatory | Agriculture (seasonal), Education (term) | HIGH |
| Commerce pricing model | Any non-subscription industry | HIGH |
| 3 incompatible role systems | Cross-industry user assignment | MEDIUM |
| "retail"/"wholesale" modes assumed | Healthcare, Mining modes | MEDIUM |
| No industry hooks in engine | Industry-specific provisioning | HIGH |

---

# Refactored Consumers

| File | Before | After |
|---|---|---|
| `admin-user-service.ts` | Inline user+staff+invite creation | Delegates to `StaffRegistrationEngine` |
| `businesses/actions/index.ts` | Inline business+sub+wallet creation | Delegates to `BusinessRegistrationEngine` |
| `invite-team-action.ts` | **Direct** `auth.api.signUpEmail` + `prisma.salesProfile.create` + `prisma.userInvite.create` | ✅ Engine for both new users (`register`) and existing users (`assignUserToContext`) |
| `server/actions/leads.ts` | `server/services/lead-service` | ✅ `features/leads/services/lead-service` |
| `server/actions/sales.ts` | `server/services/sales-service` | ✅ `features/sales-network/services/profile-service` + `hierarchy-service` |
| `server/actions/workspaces.ts` | `server/services/workspace-service` | ✅ `features/workspaces/services/workspace-service` |
| `server/actions/rbac.ts` | `server/services/rbac-service` | ✅ `features/rbac/services/rbac-service` |
| `server/actions/businesses.ts` | Called lean `server/services/business-service.ts` | Delegates to `BusinessRegistrationEngine.register()` |

## New Files Created

| File | Purpose |
|---|---|
| `context/index.ts` | `RegistrationContext` enum + 4 adapters (PLATFORM, WORKSPACE, BUSINESS, SALES_TEAM) |
| `user/index.ts` | `UserRegistrationEngine.register(context, invitedById, input)` — multi-context engine |

## Deleted

| File | Replacement |
|---|---|
| `server/services/business-service.ts` | `BusinessRegistrationEngine.register()` — non-create fns inlined to `features/businesses/actions/index.ts` |
| `features/businesses/services/business-service.ts` | `BusinessRegistrationEngine.register()` — non-create fns inlined to `features/businesses/actions/index.ts` |
| `server/services/lead-service.ts` | `features/leads/services/lead-service.ts` |
| `server/services/sales-service.ts` | `features/sales-network/services/profile-service.ts` + `hierarchy-service.ts` |
| `server/services/workspace-service.ts` | `features/workspaces/services/workspace-service.ts` |
| `server/services/rbac-service.ts` | `features/rbac/services/rbac-service.ts` |

## Refactored ✅

| File | Fix | Priority |
|---|---|---|
| `onboarding-service.ts` | `UserRegistrationEngine.register(WORKSPACE)` + `BusinessRegistrationEngine.register()` | P2 ✅ |
| `sales-team/register/actions.ts` | Was already delegating to engine (workspace pre-step + engine call) | P1 ✅ |
| Lead conversion x2 | `createAuthUser()` (engine utility) instead of `prisma.user.create` | P2 ✅ |
| `features/enkai/workflows/business-setup.ts` | `BusinessRegistrationEngine.register()` instead of direct create | P2 ✅ |
| `server/services/business-service.ts` | **DELETED** — non-create fns moved to actions | P1 ✅ |
| `features/businesses/services/business-service.ts` | **DELETED** — non-create fns inlined | P1 ✅ |
| `server/actions/businesses.ts` | **DELETED** — was already delegating to engine | P1 ✅ |

### Still Not Refactored

| File | Reason | Priority |
|---|---|---|
| Public auth flows | Self-registration — separate concern | Accepted |
| `StaffForm` | Has additional staff-specific fields (employeeCode, position, hireDate) — not suitable for shared `InviteForm` pattern | P3 |

---

# Architecture Audit Fixes (P0)

The following fixes were applied based on a platform-wide architectural audit:

| # | Fix | File | Detail |
|---|---|---|---|
| P0 | Owner Staff + StaffAssignment | `business/index.ts:58-83` | Business owner now gets a `Staff` + `StaffAssignment` in their own business |
| P0 | Business creation audit trail | `business/index.ts:149-184` | Business creation now emits notification, activity, and audit log |
| P0 | Owner Staff + StaffAssignment | `sales-team/register/actions.ts:93-110` | Same fix in the duplicate business creation path |

### Owner Staff/Assignment Behavior

The engine checks `prisma.staff.findUnique({ where: { userId } })` before creating. If the user already has a `Staff` record (the `userId` field is `@unique`), creation is skipped.

---

# Recommended Target Architecture

## Phase 1: Rename to `UserRegistrationEngine`

```
CURRENT:                    TARGET:
StaffRegistrationEngine →  UserRegistrationEngine
  (business-context only)     (multi-context)

UserRegistrationEngine.register(context, input)
```

## Phase 2: Explicit RegistrationContext

```typescript
class UserRegistrationEngine {
  static register(
    context: RegistrationContext,
    input: RegisterUserInput,
  ): Promise<RegistrationResponse<UserRegistrationResult>>
}
```

Each context has an adapter defining what records to create, what role system to use, and what post-registration hooks to run.

## Phase 3: BusinessType-Driven BusinessRegistration

```typescript
BusinessRegistrationEngine.register({
  ...input,
  businessTypeId,  // ← newly wired
})
// → loads BusinessType config
// → conditionally creates subscription/wallet
// → uses industry-specific pricing resolver
// → uses valid hierarchy levels
```

## Phase 4: Membership Rationalization

- Migrate `WorkspaceMemberRole` enum into RBAC `Role` model with `scope: WORKSPACE`
- Eliminate `StaffAssignment.roleId` → use `UserRole` with location scope
- Standardize status tracking across all membership models

## Phase 5: Unified Invite UI — ✅ Done

- Extracted `PersonalInfoStep` + `GenderSelectStep` + `RoleAssignStep` + `StepIndicator` as shared components at `src/components/registrations/`
- Created pluggable role-assignment step per context (RBAC Role grid for platform/business; SalesHierarchy picker for sales_team)
- Wrapped in unified `InviteForm` with `context` prop at `src/components/registrations/invite-form.tsx`
- Refactored `UserInviteForm` and `InviteTeamMemberForm` as thin wrappers (~20 lines each)

---

# Migration Plan

## Priority P0 (done — verify completeness)

| Fix | Status |
|---|---|
| Owner Staff + StaffAssignment in BusinessRegistrationEngine | ✅ Applied |
| Business creation audit trail (notification + activity + audit log) | ✅ Applied |
| Owner Staff + StaffAssignment in sales-team register action | ✅ Applied |

**P0 all resolved ✅:** `createWorkspaceForLead` now uses `BusinessRegistrationEngine.register()` (includes owner staff + audit trail). `enkai/workflows/business-setup.ts` also refactored to use the engine.

## Priority P1 (Done)

| Task | Files | Status |
|---|---|---|
| Create `UserRegistrationEngine` with 4 context adapters | `registrations/user/index.ts`, `registrations/context/index.ts` | ✅ Done |
| Refactor `invite-team-action.ts` → `UserRegistrationEngine.register(SALES_TEAM)` | `features/sales-network/actions/invite-team-action.ts` | ✅ Done |
| Wire `businessTypeId` through BusinessRegistrationEngine | `registrations/business/index.ts`, `schemas.ts` | ✅ Done |
| Add audit trail to sales-team register action | `app/platform/sales-team/register/actions.ts` | ✅ Done |
| Delete `server/actions/businesses.ts` | `server/actions/businesses.ts` | ✅ **DELETED** |
| Delete both `business-service.ts` files | `server/services/business-service.ts`, `features/businesses/services/business-service.ts` | ✅ **DELETED** |

## Priority P1 (Remaining)

| Task | Files | Effort |
|---|---|---|
| None — all P1 tasks complete ✅ | | |

## Priority P2

| Task | Files | Effort |
|---|---|---|
| Refactor `createWorkspaceForLead` — add engine or no-subscription mode | `server/services/onboarding-service.ts` | ✅ Done |
| Create `BusinessTypeService` (CRUD + queries) | New file | Medium |
| Add `businessTypeId` UI selector to business creation form | Business creation UI | Medium |
| Consolidate 2 invite-service implementations | invite-service.ts + registrations/shared/invite.ts | Medium |
| Convert `StaffForm` to use shared `InviteForm` | `features/staff/components/staff-form.tsx` | Small |

## Priority P3

| Task | Effort | Risk |
|---|---|---|
| Migrate `WorkspaceMemberRole` → RBAC Role model | Large | High |
| Eliminate `StaffAssignment.roleId` redundancy | Large | High |
| Standardize membership status tracking | Medium | Medium |
| Abstract Commerce pricing into BusinessType resolvers | Large | Medium |
| Add domain events for registration flows | Medium | Low |

---

# Complete File Inventory

## Registration Engine (canonical)

| File | Purpose |
|---|---|
| `registrations/index.ts` | Re-exports |
| `registrations/shared/schemas.ts` | `CreateStaffUserInput`, `CreateBusinessInput` |
| `registrations/shared/response.ts` | `RegistrationResponse<T>` |
| `registrations/shared/user-creation.ts` | `createAuthUser()` |
| `registrations/shared/invite.ts` | Password gen, invite records, email |
| `registrations/staff/index.ts` | `StaffRegistrationEngine` |
| `registrations/business/index.ts` | `BusinessRegistrationEngine` |

## Shared UI Components (new)

| File | Purpose |
|---|---|
| `components/registrations/invite-form.tsx` | Shared 3-step wizard with `context` prop (platform/business/sales_team) |
| `components/registrations/personal-info-step.tsx` | firstName, lastName, email, phone, username fields |
| `components/registrations/gender-select-step.tsx` | Male/Female toggle cards |
| `components/registrations/role-assign-step.tsx` | Role grid for RBAC or hierarchy picker |
| `components/registrations/step-indicator.tsx` | Dot-based step progress indicator |
| `components/registrations/index.ts` | Barrel exports |

## Refactored consumers

| File | Uses |
|---|---|
| `features/users/services/admin-user-service.ts` | `StaffRegistrationEngine` |
| `features/businesses/actions/index.ts` | `BusinessRegistrationEngine` |

## All user-creation paths refactored ✅

| File | Old Method | Fix |
|---|---|---|
| `features/sales-network/actions/invite-team-action.ts` | Inline `prisma.salesProfile.create` + `prisma.userInvite.create` | ✅ New: `UserRegistrationEngine.register(SALES_TEAM)`. Existing: `assignUserToContext()` |
| `features/leads/services/lead-service.ts` | `prisma.user.create` (no auth) | ✅ `createAuthUser()` (engine utility) |
| ~~`server/services/lead-service.ts`~~ | ~~`prisma.user.create` (no auth)~~ | ✅ **DELETED** — consumer uses features lead-service |
| `server/services/onboarding-service.ts` | `prisma.user.create` + `prisma.business.create` | ✅ `UserRegistrationEngine` + `BusinessRegistrationEngine` |

## Refactored business creation (✅ all fixed)

| File | Old Problem | Fix |
|---|---|---|
| `app/platform/sales-team/register/actions.ts` | Was full duplicate of engine | ✅ Already delegated to engine |
| `server/actions/businesses.ts` | Called lean service | ✅ **DELETED** |
| `server/services/business-service.ts` | Lean — no sub/staff/role/audit | ✅ **DELETED** (non-create fns moved) |
| `features/businesses/services/business-service.ts` | Lean — no sub/staff/role/audit | ✅ **DELETED** (non-create fns inlined) |
| `features/enkai/workflows/business-setup.ts` | Direct `prisma.business.create` | ✅ `BusinessRegistrationEngine.register()` |

## Auth/self-registration (separate — no engine needed)

| File | Function |
|---|---|
| `features/auth/actions/index.ts` | `registerAction()` — auth.api.signUpEmail |
| `features/auth/services/auth-service.ts` | `signUp()` — auth.api.signUpEmail |
| `features/auth/services/register-service.ts` | `register()` with validation |
| `(auth)/register/page.tsx` | Public registration page (client-side signup) |

## UI forms

| Form | File | Context | Status |
|---|---|---|---|
| `InviteForm` (shared) | `components/registrations/invite-form.tsx` | Any | ✅ Shared |
| `PersonalInfoStep` | `components/registrations/personal-info-step.tsx` | Any | ✅ Shared |
| `GenderSelectStep` | `components/registrations/gender-select-step.tsx` | Any | ✅ Shared |
| `RoleAssignStep` | `components/registrations/role-assign-step.tsx` | Platform/Business | ✅ Shared |
| `StepIndicator` | `components/registrations/step-indicator.tsx` | Any | ✅ Shared |
| `UserInviteForm` (thin wrapper) | `features/users/components/user-invite-form.tsx` | Platform/Business | ✅ Refactored |
| `InviteTeamMemberForm` (thin wrapper) | `features/sales-network/components/invite-team-member-form.tsx` | Sales Team | ✅ Refactored |
| `StaffForm` (3 steps create, 1 edit) | `features/staff/components/staff-form.tsx` | Business | ❌ Not converted |
| `StaffRegisterDialog` | `features/staff/components/staff-register-dialog.tsx` | Platform (wrapper) | Uses UserInviteForm |
| `StaffAssignmentForm` | `features/staff/components/staff-assignment-form.tsx` | Business | Unchanged |
| `DialogForm` (shared) | `components/ui/dialog-form.tsx` | Modal wrapper | Unchanged |

## UI pages rendering these forms

| Page | Form | URL Context |
|---|---|---|
| `app/platform/users/page.tsx` | StaffRegisterDialog → UserInviteForm | `/platform/users` |
| `app/platform/sales-team/team/page.tsx` | InviteTeamMemberForm | `/platform/sales-team/team` |
| `app/workspaces/businesses/[businessId]/staff/page.tsx` | StaffForm (via DialogForm) | `/workspaces/businesses/:id/staff` |

## Membership service files — legacy duplicates deleted ✅

| File | Model | Status |
|---|---|---|
| `features/workspaces/services/workspace-service.ts` | WorkspaceMember | Active |
| ~~`server/services/workspace-service.ts`~~ | ~~WorkspaceMember~~ | ✅ **DELETED** |
| `features/sales-network/services/profile-service.ts` | SalesProfile | Active |
| `features/sales-network/actions/team-actions.ts` | SalesProfile | Active (2 paths) |
| ~~`server/services/sales-service.ts`~~ | ~~SalesProfile~~ | ✅ **DELETED** |
| `features/roles/services/assignment-service.ts` | UserRole | Active |
| `features/rbac/services/rbac-service.ts` | UserRole | Active |
| ~~`server/services/rbac-service.ts`~~ | ~~UserRole~~ | ✅ **DELETED** |
| `platform/roles/index.ts` | UserRole (platform) | Active |
| `features/users/services/invite-service.ts` | UserInvite | Active |

---

# Sprint Completion Summary

## Sprint 1 — Domain Events + Resolver Architecture ✅

### Registration Event System (via FirdausEventBus)

Registration domain events use the existing `FirdausEventBus` (at `modules/ai/events/event-bus.ts`) instead of a custom event system. Three new event types extended the existing `FirdausEventType` union:

| Event | Emit Helper | When | Auto-Audited |
|---|---|---|---|
| `UserRegistered` | `emitUserRegistered()` | `UserRegistrationEngine.register()` | ✅ |
| `UserAssignedToContext` | `emitUserAssignedToContext()` | `assignUserToContext()` | ✅ |
| `BusinessCreated` | `emitBusinessCreated()` | `BusinessRegistrationEngine.register()` | ✅ |

Handler registration auto-initializes on module load via `registerRegistrationEventHandlers()` in `events.ts`, which also activates the dormant commerce handlers via `registerDefaultHandlers()`. Each event handler creates the appropriate notification and activity feed entry. Audit logging is automatic — `FirdausEventBus.emit()` writes to `auditLog` for every event.

### BusinessTypeResolver

Industry abstraction extracted from `BusinessRegistrationEngine`:

```typescript
interface BusinessTypeResolver {
  getConfig(): Promise<BusinessTypeConfig>;
  getValidLevels(): Promise<string[]>;
  resolveLevel(input: { branchId?, storeId? }): Promise<string>;
  getDefaultPricing(): Promise<BusinessPricingInfo>;
  requiresSubscription(): Promise<boolean>;
}
```

`CommerceResolver` is the default implementation. Subscription creation is now conditional on `resolver.requiresSubscription()` — non-subscription industries (Agriculture, Education, NGO) work without engine changes.

### Permission Guards

| Engine | Permission | Scope |
|---|---|---|
| `UserRegistrationEngine.register()` | `users.invite` | businessId (if provided) |
| `UserRegistrationEngine.assignUserToContext()` | `users.invite` | businessId (if provided) |
| `BusinessRegistrationEngine.register()` | `businesses.create` | workspaceId |

---

## Sprint 2 — BusinessType Configuration ✅

### BusinessTypeService

DB-backed service for loading BusinessType config.

```typescript
// src/server/registrations/business-type/service.ts

class BusinessTypeService {
  findById(id: string): Promise<BusinessTypeRecord | null>
  findBySlug(slug: string): Promise<BusinessTypeRecord | null>
  findAllActive(): Promise<BusinessTypeRecord[]>
  slugExists(slug: string): Promise<boolean>
}
```

Get all the modes, modules, and catalog types for a business type from the database.

### DbBusinessTypeResolver

Generic resolver that loads config from DB and delegates to the correct slug-specific resolver:

```typescript
// Constructor: new DbBusinessTypeResolver(businessTypeId)
// Resolver map: commerce → CommerceResolver, healthcare → HealthcareResolver, agriculture → AgricultureResolver
// Fallback: CommerceResolver for unknown types
```

The resolver uses lazy initialization — only queries the DB on first method call, then caches the concrete resolver instance.

### Engine Wiring

`BusinessRegistrationEngine.register()` auto-creates `DbBusinessTypeResolver` when `businessTypeId` is provided:

```typescript
const effectiveResolver = resolver
  || (input.businessTypeId ? new DbBusinessTypeResolver(input.businessTypeId) : undefined)
  || new CommerceResolver();
```

### Pricing Abstraction

- `daily_price` and `setup_fee` settings moved inside `requiresSubscription()` guard
- `requiresSubscription()` cached to avoid double DB/resolver call
- Non-subscription industries no longer get pricing settings written

### Hierarchy Abstraction

- `StaffRegistrationEngine.register()` accepts optional `BusinessTypeResolver` parameter
- `businessAdapter.assign()` accepts optional `level` param (pre-resolved level overrides the hardcoded ternary)
- `ContextAdapterParams` extended with `level?: string | null`

---

## Sprint 3 — Staff Model + Invite Consolidation ✅

### Staff Schema Migration

| Before | After |
|---|---|
| `Staff.userId @unique` (1 staff per user globally) | `@@unique([userId, businessId])` (1 staff per user per business) |
| `User.staffProfile Staff?` (one-to-one) | `User.staffProfiles Staff[]` (one-to-many) |

**Updated callers:**
| File | Change |
|---|---|
| `registrations/business/index.ts:65` | `findUnique({ where: { userId } })` → `findFirst({ where: { userId, businessId } })` |
| `registrations/context/index.ts:85` | `findUnique({ where: { userId } })` → `findFirst({ where: { userId, businessId } })` |
| `features/staff/services/staff-service.ts:57` | `findUnique` → `findFirst` (backward-compatible) |

This enables multi-business staff — e.g., a doctor can be staff at 2 hospitals.

### Invite Consolidation

| Function | Before | After |
|---|---|---|
| `generateTempPassword()` | Duplicated in 2 files | Single canonical source: `features/users/services/invite-service.ts` |
| `generateToken()` | Duplicated in 2 files | Single canonical source: `features/users/services/invite-service.ts` |
| `sendStaffInviteEmail()` | Standalone copy | Delegates to `sendInviteEmail(invite-service.ts)` with `isReinvite=false` |
| `prisma.userInvite.create` | 3 inline copies in engines | Unified `createUserInviteRecord()` with optional `tx` parameter |

**3 inline `prisma.userInvite.create` calls replaced:**
- `StaffRegistrationEngine.register()` (staff/index.ts)
- `UserRegistrationEngine.register()` (user/index.ts)
- `UserRegistrationEngine.assignUserToContext()` (user/index.ts)

---

## Sprint 4 — RBAC + Industry Resolvers ✅

### Workspace Role → RBAC Migration

| Change | Detail |
|---|---|
| `RoleScope` enum | Added `WORKSPACE` (schema + 4 TS type definitions) |
| Workspace role seeding | `owner-workspace`, `admin-workspace`, `member-workspace`, `guest-workspace` with appropriate permissions |
| `workspaceAdapter` | Now creates `UserRole` record for the matching workspace role on member assignment |
| `workspace-service.ts` | `createWorkspace`, `addWorkspaceMember`, `updateWorkspaceMemberRole`, `removeWorkspaceMember` all sync RBAC `UserRole` records |
| Helper functions | `ensureRbacWorkspaceRole()` + `removeRbacWorkspaceRole()` for clean lifecycle management |

**Slug convention:** Workspace roles use `{enum_value_lower}-workspace` format (e.g., `"OWNER"` → `"owner-workspace"`) to avoid collision with business roles.

### Industry Resolvers

| Resolver | Hierarchy | Subscription | Daily Price | Staff Uniqueness |
|---|---|---|---|---|
| `CommerceResolver` | business/branch/store | Required | 1,667 TZS | single |
| `HealthcareResolver` | facility/department/ward | Required | 2,500 TZS | multi |
| `AgricultureResolver` | farm/field | Not required | 0 TZS (free) | single |

`DbBusinessTypeResolver` auto-selects the correct resolver by slug lookup using the `RESOLVER_MAP`:

```typescript
const RESOLVER_MAP: Record<string, new () => BusinessTypeResolver> = {
  commerce: CommerceResolver,
  healthcare: HealthcareResolver,
  agriculture: AgricultureResolver,
};
```

### New/Seeded BusinessTypes in Database

| BusinessType | Modes | Modules | Catalog Types |
|---|---|---|---|
| Commerce | retail, wholesale, both | catalog, inventory, sales, pos, etc. (16) | Product, Service |
| Healthcare | pharmacy, clinic, hospital | catalog, inventory, sales, purchases, expenses, etc. (9) | Medicine, Service |
| Agriculture | general | catalog, inventory, sales, purchases, expenses, etc. (9) | Product, Livestock |

Workspace roles seeded with `scope: WORKSPACE`:
- `owner-workspace` — full access to workspace + business + user management
- `admin-workspace` — manage members + read businesses/users
- `member-workspace` — read workspaces + businesses
- `guest-workspace` — no permissions

---

# Schema Migration Notes

The following schema changes require `prisma migrate dev`:

1. **`RoleScope` enum** — added `WORKSPACE` value
2. **`Staff` model** — removed `@unique` from `userId`, added `@@unique([userId, businessId])`
3. **`User` model** — renamed `staffProfile Staff?` to `staffProfiles Staff[]` (one-to-many)

Run:
```bash
npx prisma migrate dev --name staff_userid_unique_removed
npx prisma generate
npx prisma db seed
```

---

# File Inventory

## Registration System (`src/server/registrations/`)

```
├── index.ts                        # Barrel exports
├── events.ts                       # FirdausEventBus registration handlers
├── business/
│   └── index.ts                    # BusinessRegistrationEngine (industry-aware)
├── user/
│   └── index.ts                    # UserRegistrationEngine (multi-context)
├── staff/
│   └── index.ts                    # StaffRegistrationEngine
├── context/
│   └── index.ts                    # 4 context adapters (PLATFORM, WORKSPACE, BUSINESS, SALES_TEAM)
├── shared/
│   ├── index.ts                    # Barrel exports
│   ├── schemas.ts                  # CreateBusinessInput, CreateStaffUserInput, etc.
│   ├── response.ts                 # success() / failure() helpers
│   ├── user-creation.ts            # createAuthUser via better-auth
│   └── invite.ts                   # generateTempPassword, sendStaffInviteEmail, createUserInviteRecord
├── resolvers/
│   ├── index.ts                    # Barrel exports
│   ├── types.ts                    # BusinessTypeResolver, BusinessTypeConfig, BusinessPricingInfo
│   ├── commerce.ts                 # CommerceResolver
│   ├── healthcare.ts               # HealthcareResolver
│   ├── agriculture.ts              # AgricultureResolver
│   └── db-resolver.ts              # DbBusinessTypeResolver (DB-driven resolver lookup)
├── business-type/
│   └── service.ts                  # BusinessTypeService (DB CRUD)
├── ARCHITECTURE-REVIEW.md          # Full architecture analysis + roadmap
└── README.md                       # This file
```
