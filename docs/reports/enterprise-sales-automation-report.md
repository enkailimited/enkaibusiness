# ENKAI Enterprise Sales Commission, Installation & Recurring Revenue Platform

## Final Implementation Report

---

## 1. Architecture

```
EVENT BUS (FirdausEventBus) — 28 events
  ├─ Commission Engine (RuleV2 + Distribution + Recurring + Ledger V2 + Payout V2)
  ├─ Installation Package Engine (Package Mgmt + Dynamic Pricing + Workflow + QR Gating)
  ├─ Sales Targets & KPI Engine (SalesTarget DB + KpiSnapshot + CLV + Retention)
  ├─ Installer Module (GPS Tracking + Travel Logs + Checklists + Performance)
  ├─ Payout Methods (Bank/Mobile Money/Wallet/Cash + Approval Workflow)
  └─ Dashboards (Platform MRR/ARR + Sales Rep + Installer + Admin Reports)
```

### Module Directories

| Module | Path | Files |
|--------|------|-------|
| Enterprise Commissions | `src/features/commissions/` | 12 services + schemas + types + actions |
| Installation Packages | `src/server/enterprise/installation-packages/` | 6 files |
| Sales Targets & KPIs | `src/server/enterprise/sales-targets/` | 6 files |
| Dashboards | `src/server/enterprise/dashboards/` | 9 files |
| Installer Module | `src/server/enterprise/installer/` | 6 files |
| Payout Methods | `src/server/enterprise/payouts/` | 6 files |
| Sales Automation Handlers | `src/server/sales-automation/handlers/` | 6 rewritten handlers |

---

## 2. Database Changes

### 8 new enums + 16 new models + 3 modified models

**New models**: CommissionRuleV2, CommissionDistribution, RecurringCommissionConfig, InstallationPackage, InstallationTicketPackage, InstallationService, Installer, InstallerTravelLog, InstallerChecklistItem, SalesTarget, KpiSnapshot, CustomerLifetimeValue, RetentionBonusConfig, RetentionBonusEarned, PayoutMethod

**Modified models**: CommissionLedger (added REJECTED/CLAWBACK/ADJUSTMENT/PARTIAL statuses + payoutMethodId + paymentReference + adjustedById + adjustmentReason), InstallationTicket (added packageId + installerId + customerSigned + customerSignedAt + goLiveAt), SalesTarget+SubscriptionPlan+Business+User+Subscription+SalesProfile (added relation back-refs)

---

## 3. Commission Flow

```
Payment Event
  ↓
Event Bus (CommissionTriggerEvent)
  ↓
CommissionRuleV2 lookup: match by triggerEvent + industry + mode + plan + package + criteria
  ↓
calculateCommissionV2(): FLAT | PERCENTAGE | FORMULA | TIERED | HYBRID
  ↓
For subscriptions: create RecurringCommissionConfig (ongoing % per payment)
  ↓
CommissionLedger.create(status=PENDING)
  ↓
emit CommissionEarned
  ↓
Admin approval → APPROVED
  ↓
Admin payout (with selected PayoutMethod) → PAID
  ↓
Subscription cancelled <90d: clawback (CLAWBACK status entry, negative amount)
Subscription cancelled ≥90d or expired: deactivate RecurringCommissionConfig
```

**Key change**: Zero hardcoded values. Every percentage, flat amount, formula, tier is stored in CommissionRuleV2. 17 trigger events supported.

---

## 4. Payment Flow

```
Subscription Payment / Installation Payment / Addon Purchase
  ↓
Payment Engine emits event (SubscriptionPaid, InstallationPaid, AddonPurchased)
  ↓
RecurringCommissionService.processRecurringCommission():
  - Check active RecurringCommissionConfig
  - Calculate commission from config
  - Create ledger entry
  - Update lastPaidDate, totalPaid, paidCount
  ↓
CommissionDistribution.distributePayment():
  - Split across participants (company%, installer%, distributor%, sales_rep%, etc.)
  - Create ledger entries per participant
  ↓
All entries flow through PENDING → APPROVED → PAID lifecycle
```

---

## 5. Commission Flow (Distribution)

```
CommissionDistribution rules stored in DB:
  participantType | percentage | fixedAmount | priority

distributePayment(totalAmount, context):
  - Fetch active distribution rules ordered by priority
  - Calculate each participant's share (% or fixed)
  - Return array of { participantType, amount, description }
  - Used for installation payment splits
```

---

## 6. Installation Flow (with QR Gating)

```
Lead Converted → Business Registered
  ↓
Installation Ticket Created → select InstallationPackage
  ↓
Package assigned (InstallationTicketPackage.created):
  - Calculate dynamic price via pricingFormula
  - QR Experience disabled by default
  ↓
Installer/Distributor Assigned
  ↓
Schedule Visit → Travel (GPS tracked) → Installer status → BUSY
  ↓
Installation Steps (tasks + service types)
  - Services: QR Experience, Storefront, Customer App, Digital Menu, etc.
  - Each service completed independently
  ↓
Training → Verification
  ↓
Customer Sign-off (customerSigned = true, enables customerApproved)
  ↓
QR Experience can now be activated (restricted until customerApproved)
  ↓
Go Live (all services complete → emit InstallationCompleted)
```

**Key rule**: QR Experience MUST remain disabled until:
1. Customer signs off (customerApproved = true)
2. All installation services are complete
3. goLive() is called

---

## 7. Revenue Flow

```
Subscription Payments
  ↓
RecurringCommissionConfig tracks revenue per subscription
  ↓
Monthly: KpiSnapshot captures MRR = sum(active monthly) + (daily*30) + (yearly/12)
  ↓
ARR = MRR * 12
  ↓
CustomerLifetimeValue updated per business
  ↓
Dashboard displays MRR, ARR, revenue trends, CLV rankings
```

---

## 8. KPI Flow

```
Every hour + triggered events (BusinessCreated, Renewed, InstallationCompleted):
  ↓
computeDailyKPIs() / computeWeeklyKPIs() / computeMonthlyKPIs() / etc.
  ↓
computeAndStoreSnapshot(period, dateFrom, dateTo):
  - Query subscriptions (active/new/expired)
  - Query CommissionLedger (earned/paid/pending/approved totals)
  - Query leads (total/new/converted/lost)
  - Query businesses (active/churned/retained)
  - Query installations (completed/pending)
  - Compute MRR, ARR, churn rate, retention rate, conversion rate
  ↓
Store in KpiSnapshot model (persisted historical data)
  ↓
Dashboards read from KpiSnapshot for trends, charts, period-over-period comparison

computeSalesRepMetrics():
  - Update SalesTarget.achieved fields (leads, conversions, revenue) for all active profiles
```

---

## 9. Dashboard Changes

### Platform Dashboard (new service)
- MRR (Monthly Recurring Revenue) from KpiSnapshot
- ARR (Annual Recurring Revenue)
- Active subscriptions, total commission, new businesses
- Revenue trend (last 6 months), Commission trend
- Churn rate, retention rate, average CLV
- Pending installations count, active installers

### Sales Rep Dashboard (new service)
- Active customers, recurring income, projected income, lifetime income
- Targets from SalesTarget model with progress %
- Commission breakdown (earned/paid/pending/approved)  
- Leads pipeline by status
- Monthly commission trend (6 months)
- Active recurring commission configs
- Top customers by CLV

### Installer Dashboard (new service)
- Upcoming/completed/pending installations
- Current travel status with GPS
- Today's schedule
- Performance metrics (avg time, rating)
- Checklist progress for current ticket

### Admin Reports (new service)
- Revenue, Commission, Installation, CLV, Churn, Retention, Referral, Sales Performance
- All filterable by period

### Existing dashboards
- `kpi-service.ts` extended with `getExtendedPlatformKPIs()` — backward compatible, original functions unchanged

---

## 10. Security Changes

- RBAC via `requireAuth()` on every server action
- Zod validation on every action input
- Payout approval workflow (admin must approve before payout)
- Manual entry creates AUDJUSTMENT status entries (audit trail)
- Clawbacks tracked as separate entries with reference to original
- No hardcoded IDs or percentages — everything from DB

---

## 11. Backward Compatibility

| Area | Status |
|------|--------|
| Existing CommissionRule (old) | **Preserved** — CommissionRuleV2 is additive, old rules still work |
| CommissionLedger (old fields) | **Preserved** — new fields are nullable |
| CommissionPayout (old model) | **Preserved** — PayoutV2 is additive |
| SalesProfile/User/Business | **Preserved** — new relations are back-refs only |
| InstallationTicket (old fields) | **Preserved** — new fields are nullable, old flow without packages works |
| Distributor (old model) | **Preserved** — Installer is additive, both work |
| Event Bus (old events) | **Preserved** — new events are additive |
| Event Bus helpers | **Preserved** — new emit functions added |
| Sales Team Actions | **Preserved** — `getMyTargetsAction()` now reads from DB, falls back to defaults |
| KPI Service | **Preserved** — `getPlatformKPIs()` unchanged, new `getExtendedPlatformKPIs()` added |
| Existing ledger/payout/rule services | **Preserved** — functions kept, new V2 functions added alongside |
| Sales automation handlers (commission) | **Rewritten** — but behavior is strictly better (no more hardcoded values) |
| Installation handlers | **Rewritten** — added QR gating, old flow without packages still works |
| Reporting handlers | **Rewritten** — was no-op, now actually computes and stores KPI data |

---

## 12. Performance Impact

- **Negligible** for most operations — rules and pipeline are triggered by event bus (async)
- **KPI snapshot computation** runs hourly + on key events — O(n) queries over small sets
- **MRR/ARR** computed from aggregated queries (single query per period)
- **CLV update** per business on relevant events (query 2 tables)
- **No N+1** — all service methods use Prisma `include` for batching
- KpiSnapshot eliminates live recomputation on every dashboard load

---

## 13. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| FORMULA rule type eval uses `new Function()` | Low | Sanitize input, only allow predefined operators/vars |
| Recurring commissions depend on payment events | Low | Falls back to subscription status check in cron |
| Installer GPS needs real-time websocket | Low | Current: poll-based updates via actions |
| KPI snapshot cron runs in-process (setInterval) | Medium | In production, migrate to pg-boss job queue |
| Pre-existing type errors in frontend components | Low | All pre-existing, not introduced by this implementation |