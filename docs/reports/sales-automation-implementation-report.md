# Sales Automation — Implementation Report

_What was built, how the sales team gets paid, what KPIs exist, what the dashboards show, and what gaps remain._

---

## 1. How the Sales Team Gets Paid

### 1.1 Commission Earning Events

| Trigger Event | Calculation | Source |
|---|---|---|
| BusinessRegistered | `calculateCommission(salesProfileId, planAmount)` — rule-driven % of plan | CommissionRule (configurable) |
| SubscriptionActivated | `calculateCommission(salesProfileId, setupFee)` + `calculateCommission(salesProfileId, planAmount)` | CommissionRule (configurable) |
| SubscriptionRenewed | `renewalAmount * 0.05` (5% hardcoded) | commission-handlers.ts |
| ReferralCreated | `planAmount * 0.1` (10% hardcoded) | commission-handlers.ts |
| InstallationCompleted | `25,000 TZS` flat fee (hardcoded) | commission-handlers.ts |

### 1.2 Commission Ledger Lifecycle

```
PENDING → (admin approves) → APPROVED → (admin creates payout) → PAID
                                     ↘ (subscription cancelled < 90d) → CANCELLED + clawback entry (negative amount)
```

- Clawback within 90 days creates a **negative flat-rate entry** linked to the original
- Clawback after 90 days: entry is cancelled but no money is reversed
- Sales reps can view their PENDING / APPROVED / PAID totals on `/platform/sales-team/commissions`

### 1.3 Commission Rules

- Rules are defined in `CommissionRule` model — `type` (FLAT | PERCENTAGE), `value`, optional `minAmount`/`maxAmount`
- Rules can be scoped to a sales hierarchy level or apply globally
- Multiple active rules are **additive**
- BusinessRegistered and SubscriptionActivated use rule-driven calculation; the other three triggers **do not check rules** and use hardcoded percentages

### 1.4 Payout Process

1. Admin reviews PENDING entries on `/platform/commissions` → Ledger tab
2. Admin approves entries individually
3. Approved entries appear in "Pending Payouts" grouping
4. Admin creates a batch `CommissionPayout` → all entries become PAID

---

## 2. What KPIs Exist

### 2.1 Platform Dashboard (Admin)

- Total Workspaces, Businesses, Users, Revenue, Active Subscriptions, Pending Tickets
- All computed **live** from Prisma aggregates — no historical storage

### 2.2 Business Dashboard (Tenant)

- Today Sales, Weekly Revenue, Total Customers, Low Stock Count, Pending Orders, Monthly Expenses
- All computed **live** from Prisma aggregates

### 2.3 Sales Rep Metrics (Self-Service)

Accessed via `/platform/sales-team/overview`:

| Metric | Source |
|---|---|
| Today's Commission | CommissionLedger (today) |
| This Week's Commission | CommissionLedger (current week) |
| This Month's Commission | CommissionLedger (current month) |
| Total Clients | Lead (CONVERTED) + Business (created by user) |
| Total / Converted / Lost Leads | Lead model |
| Conversion Rate | computed: converted / total |
| Monthly Commission History (6 months) | CommissionLedger aggregated by month |

### 2.4 Targets

Hardcoded in `getMyTargetsAction()`:
- Monthly Leads: 10
- Conversion Rate: 30%
- Monthly Commission: 500,000 TZS
- Yearly Commission: 5,000,000 TZS

---

## 3. Dashboards and UI

### 3.1 Platform Admin Dashboard

- Route: `/platform/dashboard`
- Quick action card grid for: Sales, Commissions, Distribution, Leads, Onboarding, Marketing, Finance, Subscriptions, Users, Roles, Support

### 3.2 Platform Commissions (Admin)

- Route: `/platform/commissions`
- 4 tabs: Dashboard (summary), Rules (CRUD), Ledger (approve entries), Payouts (batch pay)

### 3.3 Sales Team Dashboard

- Route: `/platform/sales-team/overview`
- 5 KPI cards (Today, This Week, This Month, Clients, Commission)
- Detailed sections: Sales Performance, Leads Pipeline, Client Overview, Financial Summary

### 3.4 Sales Team Sub-pages

| Page | Route | Content |
|---|---|---|
| Commissions | `/platform/sales-team/commissions` | 4 metric cards + transaction list with status badges |
| Performance | `/platform/sales-team/performance` | Lead metrics + monthly chart + lead breakdown |
| Reports | `/platform/sales-team/reports` | Summary + breakdowns + trend + YTD (Export button disabled) |
| Targets | `/platform/sales-team/targets` | Progress bars vs hardcoded targets |

---

## 4. Gaps

### 4.1 Critical Gaps

| Gap | Impact |
|---|---|
| `computeDailyKPIs()` is an empty no-op — called hourly but does nothing | No historical KPI snapshots. All metrics recomputed live on every page load. No trend data stored. |
| `computeSalesRepMetrics()` fetches lead counts but discards results | No per-rep historical metric records stored anywhere |
| No `KpiRecord` or `SalesRepMetric` DB model | Cannot show trends, period-over-period charts, or historical reports |
| Renewals, referrals, installation fees use hardcoded rates instead of `CommissionRule` | Admin cannot configure these rates via the Rules UI |
| No commission earned on customer's actual daily sales transactions | Sales reps in commerce businesses earn nothing when their customers make sales |
| Targets are hardcoded in server action | No `SalesTarget` model, no per-rep target configuration |

### 4.2 Medium Gaps

| Gap | Impact |
|---|---|
| Dual code paths for commission logic (`src/features/commissions/` vs `src/server/services/commission-service.ts`) | Risk of inconsistency between old and new paths |
| "Sales" metrics on sales dashboard actually query CommissionLedger, not Sale records | Rep sees "Today's Sales: 50,000" but that's commission earned, not actual transaction volume |
| Sidebar + BottomNav commented out in sales-team layout | Navigation relies only on top navbar |
| Export Report button disabled on reports page | No CSV/PDF export |

### 4.3 Low Gaps

| Gap | Impact |
|---|---|
| No split/multi-rep commission | A single deal can only credit one sales profile |
| No commission caps/tiers | Rules support deal amount ranges but not cumulative caps per rep |
| No leaderboard/rankings | No cross-rep comparison |

---

## 5. File Index

| File | Purpose |
|---|---|
| `src/server/sales-automation/handlers/commission-handlers.ts` | Event-driven commission earning + clawback |
| `src/server/sales-automation/handlers/customer-success-handlers.ts` | CSM assignment on activation |
| `src/server/sales-automation/handlers/installation-handlers.ts` | Auto-create tasks, notify on status changes |
| `src/server/sales-automation/handlers/lead-handlers.ts` | Duplicate warning notifications |
| `src/server/sales-automation/handlers/industry-handlers.ts` | Industry-specific installation checklists |
| `src/server/sales-automation/handlers/reporting-handlers.ts` | **STUBBED** – hourly KPI compute (no-op) |
| `src/server/sales-automation/register-handlers.ts` | Self-registering module entry point |
| `src/features/commissions/services/ledger-service.ts` | createEntry, approveEntry, cancelEntry, clawbackEntry |
| `src/features/commissions/services/rule-service.ts` | Commission rate lookup and calculation |
| `src/features/commissions/services/payout-service.ts` | Batch payout creation |
| `src/features/commissions/components/` | Rule list/form, Ledger list, Payout list/form |
| `src/features/leads/services/lead-dedup-service.ts` | Duplicate detection by email/phone/name |
| `src/features/installations/services/installation-service.ts` | Wired events into installation lifecycle |
| `src/features/subscriptions/services/subscription-service.ts` | Wired renewal/cancellation events |
| `src/features/activation/services/activation-service.ts` | Wired SubscriptionActivated event |
| `src/server/actions/sales-team.ts` | Live sales rep metric computation |
| `src/app/platform/sales-team/*` | Sales team frontend pages (8 routes) |
| `src/app/platform/commissions/*` | Platform admin commission management |
| `src/app/platform/dashboard/*` | Platform admin dashboard |