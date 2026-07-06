# ENKAI Sales & Distribution Module
## Enterprise Business Analysis & Strategy Review

**Date:** 2026-07-03
**Version:** 1.0
**Classification:** Internal — Strategy Discussion

---

## Executive Summary

ENKAI's Sales & Distribution module is a comprehensive, well-architected internal sales platform spanning lead management, sales hierarchy, commission tracking, installation workflow, subscription lifecycle, and wallet-based billing. At ~126 implementation files across 7 feature domains, it represents a serious investment in sales operations infrastructure.

The architecture follows sound patterns: domain separation, transactional core operations, event-driven side effects, and extensible resolver strategies. The state machines (installation: 16 states, subscription: 6 states, lead: 7 states) are well-defined with guard rails.

However, the module has structural gaps that prevent it from being production-ready for a fast-growing multi-industry SaaS platform. **Three critical issues** must be addressed before scaling beyond 100-200 concurrent sales agents:

1. **Commission system exists but is disconnected** — `earnCommission()` is never called by any event or service. Zero commissions are automatically generated.
2. **Post-registration pipeline is skeletal** — onboarding steps 6-8 (OWNER_ASSIGNED, TRAINING_COMPLETED, ACTIVE_CUSTOMER) are defined but unreachable.
3. **No automated handoffs** between sales, installation, activation, and customer success.

**Overall Business Score: 6.5/10**
**Overall Scalability Score: 5.5/10**
**Overall Production Readiness Score: 5/10**

---

## Section 1: Current Sales Workflow Analysis

### Documented Lifecycle

```
Lead → Assignment → Contact → Follow-up → Demo → Negotiation →
Registration → Subscription → Installation Assignment →
Installation → Training → Go Live → Customer Success → Renewal
```

### Stage-by-Stage Assessment

| Stage | Implemented | Assessment |
|-------|-------------|------------|
| Lead Creation | Yes | Full CRUD with source tracking (MANUAL, SELF_REGISTRATION, SALES_REGISTRATION, REFERRAL, CAMPAIGN) |
| Assignment | Yes | Dual system: `assignLead()` (SalesProfile ID) + `transferLead()` (User ID). Audit trail via `LeadAssignment` table |
| Contact | Partial | Status tracked (CONTACTED) but no contact history beyond free-form activities. No call logging, no email integration |
| Follow-up | Partial | Activity tracking exists but no scheduled follow-up reminders, no automated re-engagement for cold leads |
| Demo | Partial | DEMO status exists. No demo scheduling, no demo feedback capture, no demo-to-proposal flow |
| Negotiation | Partial | NEGOTIATION status exists. No proposal generation, no discount approval workflow, no competitive tracking |
| Registration | Yes | `BusinessRegistrationEngine` creates 11 entities atomically. Dual path: manual (sales team) and automated (onboarding service) |
| Subscription | Partial | Wallet-based billing works. No payment collection on subscription creation. `PENDING` status is unreachable as starting state |
| Installation Assignment | Yes | `DistributorAssignment` with load tracking. But no notification to distributor when assigned |
| Installation | Yes | 16-state validated state machine. 8 default tasks auto-created. Full photo/task/training/verification models |
| Training | Partial | `InstallationTraining` model exists. Zero service functions to create training records. Data can be viewed but not managed |
| Go Live / Activation | Partial | Wallet top-up + admin approval works. But installation completion does not trigger activation. Manual gap |
| Customer Success | Missing | No customer success role, no health monitoring, no check-in schedule, no NPS, no usage metrics |
| Renewal | Partial | Auto-renewal from wallet works. No proactive renewal workflow, no renegotiation, no upgrade path |

### Missing Stages

1. **Proposal/Quote Generation** — No formal proposal or quote document generation within the sales workflow
2. **Contract Management** — No contract signing, e-signature, or terms acceptance tracking
3. **Competitive Tracking** — No lost-reason analysis, no competitor tracking, no win/loss reporting
4. **Customer Health Scoring** — No automated health metrics (login frequency, feature adoption, support tickets)
5. **Escalation Management** — No defined path for unhappy customers, churn risk flags, or management escalation
6. **Referral Loop** — `LeadSource.REFERRAL` exists but no referral reward tracking for existing customers referring new leads

---

## Section 2: Team Structure Analysis

### Current Roles (from Schema and Code)

| Role Entity | Implementation | Coverage |
|-------------|----------------|----------|
| Sales Profile | Full | `SalesProfile` with hierarchy, manager, status |
| Sales Hierarchy | Full | `SalesHierarchy` with level/title/slug |
| Manager | Partial | `managerId` on SalesProfile supports 1-level management. No multi-level org chart, no dotted-line reporting |
| Distributor/Installer | Partial | `Distributor` model exists with load/rating/region. No dedicated CRUD service. No onboarding flow |
| Regional Manager | Partial | Region field on SalesProfile. No territory assignment model or regional commission override |

### Missing Roles

| Role | Why Needed |
|------|------------|
| **Customer Success Manager (CSM)** | No post-activation ownership. Sales reps retain clients indefinitely, creating a conflict between hunting new business and serving existing accounts |
| **Support Agent** | No linkage between support tickets and sales team. Support escalations don't feed back to sales |
| **Sales Operations / Analyst** | No role for target setting, territory planning, commission calculation, pipeline reporting |
| **Channel Partner Manager** | No distributor onboarding, training, certification, or performance management workflow |
| **Marketing** | No campaign-to-lead attribution, no marketing-qualified-lead (MQL) pipeline stage |
| **Finance** | Commission payout approval requires finance role, but no dedicated approval workflow exists beyond the generic payer |

### Responsibility Conflicts

| Conflict | Description |
|----------|-------------|
| **Sales Rep keeps clients forever** | `getMyClients()` returns converted leads owned by the rep. No handoff to CSM. Rep is incentivized to close new deals, not manage renewals |
| **Commission approver = payer** | `createPayout()` uses the authenticated user as `paidById`. No separation between who approves and who pays |
| **Installer = no commission** | Distributors have no commission model. They are tracked via load/rating but not compensated through the commission system |

---

## Section 3: Lead Ownership Analysis

### Current Implementation

| Feature | Status | Details |
|---------|--------|---------|
| Assignment | Yes | `assignLead(leadId, assignedToId, assignedById, reason)` — transactional with audit |
| Reassignment | Partial | `transferLead(leadId, fromUserId, toUserId)` — inconsistent parameter types, no source validation |
| Inactive leads | Missing | No auto-detection of stale leads, no re-assignment trigger, no time-based escalation |
| Transferred leads | Partial | Activity recorded but no notification to new assignee |
| Resigned staff | Missing | No batch-reassignment when a sales profile becomes INACTIVE or SUSPENDED |
| Territory changes | Missing | No territory model. Region is a free-text field on SalesProfile. No geo-based assignment logic |
| Duplicate leads | Missing | No duplicate detection by email, phone, or business name. Multiple records for the same prospect are possible |
| Lost leads | Partial | LOST status exists. No lost-reason taxonomy, no re-engagement workflow, no cooling-off period for re-capture |
| Lead conversion | Yes | Two-phase: user creation (inline in status update) + business registration (separate action) |

### Critical Gaps

1. **Zero duplicate detection** — `createLead()` has no `findFirst` check. The Lead model has no unique constraints on email or phone. Duplicate leads will accumulate.

2. **No status transition validation** — Any status can transition to any other. `NEW → CONVERTED` is allowed without going through DEMO or NEGOTIATION. This undermines pipeline reporting.

3. **`transferLead()` accepts user IDs, not SalesProfile IDs** — Inconsistent with `assignLead()`. Also does not validate that `fromUserId` actually owns the lead.

4. **No auto-reassignment on resignation** — If a sales rep is deactivated or leaves, their leads remain assigned to them. No batch-reassign workflow exists.

5. **No lead scoring** — No mechanism to prioritize leads by engagement level, business size, or likelihood to convert.

6. **No lead source ROI tracking** — `LeadSource` enum exists but no cost-per-lead or conversion-by-source reporting.

---

## Section 4: Commission Model Analysis

### Current Architecture

```
CommissionRule (hierarchy-scoped, flat/percentage)
       ↓
CommissionLedger (per-profile, linked to subscription)
       ↓
CommissionPayout (batched, admin-approved)
```

### Commission Types Analysis

| Commission Type | Exists? | Auto-Generated? | Assessment |
|-----------------|---------|-----------------|------------|
| Subscription commission | Schema support | **NEVER** | `subscriptionId` field on `CommissionLedger` but no code path calls `earnCommission()` |
| Activation commission | Schema support | **NEVER** | No trigger from activation service |
| Installation commission | Not implemented | **NEVER** | Distributor model has no commission link |
| Renewal commission | Not implemented | **NEVER** | No renewal event triggers commission |
| Referral commission | Not implemented | **NEVER** | `CustomerReferral` exists for customers, not for sales reps |
| Upsell commission | Not implemented | **NEVER** | No upsell detection or tracking |
| Recurring commission | Not implemented | **NEVER** | No recurring commission logic (e.g., 5% of monthly subscription for 12 months) |
| Manager override | Schema support | **NEVER** | Manager-level rules via `SalesHierarchy` could work if rules were applied, but no cascade logic |
| Regional override | Not implemented | **NEVER** | No regional commission rates |
| Performance bonus | Not implemented | **NEVER** | Targets exist but no bonus calculation tied to attainment |
| Team bonus | Not implemented | **NEVER** | No team-level aggregation or bonus pool allocation |

### Critical Finding

**The entire commission system is a manual bookkeeping system.** The `earnCommission()` and `createEntry()` functions exist but nothing calls them. No subscription payment, activation, installation, or renewal event creates a commission entry. All 12 commission types that a sales-driven SaaS business requires are either missing or not automated.

### Fraud Risk Assessment

| Risk | Severity | Current Mitigation |
|------|----------|-------------------|
| Fake subscriptions for commission | HIGH | No prevention — commission would be earned on subscription creation with no payment validation |
| Self-dealing (sales rep registers own business) | HIGH | No detection — a rep could create leads for themselves and earn commission |
| Collusion with distributor | MEDIUM | No cross-referencing — installer and sales rep could collude on fake installations |
| Double payment of same entry | MEDIUM | Prevented: `payoutId` check ensures paid entries are excluded from pending |
| Early commission payout before payment clears | HIGH | Commissions are earned on subscription creation, not on payment receipt |
| Cancelled subscription -> no clawback | HIGH | No clawback/chargeback logic. If subscription is cancelled, commission already paid is not recoverable |
| Rounding/calculation manipulation | LOW | `calculateCommission` uses Prisma Decimal for precision |
| Unauthorized approval | MEDIUM | `approveEntry()` checks PENDING status only. No role-based approval gate |

---

## Section 5: Installation Team (Distributor) Analysis

### Current Workflow

```
Distributor (region, status, load, rating)
         ↓
InstallationTicket (16-state machine, 6 types)
         ↓
InstallationTask (8 defaults: setup, configuration, catalog, payment, delivery, qr, training, testing)
         ↓
InstallationTraining (topic, trainer, duration)
         ↓
InstallationVerification (business_verification, customer_test, owner_approval)
         ↓
ACTIVATED (terminal)
```

### Assessment

| Aspect | Status | Details |
|--------|--------|---------|
| Assignment | Functional | Transactional assignment with load tracking (`currentLoad` increment). No notification sent to distributor |
| Scheduling | Partial | `scheduledDate` on `DistributorAssignment` exists but never set. `siteVisitDate` set only at status transition |
| Installation tracking | Strong | 16-state machine with validated transitions. 8 default tasks. Photo upload model exists but no service functions |
| Verification | Partial | `InstallationVerification` model exists with 3 types. No service functions to create records. `ownerApproved` handled via ticket field |
| Training | Partial | `InstallationTraining` model exists. Zero service functions to create/complete records |
| QR generation | Manual | Status includes `QR_GENERATED`, `QR_PRINTED`, `QR_INSTALLED` but no integration with QR code systems |
| Approval | Functional | `approveInstallationAction` transitions to ACTIVATED. Sets `ownerApproved` |
| Maintenance | Partial | `InstallationType.MAINTENANCE` and `REPLACEMENT` exist. No separate maintenance workflow |

### Compensating Distributors

**Current state:** Distributors have `rating` and `totalInstallations` fields but are NOT connected to the commission system. There is no `CommissionLedger` entry for distributors — the `salesProfileId` links to `SalesProfile`, not `Distributor`.

**Recommendation:** Distributors should be compensated via a hybrid model:
- **Base pay per installation** (flat rate, varies by complexity)
- **Quality bonus** (rating > 4.5, no rework within 30 days)
- **Training completion bonus** (per training session delivered)
- **Not recommended:** Percentage of subscription value (creates wrong incentives — installer should be quality-focused, not sales-focused)

---

## Section 6: Customer Success Analysis

### Current State

**There is no Customer Success function.** The closest analogues are:

| Function | Where It Lives | Problem |
|----------|---------------|---------|
| Business registration | Sales team | Sales rep owns the client forever |
| Activation | Activation service (admin) | No ongoing relationship management |
| Installation completion | Distributor + admin | Ends at ACTIVATED status |
| Subscription renewal | Auto-cron (wallet) | No human relationship, no churn prevention |
| Support | Assumed elsewhere | No link to sales pipeline |

### Responsibilities Separation

| Activity | Sales | Customer Success | Current Owner |
|----------|-------|-----------------|---------------|
| Lead generation | Primary | None | Sales (correct) |
| Demo | Primary | None | Sales (correct) |
| Registration | Primary | None | Sales (correct) |
| Onboarding | Assist | Primary | Sales (should be CS) |
| Training | Assist | Primary | Distributor (partial) |
| Go-live | None | Primary | Activation service (admin) |
| Health monitoring | None | Primary | No one |
| Renewal management | None | Primary | Cron job |
| Upsell | Secondary | Primary | No one |
| Churn prevention | None | Primary | No one |
| Advocacy/referrals | None | Primary | No one |

**Conclusion:** Sales owns clients from lead to eternity. This creates a fundamental conflict: the sales rep is incentivized to find new logos, but their compensation (if ever automated) would depend on existing client retention. No CSM role exists to own post-sale relationships.

---

## Section 7: Payment & Commission Flow Analysis

### Current Commission Money Flow

```
Event (trigger) → earnCommission() → PENDING → approveEntry() → APPROVED
                                                              ↓
                                                         createPayout() → PAID
                                                              ↓
                                                         CANCELLED (no action exists)
```

### Analysis by Stage

| Stage | Implemented | Assessment |
|-------|-------------|------------|
| **Earned** | No | `earnCommission()` exists but is never called. No event listener triggers it |
| **Pending** | Schema only | Entries would need manual creation. Status defaults to PENDING |
| **Approved** | Yes | `approveEntry()` validates PENDING status. No role gate |
| **Paid** | Yes | `createPayout()` validates APPROVED status. Transactional batch. Records who paid |
| **Cancelled** | Partial | Status exists in enum. No `cancelEntry()` function exists |
| **Refund impact** | Not implemented | No clawback. If subscription is refunded, paid commission is not reversed |
| **Subscription failure impact** | Not implemented | No logic to reverse commission when subscription enters GRACE_PERIOD or SUSPENDED |

### Cash Flow Timing Risk

The current design would earn commission at subscription creation (when `earnCommission` would be called). This creates a timing mismatch:

1. Day 1: Sales rep earns commission ($100)
2. Day 2: Business enters GRACE_PERIOD (insufficient wallet)
3. Day 7: Commission is APPROVED and PAID
4. Day 14: Subscription is CANCELLED

**Result:** Commission was paid on a subscription that never generated revenue. No clawback mechanism exists.

**Best Practice:** Commissions should be earned on PAID subscriptions only, or paid on a delayed schedule (e.g., earned at subscription creation, paid after 90 days, with chargeback for early cancellations).

---

## Section 8: KPI Recommendations

### Sales Representative

| KPI | Recommendation | Source |
|-----|---------------|--------|
| Leads created (monthly) | Individual target | Lead table |
| Conversion rate | % of leads converted | Lead status |
| Average days to convert | Pipeline velocity | Lead timestamps |
| Active pipeline value | Sum of deal values in NEGOTIATION+ | Lead (if value field was added) |
| Commissions earned (monthly) | Total PENDING + APPROVED | CommissionLedger |
| New businesses registered | Registered this month | Business + activity log |
| Customer satisfaction (CSAT) | Post-activation survey | New table needed |
| Lead response time | Hours to first contact | Lead timestamps |

### Sales Manager

| KPI | Recommendation |
|-----|---------------|
| Team conversion rate | Average of all reps |
| Team revenue (commissions) | Sum of all rep commissions |
| Rep retention | % of reps meeting quota |
| Territory penetration | % of target businesses registered |
| Pipeline health | % of team with 3x quota in pipeline |

### Installer / Distributor

| KPI | Recommendation |
|-----|---------------|
| Installations per month | Count |
| Average installation duration | Status timestamps |
| Quality score | Post-installation survey |
| First-time pass rate | No rework within 30 days |
| Training completion rate | Training records |

### Customer Success

| KPI | Recommendation |
|-----|---------------|
| Active customers (cohort) | Business status |
| Churn rate | Monthly cancellations |
| NPS score | Survey |
| Time-to-value | Days from registration to first active use |
| Upsell conversion rate | % of customers upsold |
| Support tickets per customer | Link to support system |

### Finance

| KPI | Recommendation |
|-----|---------------|
| Commission expense ratio | Commission $ / Revenue $ |
| Days to pay commission | Approval → Paid |
| Pending commission liability | Sum of APPROVED entries |
| Clawback rate | % of paid commissions reversed |

### Marketing

| KPI | Recommendation |
|-----|---------------|
| Cost per lead | Campaign spend / leads created |
| Lead-to-customer rate by source | Conversion by LeadSource |
| Campaign ROI | Revenue / campaign cost |

---

## Section 9: Risk Analysis

### Risk Register

| # | Risk | Likelihood | Impact | Severity | Current Mitigation |
|---|------|-----------|--------|----------|-------------------|
| R1 | Commission fraud (fake subscriptions) | HIGH | HIGH | CRITICAL | None — no payment verification before commission earning |
| R2 | Duplicate leads for same prospect | HIGH | MEDIUM | HIGH | None |
| R3 | Lead stealing between sales reps | MEDIUM | HIGH | HIGH | None — no lead ownership enforcement period |
| R4 | Sales rep registers own business for commission | MEDIUM | HIGH | HIGH | None — no self-dealing detection |
| R5 | Collusion: rep + installer fake installation | MEDIUM | HIGH | HIGH | Owner approval gate exists but no automated verification |
| R6 | Cancelled subscriptions with paid commissions | MEDIUM | HIGH | HIGH | No clawback mechanism |
| R7 | Distributor load cap bypass | LOW | MEDIUM | MEDIUM | `currentLoad` increment in transaction prevents this |
| R8 | Unauthorized commission approval | MEDIUM | MEDIUM | MEDIUM | No role-based approval gate; anyone with access can approve |
| R9 | Grace period never collected → revenue loss | MEDIUM | HIGH | HIGH | Auto-suspension after grace period. No retry logic for payment collection |
| R10 | Onboarding stuck at step 5 with no recovery | MEDIUM | MEDIUM | MEDIUM | No timeout or escalation for incomplete onboarding |
| R11 | Data leakage between tenants (multi-workspace) | LOW | HIGH | HIGH | No workspaceId on Lead model — unclear isolation model |
| R12 | Inactive sales staff still assigned leads | MEDIUM | MEDIUM | MEDIUM | No auto-reassignment on status change to INACTIVE |

### Top 5 Critical Risks

1. **Commission fraud (R1)** — No validation that subscriptions are paid before commission is earned. A sales rep could register 100 businesses, earn commission on all, and the businesses never pay.
2. **No clawback (R6)** — Once commission is paid, it's gone. Subscription cancellations within the first month are common in SaaS.
3. **Self-dealing (R4)** — Sales rep creates a business for themselves or a family member, earns activation commission, and the business never actually uses the platform.
4. **Lead stealing (R3)** — No ownership enforcement. A rep can transfer leads from another rep without the original owner's consent or knowledge.
5. **Duplicate leads (R2)** — Without deduplication, the pipeline is inaccurate. Multiple reps could claim the same prospect, leading to commission disputes.

---

## Section 10: Scalability Analysis

### Current Architecture Assessment

| Aspect | Assessment | Bottleneck? |
|--------|-----------|-------------|
| Database schema | 17 sales-related models, well-indexed | No — Prisma/PostgreSQL handles this |
| Transactional core | Atomic operations with $transaction | No — but high contention on hot entities |
| Lead model | No workspace isolation. No party/tenant field | YES — needs workspace/org scoping for multi-tenant |
| Commission calculation | Pure function, no DB bottleneck | No — CPU-bound, scales horizontally |
| Commission ledger | Append-only, aggregated queries | No — well-indexed, no contention |
| Installation tickets | Linear progression, per-business | No — naturally sharded by businessId |
| Auto-renewal cron | Single-process cron | **YES** — sequential processing of all subscriptions |
| Wallet transactions | Per-business, low contention | No — naturally sharded |
| QR codes | Bulk operations, pre-generated | No — one-time cost |
| Dual code paths | Legacy + feature-module duplication | **YES** — maintenance burden doubles with scale |

### Scale Projections

| Metric | 100 Businesses | 1,000 Businesses | 10,000 Businesses | 100,000 Businesses |
|--------|---------------|-----------------|-------------------|-------------------|
| Sales Profiles | ~10 | ~50 | ~200 | ~1,000 |
| Leads/month | ~50 | ~500 | ~5,000 | ~50,000 |
| Commissions/month | ~30 | ~300 | ~3,000 | ~30,000 |
| Installations/month | ~10 | ~100 | ~1,000 | ~10,000 |
| Auto-renewals/day | ~3 | ~30 | ~300 | ~3,000 |
| Wallet transactions/day | ~10 | ~100 | ~1,000 | ~10,000 |

### Identified Bottlenecks

1. **Auto-renewal cron (`processSubscriptionRenewals`)** — Single-threaded, processes all active subscriptions sequentially. At 100K businesses with monthly billing, this would process ~3,300 renewals daily in one batch. The wallet balance check + deduction + extension is 3 DB operations per subscription. At ~10ms each, that's ~33 seconds per day — acceptable. With daily billing (100K/day), it's ~1,000 seconds — a problem.

2. **Commission metrics aggregation** — `getMyPerformanceMetrics()` queries commission ledger and lead counts individually per user. At 1,000 sales reps, dashboard loading would degrade. Needs materialized views or cached aggregation.

3. **Lead search (inline ILIKE)** — Not yet migrated to the SearchService abstraction. At 50K+ leads, `WHERE firstName ILIKE '%term%'` becomes a sequential scan problem.

4. **Dual code paths** — Two complete implementations of commission logic (feature + legacy server). At scale, bug fixes must be applied twice, and drift is inevitable.

5. **No read replicas** — All queries hit the primary database. Reporting queries (metrics, monthly history) would compete with transactional loads.

6. **Manual commission processing** — At 3,000+ commission entries/month, manual approval by an admin becomes a bottleneck. Automation is required.

---

## Section 11: Multi-Industry Readiness

### Current State

The Sales & Distribution module is built for selling a **single SaaS product** (ENKAI platform subscriptions) to businesses across industries. The industry variation is at the *customer's* business level (what industry the customer operates in), not at the sales process level.

### What's Universal

These sales workflow elements apply to ALL industries and need no variation:

| Element | Works For | Reason |
|---------|-----------|--------|
| Lead creation/assignment | All industries | Prospect identification is universal |
| Sales hierarchy | All industries | Sales team structure is internal, not customer-dependent |
| Commission rules | All industries | Compensation policy is internal |
| Subscription billing | All industries | SaaS pricing is subscription-based for all |
| Wallet/top-up | All industries | Payment mechanism is internal |
| Distributor management | All industries | Installation team is internal |
| Installation workflow | All industries | Technical onboarding steps are the same |

### What Should Be Industry-Specific

| Element | Should Vary? | Why |
|---------|-------------|-----|
| Lead qualification criteria | YES | A restaurant prospect and a hospital prospect have different decision criteria, timeline, and compliance needs |
| Demo content | YES | Demo workflow, demo environment setup, and trial period vary by industry complexity |
| Pricing/packaging | YES | Different industries have different plan structures, user counts, and add-on modules. Already partially supported via resolver pattern |
| Installation complexity | YES | A single QR code installation for retail vs. full multi-department setup for manufacturing have different task checklists |
| Training requirements | YES | Restaurant staff training (menu management, POS) vs. hospital training (patient records, billing compliance) differ significantly |
| Compliance/regulatory checks | YES | Healthcare needs HIPAA compliance verification. Education needs data privacy checks. Real estate needs licensing verification |
| Time-to-value expectations | YES | Retail can go live in hours. Manufacturing may take weeks. The pipeline should reflect this |

### Current Industry Engine Integration

The Industry Engine (`src/server/industry/`) correctly identifies the customer's industry and mode but has **zero integration** with the Sales & Distribution module:

- The engine neither receives industry context from sales nor provides industry-specific sales guidance
- No industry-specific lead qualification criteria
- No industry-specific installation task templates
- No industry-specific pricing passed to sales during registration

**Conclusion:** The module is industry-agnostic — it works for all industries but optimizes for none. This is acceptable for MVP but will become a competitive disadvantage as ENKAI targets complex verticals like healthcare and manufacturing.

---

## Section 12: Recommendations

### Critical Improvements (Must Fix Before Scaling)

#### C1: Automate Commission Earning

**The single biggest gap.** Wire `earnCommission()` into real business events.

- **Trigger points:** Subscription activation (wallet top-up approved), not subscription creation. Commission should be earned on paid subscriptions only.
- **Events to hook into:** `BUSINESS_ACTIVATED`, `WALLET_FUNDED`, `SUBSCRIPTION_RENEWED` (via event bus)
- **Hierarchy cascade:** When earned, cascade commission calculation up the management chain (rep → manager → regional manager)
- **Business justification:** Without this, the commission system is unusable in production
- **Priority:** P0 — Pre-production blocker

#### C2: Implement Commission Clawback

- **Trigger:** Subscription CANCELLED, SUSPENDED, or entering GRACE_PERIOD within 90 days of commission payment
- **Mechanism:** Create negative commission ledger entry or recalculate and refund
- **Business justification:** SaaS businesses lose 5-10% of new subscribers within 90 days. Paying commission on these is pure loss
- **Priority:** P0 — Fraud prevention

#### C3: Add Duplicate Lead Detection

- **Check on create:** Search existing leads by email (exact match) and phone (exact match). Flag duplicates
- **Merge workflow:** Allow merging duplicate leads, preserving activity history
- **Prevent double-assignment:** Warn if the same email/phone already has an active lead assigned to a different rep
- **Business justification:** Without this, lead data quality degrades rapidly, pipeline metrics become unreliable, and commission disputes multiply
- **Priority:** P0 — Data integrity

#### C4: Add Lead Transition Validation

- **Define valid transitions:** `NEW → CONTACTED → INTERESTED → DEMO → NEGOTIATION → CONVERTED` with `LOST` as terminal from any stage
- **Prevent backward transitions:** Once a lead is LOST, it should not go back to NEGOTIATION without a re-open workflow
- **Prevent skip transitions:** A lead should not jump directly from NEW to CONVERTED
- **Business justification:** Pipeline integrity depends on accurate stage tracking for forecasting
- **Priority:** P1 — High

#### C5: Implement Lead Auto-Reassignment on Staff Changes

- **On sales profile → INACTIVE/SUSPENDED:** Batch-reassign all assigned leads to the manager
- **Grace period before reassignment:** 7-day notice before auto-reassignment
- **Activity log:** Record the reassignment reason
- **Business justification:** Sales team turnover is normal. Without this, leads are orphaned
- **Priority:** P1 — High

#### C6: Add Customer Success Role and Handoff

- **Create CSM role** as a new SalesHierarchy level or separate team structure
- **Implement handoff trigger:** When a business reaches ACTIVATED status, ownership transfers from sales rep to CSM
- **Sales rep retains referral credit** for renewals (e.g., 50% of first year commission, 25% of renewal commission for the CSM)
- **Business justification:** Sales and retention require different skills. Combining them hurts both
- **Priority:** P1 — High

### Recommended Improvements (Should Have Before Full Launch)

#### R1: Role-Based Commission Approval

- Add `commissions.approve` and `commissions.pay` permissions
- Require different roles for approval and payout (four-eyes principle)
- Business justification: Prevents unauthorized payouts. Current design lets anyone with access approve and pay

#### R2: Sales Targets Database-Backed

- Create `SalesTarget` model (salesProfileId, period, metric, targetValue)
- Replace hardcoded targets in `getMyTargetsAction()` with DB queries
- Add target progress visualization to sales dashboard
- Business justification: Hardcoded targets are not usable in production

#### R3: Lead Ownership Enforcement

- Prevent transfer of leads without the original owner's explicit approval
- Add "cooling period" (7 days) before a lead can be reassigned after assignment
- Escalate unresolved leads to manager after 30 days of inactivity
- Business justification: Reduces internal conflict and commission disputes

#### R4: SearchService Migration

- Migrate lead search from inline `contains + mode: insensitive` to the existing `PrismaSearchAdapter`
- Business justification: Performance at scale. The infrastructure already exists; this is finishing what was started

#### R5: Distributor CRUD Service

- Create dedicated `distributor-service.ts` with create/update/delete/suspend functions
- Add distributor onboarding flow (profile, region assignment, certification tracking)
- Business justification: Current system has no way to onboard new installers

#### R6: Training and Verification Service Functions

- Implement `createTrainingRecord()`, `completeTraining()`, `createVerification()`, `approveVerification()`
- Link training completion to installation status progression (can't reach STAFF_TRAINED without training records)
- Business justification: Model data exists but cannot be created through the application

### Optional Improvements (Post-Launch)

#### O1: Proposal Generation

- Generate proposal documents (PDF) from lead data + selected plan
- Capture proposal sent date, follow-up date, competitive information
- Value: Provides sales enablement tool. Differentiation from competitors

#### O2: Lead Scoring

- Score leads based on engagement (activities, email opens, demo attendance) + business profile (size, industry fit)
- Route high-score leads to senior sales, low-score to automated nurture
- Value: Improves sales efficiency by focusing effort on highest-probability leads

#### O3: Territory Management

- Create Territory model (region, assigned sales team, target, market size)
- Auto-assign leads by territory based on prospect location
- Prevent cross-territory assignment without manager approval
- Value: Enables geographic sales organization. Reduces territory disputes

#### O4: Distributor Commission (Installation Fee)

- Add per-installation flat fee paid to distributor on successful activation
- Quality-adjusted (higher for 5-star ratings, lower for rework)
- Value: Aligns installer incentives with quality outcomes

#### O5: Recurring Commission for Sales Reps

- Pay small recurring commission (e.g., 2% of monthly subscription) for 12 months
- Creates ongoing incentive for rep to ensure customer success
- Value: Aligns sales incentives with retention. Industry standard in SaaS

#### O6: Payment-to-Wallet Integration

- Wire `recordPayment()` to credit the `SubscriptionWallet`
- Allow auto-payment from integrated payment gateway (not just manual top-up)
- Value: Removes friction from subscription renewal. Reduces reliance on manual deposit requests

### Future Enhancements (Phase 2+)

#### F1: Automated Dunning

- Email/SMS notifications at: 7 days before subscription expiry, on grace period entry, on suspension
- Payment link included in notifications
- Auto-retry failed payment attempts (3 retries with escalating intervals)
- Value: Reduces involuntary churn. Common SaaS best practice

#### F2: Plan Change/Upgrade/Downgrade

- `changePlan()` function with proration logic
- Seamless upgrade (immediate, charge difference) and downgrade (delayed to next billing)
- Commission recalculation on plan changes
- Value: Enables growth revenue from existing customers. Standard SaaS requirement

#### F3: Customer Health Dashboard

- Composite score based on: login frequency, feature adoption (module count), support ticket volume, payment history
- Alerts for health score drops (early churn prediction)
- Value: Proactive retention. CSM teams rely on health scoring for prioritization

#### F4: Win/Loss Analysis

- Capture lost reasons (taxonomy: price, competitor, timing, no decision, implementation concerns)
- Win/loss reporting by rep, region, industry, source
- Competitive intelligence tracking
- Value: Improves sales strategy. Provides product feedback

#### F5: Channel Partner Portal

- Self-service portal for distributors to view assignments, upload photos, complete tasks
- Commission/payment history for distributors
- Training certification tracking
- Value: Reduces admin overhead. Scales the installer network

#### F6: SLA Management

- Time-based SLAs for each installation step (e.g., assign distributor within 24 hours, site visit within 48 hours)
- Escalation when SLAs are breached
- Dashboard showing SLA compliance
- Value: Ensures consistent customer experience. Enables quality guarantees

---

## Final Report

### Overall Architecture Review

**Score: 7/10**

The Sales & Distribution module has a strong architectural foundation:

| Strength | Detail |
|----------|--------|
| Domain separation | 7 clearly separated feature modules (leads, sales-network, commissions, installations, activation, subscriptions, businesses) |
| Transactional core | All critical operations use `$transaction` for atomicity |
| State machines | Installation (16 states) and subscription (6 states) have validated transitions |
| Event-driven design | Event bus wired for business activation and wallet funding events |
| Extensible patterns | Resolver strategy (industry-specific), context adapters (registration), hierarchy-based rule scoping |

| Weakness | Detail |
|----------|--------|
| Dual code paths | Commission logic exists in both feature and legacy paths. Schema validation exists in both feature and lib paths |
| Unreachable states | Onboarding steps 6-8 are defined but unreachable. Commission system exists but never automated |
| Missing automation | Zero commission auto-generation. No training/verification service functions |
| Inconsistent parameter patterns | `assignLead` uses SalesProfileId, `transferLead` uses UserId |
| No multi-tenant isolation on Lead | Lead model has no workspaceId or businessId |

### Workflow Review

**Score: 6/10**

| Stage | Score | Notes |
|-------|-------|-------|
| Lead → Assignment → Demo → Negotiation | 7/10 | Solid base but lacking dedup, transition validation, scoring, and proposal generation |
| Registration → Subscription | 8/10 | Strong transactional engine. Missing payment collection on creation |
| Installation Assignment → Installation | 7/10 | 16-state machine is excellent. Missing notification, scheduling, training/verification CRUD |
| Training → Go Live | 4/10 | Training tracking is view-only. Activation requires manual wallet top-up. No automated handoff |
| Customer Success → Renewal | 3/10 | No CSM role. No health monitoring. Auto-renewal exists but no proactive retention |

### Commission Strategy Review

**Score: 3/10**

The weakest area. The infrastructure for commission management is in place (rules, ledger, payouts, hierarchy scoping) but none of it is automated. The system cannot generate a single commission entry without manual database intervention. All 12 commission types a SaaS business requires are either not implemented or not wired to events. Fraud prevention is minimal. There is no clawback mechanism.

### Team Structure Review

**Score: 5/10**

Sales hierarchy and profiles are well-implemented. Multi-level management is supported. However, there is no Customer Success role, no Sales Operations role, no Channel Partner Manager, and no Finance role within the commission approval workflow. The sales rep owns the client from lead to eternity, which creates a fundamental conflict between hunting and farming.

### Risk Analysis

**Score: 4/10**

12 identified risks, 5 rated CRITICAL. The highest-severity risks (commission fraud, no clawback, self-dealing, lead stealing, duplicate leads) have minimal or no mitigation. The current system is vulnerable to financial abuse if commissions are automated without safeguards.

### Scalability Analysis

**Score: 5/10**

The module will operate adequately for 100-1,000 businesses. Beyond that, five bottlenecks emerge: the single-threaded auto-renewal cron, inline ILIKE search on Lead, dual code paths requiring double maintenance, missing materialized views for sales metrics, and manual commission processing. The database schema with proper indexing will scale but the application-level patterns will not.

### Multi-Industry Readiness

**Score: 7/10**

The module is correctly industry-agnostic for a SaaS platform. The sales process (lead, commission, subscription, installation) is internal and should not vary by customer industry. However, the module has zero integration with the Industry Engine — it cannot provide industry-specific lead qualification, demo content, installation task templates, or pricing guidance to sales reps. This is acceptable for MVP but needs attention for vertical market expansion.

### Final Recommendations Summary

| Priority | Count | Key Items |
|----------|-------|-----------|
| Critical (P0) | 2 | Automate commission earning, implement clawback |
| High (P1) | 4 | Duplicate detection, transition validation, auto-reassignment, CSM role + handoff |
| Recommended | 6 | Role-based approval, DB-backed targets, ownership enforcement, SearchService migration, distributor service, training/verification CRUD |
| Optional | 6 | Proposals, lead scoring, territory management, distributor commission, recurring commission, payment-to-wallet |
| Future | 6 | Dunning, plan changes, health dashboard, win/loss analysis, partner portal, SLA management |

### Overall Scores

| Dimension | Score | Interpretation |
|-----------|-------|----------------|
| **Business Completeness** | 6.5/10 | Core flow exists. Post-sale pipeline is skeletal. Commission system is disconnected |
| **Scalability** | 5.5/10 | Works for 100-1K businesses. Five bottlenecks emerge beyond that |
| **Production Readiness** | 5/10 | Commission system cannot run in production without automation + fraud prevention. Would require manual commission management, which breaks at scale |

---

*This review is based on the existing implementation as of July 3, 2026. All findings are based on code analysis of 126 sales-related files across 7 feature modules, 17 Prisma models, 11 related enums, and the supporting industry engine infrastructure. No changes were made to the codebase during this review.*
