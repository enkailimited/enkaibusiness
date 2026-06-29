# ENKAI SALES TEAM NETWORK — COMPLETE BUSINESS ACTIVATION FLOW AUDIT

---

## CURRENT STATE

A partially-implemented business lifecycle with broken permission checks, duplicate conversion paths, and a recently-modernized registration engine that creates `PENDING_SETUP` businesses with `PENDING` subscriptions and zero-balance wallets — but the surrounding ecosystem has not been updated to match.

---

## STEP 1 — LEAD MANAGEMENT

### Current Implementation

**Tables involved:**
- `leads` (Lead) — core lead record
- `lead_activities` (LeadActivity) — timeline events
- `lead_assignments` (LeadAssignment) — transfer history
- `sales_profiles` (SalesProfile) — agent assignment target
- `users` (User) — converted user

**Create lead:**
- Source: `lead-service.ts:createLead()` — creates with `source: "MANUAL"`, `status: "NEW"`, auto-assigns to creator's sales profile
- Also creates `LeadActivity` with action `"CREATED"`
- Routes: `/platform/sales-team/leads` (form dialog), `/platform/leads` (form)

**Lead sources:** `MANUAL`, `SELF_REGISTRATION`, `SALES_REGISTRATION`, `REFERRAL`, `CAMPAIGN`

**Lead statuses:** `NEW → CONTACTED → INTERESTED → DEMO → NEGOTIATION → CONVERTED → LOST`

**Assignment:** `assignLead()` in `lead-service.ts` — creates `LeadAssignment` + updates `assignedToId` + creates activity

**Conversion:** Two competing paths:
- **Path A:** `updateLeadStatus(id, "CONVERTED")` — finds/creates auth user, sets temp password, sends invite email
- **Path B:** `convertLead(id, userId)` — just sets status + convertedToUserId + convertedAt
- `lead-service.ts:362` — both exist, creating potential confusion

**Routes:**
- Platform: `/platform/leads` (list), `/platform/leads/[id]` (detail)
- Sales Team: `/platform/sales-team/leads`

**Key files:**
- `src/features/leads/services/lead-service.ts` — all lead CRUD + conversion
- `src/features/leads/actions/index.ts` — server actions
- `src/features/leads/schemas/index.ts` — Zod schemas
- `src/server/actions/leads.ts` — legacy duplicate with `resendLeadCredentialsAction()`

---

## STEP 2 — SALES AGENT FLOW

### Dashboard & KPIs
- Route: `/platform/sales-team/overview`
- KPI cards: Today/This Week/This Month sales, Clients count, Commission
- Sources: `getMySalesStats()`, `getMyPerformanceMetrics()` (from `server/actions/sales-team.ts`)

### Pipeline
- `/platform/sales-team/leads` — full leads list with status filter, search, metrics bar
- `/platform/sales-team/clients` — converted leads + registered businesses

### Targets
- `/platform/sales-team/targets` — **hardcoded targets** (monthlyLeads: 10, conversionRate: 30%, monthlyCommission: 500000, yearlyCommission: 5000000)
- `server/actions/sales-team.ts:getMyTargetsAction()` returns literal constants, not DB values

### Commissions
- `/platform/sales-team/commissions` — commission metrics + history
- `/platform/sales-team/orders` — subscription commission entries
- `CommissionLedger` + `CommissionPayout` models (seeded but not wired to subscription payments)

### Team Management
- `/platform/sales-team/team` — recursive tree view
- Hierarchy: National Manager → Region Manager → Team Leader → Freelancer
- `team-actions.ts:seedHierarchies()` seeds 4 levels
- `CAN_ADD` map controls who can add whom

### Registration from Lead
- `/platform/sales-team/register` — 4-step form (Customer → Business Info → Plan → QR & Finish)
- `register/actions.ts:registerCustomerBusinessAction()` — creates workspace + calls engine

---

## STEP 3 — LEAD TO BUSINESS CONVERSION

### Two Duplicate Conversion Services Exist

**Conversion Service A: `lead-service.ts:convertLead()`**
- File: `src/features/leads/services/lead-service.ts:337-362`
- Just sets `status: "CONVERTED"`, `convertedToUserId`, `convertedAt`
- Creates `LeadActivity` with action `"CONVERTED"`
- **Does NOT** create business, subscription, wallet, or any downstream records

**Conversion Service B: `updateLeadStatus()` with CONVERTED**
- File: `src/features/leads/services/lead-service.ts:149-215`
- When status changes to `"CONVERTED"`:
  - Creates auth user via `createAuthUser()` (Better Auth)
  - Generates temp password
  - Sends invite email via `sendStaffInviteEmail()`
  - Records `CREDENTIALS_SENT` + `STATUS_CHANGE` activities
- **Still does NOT create business records**

**Business Registration (separate step):**
- `registerBusinessAction()` in `businesses/actions/index.ts:160-251`
- Accepts `leadId` — creates workspace for lead user, then calls `BusinessRegistrationEngine.register()`
- Creates: Business, BusinessMode, UserRole(owner), Staff, StaffAssignment, Branch, InventoryLocation, Subscription, Wallet

**Onboarding Service (third conversion path):**
- `createWorkspaceForLead()` at `onboarding-service.ts:169-245`
- Creates user (if not exists) → creates workspace → calls engine
- **HARDCODED VALUES:** uses `"RETAIL"` industry, `["retail"]` modes, and an **empty plan object** `{ id: "", amount: 0, interval: "", name: "" }`
- This means subscription + wallet + settings will have zero/missing values

---

## STEP 4 — BUSINESS REGISTRATION ENGINE

### Current Execution Order (Verified)

```
BusinessRegistrationEngine.register()
│
├── 1. Permission check (workspace owner OR hasPermission("businesses.create"))
│
├── 2. Resolver selection (BusinessType → Commerce/Healthcare/Agriculture resolver)
│
├── 3. TRANSACTION START
│   │
│   ├── 3a. Business.create(status: "PENDING_SETUP", isActive: false)
│   │
│   ├── 3b. BusinessMode.createMany (industry + modes mapping)
│   │
│   ├── 3c. UserRole.create(userId: createdBy, roleId: owner, businessId)
│   │
│   ├── 3d. Staff.create(userId: createdBy, businessId, position: default)
│   │
│   ├── 3e. StaffAssignment.create(staffId, businessId, isPrimary: true)
│   │
│   ├── 3f. [If subscriptionRequired]:
│   │   ├── Subscription.create(planId, businessId, status: "PENDING", startDate, endDate, graceEndDate)
│   │   └── SubscriptionWallet.create(businessId, balance: 0, totalDeposited: 0)
│   │
│   ├── 3g. Branch.create(businessId, name: "Head Office", isHeadOffice: true)
│   │
│   └── 3h. InventoryLocation.create(businessId, branchId, name, type: "store")
│
├── 4. TRANSACTION END
│
├── 5. Post-tx: setBusinessSetting("business_size")
│     setBusinessSetting("daily_price")
│     setBusinessSetting("setup_fee")
│
├── 6. Events emitted + Audit logs
│
└── 7. Return BusinessRegistrationResult
```

### What Is Missing
- **No default Customer ("Walk-In") created** during registration
- **No default PaymentMethod ("Cash") created**
- **No default roles/permissions seeded** for business scope (owner role is assigned but `owner` permissions need to exist in the seed)
- **No POS settings created**
- **No Walk-in CustomerGroup created**
- **No default CashRegister created**

---

## STEP 5 — SUBSCRIPTION

### Current State

**Created by:** `BusinessRegistrationEngine` (line 127-135)
**Status:** `"PENDING"` (since Phase 1b changes)
**Plan:** Uses selected `plan.id`, `plan.amount`, `plan.interval` from the input
**Start date:** `now`
**End date:** `now + 1 day` (DAILY), `now + 7 days` (WEEKLY), `now + 1 month` (MONTHLY), `now + 1 year` (YEARLY)
**Grace period:** `endDate + 30 days`

**Verification:**
- ✅ Plan ID from selected plan is used
- ✅ Plan price stored on SubscriptionPlan (referenced)
- ✅ Billing period set from plan.interval
- ❌ No trial period implemented (startDate = now, no trialDays)
- ✅ Start/end dates calculated correctly
- ✅ Subscription status = "PENDING" (correct — not auto-active)
- ✅ Activation rules: only activated via `approveTopUp()` when wallet >= setup fee

**Renewal logic:** Exists in `subscription-service.ts:processSubscriptionRenewals()` — deducts daily from wallet

**Critical finding:** The `onboarding-service.ts:createWorkspaceForLead()` passes an **empty plan object** `{ id: "", amount: 0, interval: "", name: "" }`. This means:
- Subscription created with `planId: ""` (empty string) — will likely **fail** at DB constraint
- If it succeeds, `endDate` defaults to `now + 1 day` (DAILY interval fallback)
- Zero pricing means setup_fee = 0, daily_price = 0 — bypassing the entire payment flow

---

## STEP 6 — WALLET

### Current State

**Created by:** `BusinessRegistrationEngine` (line 137-143)
**Initial balance:** `0` (correct — since Phase 1b changes)
**Transactions:** Only created during `approveTopUp()` (deposit) and setup fee deduction (consumption)

**Top-up flow:**
1. Owner visits `/workspaces/businesses/[id]/activation`
2. Submits `submitTopUpAction()` → creates `WalletDepositRequest(status: "pending")`
3. Admin reviews at `/platform/business-activations`
4. Admin clicks "Approve" → `approveTopUpAction()` → `approveTopUp()` completes the transaction

**Payment records:** No `Payment` record is created during top-up flow — only `WalletDepositRequest` + `SubscriptionTransaction`

**Relationship to subscription:** Wallet is linked to business (not subscription directly). Subscription wallet deductions happen via `processSubscriptionRenewals()`.

---

## STEP 7 — PAYMENT FLOW

### Current Implementation

```
Owner submits top-up
    ↓
WalletDepositRequest(status: pending, amount: X, reference: Y, paymentProof: Z)
    ↓
Admin reviews at /platform/business-activations
    ↓
Approve:
    ├── WalletDepositRequest → status: "approved", reviewedById, reviewedAt
    ├── SubscriptionWallet.balance += amount
    ├── SubscriptionTransaction(type: "deposit", amount)
    ├── IF balance >= setup_fee:
    │   ├── Subscription → status: "ACTIVE"
    │   ├── SubscriptionWallet.balance -= setup_fee
    │   ├── SubscriptionWallet.totalConsumed += setup_fee
    │   ├── SubscriptionTransaction(type: "consumption", amount: setup_fee)
    │   └── Business → status: "ACTIVE", isActive: true
    └── Audit logs created
```

### Missing Implementation
- ❌ **No Payment record created** — the `Payment` model exists but is never used to record the setup fee payment
- ❌ **No receipt/invoice generated** — no setup fee invoice
- ❌ **No notification sent** — to business owner when approved/rejected
- ❌ **No email notification** — to admin when new deposit submitted

---

## STEP 8 — BUSINESS ACTIVATION

### Current Behavior

**`Business.isActive` becomes `true` when:**
- Called by: `approveTopUp()` in `activation-service.ts`
- Set at line: `activation-service.ts:185` — `tx.business.update({ data: { status: "ACTIVE", isActive: true } })`
- Trigger condition: wallet balance >= setup fee after deposit

**Previously (before Phase 1b changes):**
- `BusinessRegistrationEngine` created all businesses with `isActive: true` (field default) — immediately active
- Subscription created as `ACTIVE` — working immediately
- Wallet credited with full setup fee — bypassing payment

**Current (after Phase 1b):**
- Business created `status: "PENDING_SETUP"`, `isActive: false`
- Subscription created `status: "PENDING"`
- Wallet created `balance: 0`

**Activation does NOT happen automatically.**
**Activation DOES require admin approval** (via `approveTopUpAction`).

---

## STEP 9 — PERMISSIONS

### Current Authorization

| Operation | Gated By | Mechanism | Status |
|---|---|---|---|
| Approve Payment | `role.slug in ["platform_admin", "admin", "super_admin"]` | Hard-coded Prisma query | ❌ BROKEN — slugs don't match seed data |
| Reject Payment | Same as above | Same | ❌ BROKEN |
| Submit Top-up | `requireAuth()` | Authentication only | ✅ Anyone logged in |
| Create Business | `hasPermission("businesses.create")` OR workspace owner | RBAC + ownership | ✅ |
| Delete Business | `requireAuth()` | Authentication only | ❌ No authz |
| Suspend Business | ❌ Does not exist | N/A | ❌ Missing |
| Reactivate Business | ❌ Does not exist | N/A | ❌ Missing |

**SLUG MISMATCH ISSUE:**
- Activation actions check for `"platform_admin"`, `"admin"`, `"super_admin"` (underscores)
- Seeded roles use `"super-admin"` (hyphen) and `"admin"`
- **Only `"admin"` matches** — `"platform_admin"` and `"super_admin"` never match any existing role
- This means platform admins with `"super-admin"` role **cannot approve payments** via the current checks

**Missing from permission seed data:**
- `subscriptions.approve`
- `subscriptions.suspend`
- `subscriptions.activate`
- `payments.approve`
- `businesses.activate`
- `businesses.suspend`

---

## STEP 10 — SALES TEAM RESPONSIBILITY CHAIN

### Current Assignment

| Stage | Responsible Party | Evidence |
|---|---|---|
| Lead Creation | Sales Agent (any) | `createLead()` auto-assigns to creator's profile |
| Lead Qualification | Assigned Sales Agent | Status progression via `updateLeadStatusAction()` |
| Lead Conversion | Assigned Sales Agent | `convertLeadAction()` or `registerCustomerBusinessAction()` |
| Business Registration | Sales Agent via Register page | `registerCustomerBusinessAction()` creates workspace + business |
| Plan Selection | Sales Agent + Business Owner | Selected during registration |
| Setup Fee Payment | Business Owner | `submitTopUpAction()` on activation dashboard |
| Payment Approval | Platform Admin/Finance | `approveTopUpAction()` — **but broken slug check** |
| Business Activation | Automated after approval | `approveTopUp()` sets `isActive: true` |
| First Login | Business Owner | Redirected by `page.tsx` to activation or overview |
| Normal Operations | Business Staff | Once activated, full access |

### Missing Roles
- **No Finance role** has approval permission defined
- **No Sales Manager** has approval permission defined
- No clear delegation chain for who approves when admin is unavailable

---

## STEP 11 — DATABASE RELATIONSHIP MAP

```
User ──┬── SalesProfile (1:1 via userId)
│       └── SalesHierarchy (M:1 via hierarchyId)
│       └── Manager (self-ref via managerId)
│       └── Lead[] (1:M via assignedToId)
│       └── LeadAssignment[] (1:M via assignedToId)
│
├── UserRole (1:M)
│       └── Role (M:1)
│               └── RolePermission (1:M)
│                       └── Permission (M:1)
│
├── Staff (1:1 via userId)
│       └── StaffAssignment (1:M)
│
├── Lead (1:M via createdBy)
├── LeadActivity (1:M via createdBy)
├── LeadAssignment (1:M via assignedBy)
│
├── WalletDepositRequest (1:M via requestedBy / reviewedBy)
└── AuditLog (1:M via userId)

Lead ──┬── LeadActivity (1:M, cascade)
│       ├── LeadAssignment (1:M, cascade)
│       └── convertedToUserId → User

Business ──┬── Workspace (M:1)
│           ├── BusinessMode (1:M)
│           ├── Branch (1:M)
│           │       └── InventoryLocation (1:M)
│           ├── Staff (1:M)
│           ├── StaffAssignment (1:M)
│           ├── Subscription (1:M, ordered)
│           │       └── SubscriptionPlan (M:1)
│           │       └── SubscriptionPayment (1:M)
│           ├── SubscriptionWallet (1:1, unique)
│           │       └── SubscriptionTransaction (1:M)
│           ├── WalletDepositRequest (1:M)
│           └── Setting (1:M)
```

---

## STEP 12 — BUSINESS STATE MACHINE

### Implemented (After Phase 1b Changes)

```
Lead Created (NEW)
    ↓
Contacted / Interested / Demo / Negotiation
    ↓
Converted (CONVERTED)
    ↓
Business Registered (status: PENDING_SETUP, isActive: false)
    ↓
Subscription Created (status: PENDING)
    ↓
Wallet Created (balance: 0)
    ↓
Owner submits top-up (WalletDepositRequest: pending)
    ↓
Admin reviews → REJECT (stay PENDING_SETUP, PENDING)
    ↓
Admin reviews → APPROVE
    ↓
Wallet Credited
    ↓
IF balance >= setup_fee:
    ├── Setup fee deducted
    ├── Subscription → ACTIVE
    ├── Business → ACTIVE (isActive: true)
    └── Owner gains access
ELSE:
    └── Still PENDING
```

---

## STEP 13 — IDENTIFY GAPS

### CRITICAL (blocks production)

| # | Gap | Location | Impact |
|---|---|---|---|
| C1 | **Permission slug mismatch** — activation actions check `"platform_admin"`, `"super_admin"` (underscores) but seed has `"super-admin"` (hyphen) | `activation/actions/index.ts:21,51,73` | Admin cannot approve any payments. Business activation is completely blocked |
| C2 | **Two duplicate RBAC systems** — `features/rbac/` and `features/roles/` duplicate the same functions | `features/rbac/services/rbac-service.ts` vs `features/roles/services/assignment-service.ts` | Confusion, maintenance burden, potential drift |
| C3 | **Onboarding service passes empty plan** — `createWorkspaceForLead()` calls engine with `plan: { id: "", amount: 0, interval: "", name: "" }` | `onboarding-service.ts:224` | Subscription has empty planId (DB constraint violation likely), zero pricing, no setup fee structure |
| C4 | **No `subscriptions.*` or `payments.*` permissions seeded** | `prisma/seed.ts` | Cannot use granular RBAC for payment approval — forced to use hardcoded slug checks |

### HIGH

| # | Gap | Location | Impact |
|---|---|---|---|
| H1 | **No Payment record created for setup fee** | `activation-service.ts:approveTopUp()` | No financial audit trail for setup fee collection |
| H2 | **No notification sent on approval/rejection** | `activation-service.ts` | Owner has no way to know their payment was processed |
| H3 | **No notification to admin when top-up submitted** | `activation-service.ts:submitWalletTopUp()` | Admin must manually refresh the page |
| H4 | **Two competing lead conversion paths** | `lead-service.ts:149` vs `lead-service.ts:337` | Leads can be "converted" without user creation (Path B) or with user creation (Path A) |
| H5 | **Registration engine does not create Walk-in Customer or default PaymentMethod** | `registrations/business/index.ts` | Missing setup items required for POS/sales operations |

### MEDIUM

| # | Gap | Location | Impact |
|---|---|---|---|
| M1 | **No trial period** — subscription starts billing immediately | `registrations/business/index.ts` | No grace period for new businesses to evaluate |
| M2 | **No setup fee invoice/receipt** | Missing entirely | No documentation of setup fee charged |
| M3 | **Suspend/Reactivate functions missing** | Missing entirely | Admin cannot manually suspend a business |
| M4 | **Deposit request API has no pagination** | `activation-service.ts:getBusinessesForAdmin()` | Will break with many pending businesses |
| M5 | **Subscription auto-renewal not wired to activation flow** | `subscription-service.ts` | After activation, renewals should check wallet |

### LOW

| # | Gap | Location | Impact |
|---|---|---|---|
| L1 | **Hardcoded sales targets** | `server/actions/sales-team.ts` | Not configurable per agent/team |
| L2 | **No refund flow** for rejected payments | `activation-service.ts` | Money already transferred, no reversal tracking |
| L3 | **No payment expiry** — pending requests don't auto-expire | `activation-service.ts` | Stale pending requests accumulate |
| L4 | **No audit log for login/view of activation page** | `activation-dashboard.tsx` | Cannot track who viewed pending activation |

---

## STEP 14 — RECOMMENDED IMPLEMENTATION

### Ideal Workflow

```
Lead (NEW)
  │  Sales Agent creates lead
  ▼
Contacted → Interested → Demo → Negotiation
  │  Agent qualifies lead through stages
  ▼
Converted (CONVERTED)
  │  Agent marks lead as converted → system creates auth user
  ▼
Business Registered (PENDING_SETUP, isActive: false)
  │  RegisterCustomerBusinessAction → BusinessRegistrationEngine
  ├── Business created
  ├── Owner Role assigned
  ├── Staff + Assignment created
  ├── Head Office Branch created
  ├── Default Inventory Location created
  ├── Default Walk-in Customer created  ← MISSING
  ├── Default Payment Method created      ← MISSING
  ├── Subscription created (PENDING)
  │   └── Plan linked correctly
  │   └── Start/End dates based on plan interval
  ├── Wallet created (balance: 0)
  └── Settings created (setup_fee, daily_price, business_size)
  ▼
Activation Dashboard Available
  │  Owner redirected to /businesses/[id]/activation
  ├── Shows: Plan name, Setup fee, Wallet balance
  ├── Shows: Payment instructions
  └── Shows: Upload proof form
  ▼
Owner Submits Payment
  │  submitTopUpAction
  ├── WalletDepositRequest created (PENDING)
  ├── Payment record created ← MISSING
  ├── Notification sent to admin ← MISSING
  └── Status: Awaiting Review
  ▼
Admin Reviews at /platform/business-activations
  │  approvetopUpAction / rejectTopUpAction
  │
  ├── APPROVED:
  │   ├── Permission: payments.approve (RBAC) ← FIX SLUG CHECK
  │   ├── WalletDepositRequest → APPROVED
  │   ├── Payment record → COMPLETED
  │   ├── Wallet credited
  │   ├── SubscriptionTransaction (deposit)
  │   ├── IF balance >= setup_fee:
  │   │   ├── Setup fee deducted (consumption tx)
  │   │   ├── Subscription → ACTIVE
  │   │   ├── SubscriptionTransaction (consumption)
  │   │   ├── Business → ACTIVE, isActive: true
  │   │   ├── Audit logs (PAYMENT_APPROVED, SUBSCRIPTION_ACTIVATED, BUSINESS_ACTIVATED)
  │   │   ├── Notification to owner ← MISSING
  │   │   └── Email to owner ← MISSING
  │   └── IF balance < setup_fee:
  │       ├── Wallet credited (partial)
  │       └── Still PENDING — show amount remaining
  │
  └── REJECTED:
      ├── WalletDepositRequest → REJECTED
      ├── Payment record → FAILED
      ├── Audit log (PAYMENT_REJECTED)
      └── Notification to owner ← MISSING
  ▼
Business Active → First Login
  │  Owner redirected to /businesses/[id]/overview
  ├── All modules accessible
  ├── Subscription auto-renewal active
  └── Normal operations begin
```

### Priority Fixes

| Priority | Fix | Effort | File(s) |
|---|---|---|---|
| **CRITICAL** | Fix permission slug check — use `"super-admin"` (hyphen) not `"platform_admin"` | 1 file, 3 lines | `activation/actions/index.ts:21,51,73` |
| **CRITICAL** | Fix onboarding service — use real plan, not empty object | 1 file, 10 lines | `onboarding-service.ts:224` |
| **CRITICAL** | Add `subscriptions.*` and `payments.*` permissions to seed | 1 file | `prisma/seed.ts` |
| **HIGH** | Create Payment record during approval | 1 file, 20 lines | `activation-service.ts:approveTopUp()` |
| **HIGH** | Add notification on top-up/approval/rejection | 2 files | `activation-service.ts`, `prisma/notification` |
| **HIGH** | Consolidate lead conversion paths | 1 file | `lead-service.ts` |
| **MEDIUM** | Add Walk-in Customer + default PaymentMethod to engine | 1 file | `registrations/business/index.ts` |
| **MEDIUM** | Add Suspend/Reactivate business functions | 1 file | `activation-service.ts` |
| **MEDIUM** | Add pagination to admin business list | 1 file | `activation-service.ts` |
| **LOW** | Make sales targets configurable | 3+ files | Seed + DB + UI |
| **LOW** | Add pending request expiry | 1 file | `activation-service.ts` |

### Summary

The core activation flow is **architecturally correct**: `PENDING_SETUP` → top-up → approval → activation. The `BusinessRegistrationEngine` creates all required records correctly. The activation service properly gates activation behind wallet balance ≥ setup fee.

**However, the flow cannot complete in production** due to the permission slug mismatch (C1) — platform admins with the `super-admin` role cannot approve payments because the activation actions check for `"super_admin"` (underscore) instead of `"super-admin"` (hyphen). This is a one-line fix.

The onboarding service (C3) is a secondary blocker — it uses an empty plan object that will either fail at DB constraint or create a subscription with zero pricing that bypasses the entire payment flow.
