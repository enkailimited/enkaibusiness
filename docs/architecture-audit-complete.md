# ENKAI BUSINESS — COMPLETE ARCHITECTURE AUDIT

**Date:** 2026-06-29
**Scope:** Full platform codebase audit
**Platform:** Next.js 16 / React 19 / Prisma 6 / PostgreSQL / Better Auth

---

## 1. PROJECT STRUCTURE

```
enkai-business/
├── prisma/schema.prisma              # Database schema (2812 lines, ~55 models)
├── src/
│   ├── app/                          # Next.js App Router (pages + API routes)
│   │   ├── (auth)/                   # Login, Register, Forgot/Reset Password
│   │   ├── api/                      # API routes (auth, upload, seed)
│   │   ├── platform/                 # Admin platform (19 sub-routes)
│   │   ├── workspaces/               # Workspace hub (6 sub-routes)
│   │   │   └── businesses/          # Business scope (30+ sub-routes)
│   │   ├── menu/[code]/             # Public QR menu
│   │   ├── auth-diagnostics/         # Debug pages
│   │   ├── profile/                 # User profile
│   │   └── change-password/         # Password change
│   │
│   ├── features/                     # 55 feature modules (domain-driven)
│   ├── components/                   # Shared UI
│   ├── modules/ai/                   # AI Service Modules (server-side)
│   ├── enkai/intelligence/           # Business Intelligence
│   ├── platform/                     # Platform Services
│   ├── notifications/email/          # Email engine
│   ├── server/                       # Server utilities
│   ├── stores/                       # Zustand stores
│   ├── lib/                          # Shared libraries
│   ├── hooks/                        # React hooks
│   ├── types/                        # TypeScript types
│   └── middleware.ts                 # Next.js middleware (auth check)
│
├── scripts/                          # Utility scripts
├── docs/                             # Documentation
├── styles/                           # Global styles
├── next.config.ts                    # Next.js config
├── vitest.config.ts                  # Test config
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

### Major Folder Responsibilities

| Folder | Responsibility |
|--------|---------------|
| `prisma/` | Database schema, migrations, seed data |
| `src/app/` | Next.js App Router — all routes, pages, layouts, API endpoints |
| `src/features/` | Domain-driven modules — each has actions/, services/, components/, schemas/, types/, constants/ |
| `src/components/` | Shared UI primitives (Radix), layout components, providers, upload |
| `src/modules/ai/` | Server-side AI service modules (Firdaus) — event bus, reorder, revenue, procurement, credit, health, automation |
| `src/enkai/intelligence/` | Business intelligence — anomaly detection, automation rules, forecasting, recommendations, trend analysis |
| `src/platform/` | Platform admin services — analytics, dashboard, monitoring, permissions, roles, settings, support, users |
| `src/notifications/` | Email engine — SMTP service, templates, queue, campaigns |
| `src/server/` | Server-only utilities — auth helpers (getCurrentUser, requireAuth), Prisma client singleton |
| `src/stores/` | Zustand client stores — auth, workspace, UI (sidebar, theme) |
| `src/lib/` | Shared libraries — Better Auth config, auth client, constants, utils, phone normalization, Zod validations |
| `src/hooks/` | Custom React hooks — media query, permission check, sound, toast |
| `src/types/` | TypeScript type definitions — auth, enums, models, relationships, upload, speech recognition |

### Tech Stack

- **Framework:** Next.js 16 (App Router, RSC)
- **UI:** React 19
- **Language:** TypeScript 5.7
- **ORM:** Prisma 6 with PostgreSQL
- **Auth:** Better Auth 1.6 (self-hosted)
- **Client State:** Zustand 5
- **Server State:** TanStack React Query 5
- **Validation:** Zod 4
- **Styling:** Tailwind CSS 4
- **Components:** Radix UI primitives
- **Forms:** react-hook-form
- **Email:** Nodemailer
- **Animation:** Motion 12
- **Icons:** Lucide React
- **Uploads:** ImageKit.io
- **Testing:** Vitest

---

## 2. FEATURE MODULES

### Complete Feature Inventory (55 modules)

| Module | Purpose | Key Tables |
|--------|---------|-----------|
| **activation** | Business activation, wallet top-ups, business suspend/reactivate | WalletDepositRequest, Subscription, Business |
| **auth** | Login, registration, password reset | User, Session, Account (via better-auth) |
| **branches** | Branch CRUD, branch switching | Branch |
| **catalog** | Products, services, categories, brands, units, variants, price lists | CatalogItem, Category, Brand, Unit, CatalogItemVariant, PriceList |
| **customers** | Customer CRUD, groups | Customer, CustomerGroup |
| **suppliers** | Supplier CRUD | Supplier |
| **sales** | POS sales, sale creation with inventory deduction, auto invoice/payment | Sale, SaleItem |
| **purchases** | Purchase recording, inventory update | Purchase, PurchaseItem |
| **inventory** | Balances, locations, stock movements, transfers | InventoryBalance, InventoryLocation, StockMovement |
| **payments** | Polymorphic payments for sales/invoices/purchases | Payment, PaymentMethod |
| **invoices** | Invoice generation, status tracking (draft→issued→paid/overdue) | Invoice, InvoiceItem |
| **procurement** | Basic vs advanced procurement toggle | (settings-based) |
| **financial** | P&L, cash flow, inventory valuation, branch performance | (aggregations) |
| **reports** | 7 report types: sales, purchases, customers, suppliers, inventory, expenses, subscriptions | (aggregations) |
| **subscriptions** | Plans, subscriptions, wallets, deposit requests | SubscriptionPlan, Subscription, SubscriptionWallet, SubscriptionTransaction |
| **staff** | Staff profiles, assignments to branches/stores | Staff, StaffAssignment |
| **workspaces** | Workspace CRUD, member management | Workspace, WorkspaceMember |
| **settings** | Business-level settings (tax, numbering, receipt, payment) | Setting |
| **qr-ordering** | QR campaigns, codes, menus, installations | DistributionCampaign, QRCode, QRMenuItem, QRCodeInstallation |
| **commissions** | Sales commission rules, ledger, payouts | CommissionRule, CommissionLedger, CommissionPayout |
| **sales-network** | Sales hierarchy, profiles, territories | SalesHierarchy, SalesProfile |
| **leads** | Lead tracking, assignment, conversion | Lead, LeadActivity, LeadAssignment |
| **customer-credit** | Credit accounts, transactions | CustomerCreditAccount, CustomerCreditTransaction |
| **stock-adjustments** | Physical count adjustments | StockAdjustment, StockAdjustmentItem |
| **stock-transfers** | Inter-location transfers | StockTransfer, StockTransferItem |
| **cash-management** | Cash registers, cash transactions | CashRegister, CashTransaction |
| **expenses** | Expense recording, approval workflow | Expense, ExpenseCategory |
| **returns** | Sale returns, refunds | Return, ReturnItem |
| **enkai** | Firdaus AI conversation frontend | (custom) |
| **notifications** | In-app notifications | Notification, NotificationPreference |
| **campaigns** | Email marketing campaigns | Campaign, CampaignSegment, CampaignRecipient |
| **email-templates** | Email template management | EmailTemplate |
| **upload** | File upload to ImageKit | Upload |
| **statements** | Customer/supplier account statements | (aggregations) |
| **quotations** | Quote-to-sale pipeline | Quotation, QuotationItem |
| **roles** | RBAC roles | Role |
| **permissions** | Permission definitions | Permission, RolePermission |
| **users** | User management | User |
| **businesses** | Business CRUD | Business |
| **stores** | Store CRUD (sub-branch) | Store |
| **activities** | Activity logging | Activity |
| **audit-logs** | Detailed audit trail | AuditLog |
| **platform** | Platform admin functions | (various) |
| **members** | Workspace membership | WorkspaceMember |
| **pos** | POS sessions | POSSession |
| **goods-received** | Goods received against PO | GoodsReceived, GoodsReceivedItem |
| **purchase-orders** | Purchase order management | PurchaseOrder, PurchaseOrderItem |
| **stock** | Stock aggregations | (derived) |
| **unit-conversions** | Unit conversion factors | UnitConversion |
| **dashboards** | Dashboard data | (aggregations) |
| **customer-groups** | Customer grouping | CustomerGroup |
| **expense-categories** | Expense categorization | ExpenseCategory |
| **subscriptions/wallet-deposits** | Deposit request handling | WalletDepositRequest |

### Business Flow

1. **User registers** → selects/creates workspace → creates business
2. **Business paid** → selects subscription plan → pays setup fee via wallet
3. **Admin approves deposit** → wallet credited → business activated
4. **Staff assigned** to branches/stores → catalog populated → sales begin
5. **Purchases** replenish inventory → **Sales** reduce inventory
6. **Invoices** generated for credit sales → **Payments** tracked
7. **Expenses, returns, adjustments** tracked
8. **Reports** summarize all activity
9. **AI modules** provide reorder recommendations, revenue insights, health scores, debt collection reminders

---

## 3. DATABASE ARCHITECTURE

### Complete Model Inventory (~104 models + 19 enums)

#### ENUMS (19)

```
WorkspaceMemberRole  : OWNER, ADMIN, MEMBER, GUEST
Industry             : COMMERCE, HEALTHCARE, RESTAURANT, MANUFACTURING, AGRICULTURE, SERVICES
CatalogItemType      : PRODUCT, SERVICE, MEDICINE, MENU_ITEM, RAW_MATERIAL, FINISHED_GOOD
RoleScope            : PLATFORM, BUSINESS, WORKSPACE
SalesProfileStatus   : ACTIVE, INACTIVE, SUSPENDED
LeadSource           : MANUAL, SELF_REGISTRATION, SALES_REGISTRATION, REFERRAL, CAMPAIGN
LeadStatus           : NEW, CONTACTED, INTERESTED, DEMO, NEGOTIATION, CONVERTED, LOST
SubscriptionInterval : DAILY, WEEKLY, MONTHLY, YEARLY
SubscriptionStatus   : PENDING, ACTIVE, GRACE_PERIOD, SUSPENDED, EXPIRED, CANCELLED
CommissionType       : FLAT, PERCENTAGE
CommissionLedgerStatus: PENDING, APPROVED, PAID, CANCELLED
CampaignStatus       : DRAFT, ACTIVE, COMPLETED, ARCHIVED
QRCodeStatus         : UNASSIGNED, ASSIGNED, INSTALLED, ACTIVE, INACTIVE, DAMAGED
TicketStatus         : OPEN, IN_PROGRESS, RESOLVED, CLOSED
TicketPriority       : LOW, MEDIUM, HIGH, URGENT
CustomerType         : RETAIL, WHOLESALE, WALK_IN
PricingTier          : RETAIL, WHOLESALE, PROMO, CUSTOMER_GROUP
FirdausWorkflowStatus: STARTED, COLLECTING_DATA, VALIDATING, EXECUTING, COMPLETED, FAILED
MemoryType           : PREFERRED_SUPPLIER, TOP_CUSTOMER, COMMON_EXPENSE, POPULAR_PRODUCT, PAYMENT_METHOD, FREQUENT_PRODUCT, VOCABULARY, CONVERSATION_SUMMARY
```

#### MODELS

**Business Type Layer:**
- `BusinessType` — e.g., Commerce, Healthcare, Restaurant
- `BusinessTypeMode` — e.g., Retail, Wholesale for Commerce
- `BusinessTypeModule` — which modules are required/available per type
- `CatalogType` — catalog schema per business type

**CRM Domain:**
- `Contact` — individual contact (person)
- `Organization` — company/organization
- `Address` — physical/postal addresses (polymorphic)
- `CommunicationLog` — email/sms/call/meeting history

**Catalog Domain:**
- `CatalogAttribute` — custom fields per catalog type
- `CatalogItemAttribute` — attribute values per catalog item

**Platform Foundation:**
- `User` — central user with extensive relation list (~40 relations)
- `UserInvite` — user invitation to workspace/business
- `Session` — better-auth sessions
- `Account` — better-auth accounts (password, OAuth)
- `Verification` — better-auth email verification
- `Workspace` — top-level organizational unit
- `WorkspaceMember` — user-membership with role (OWNER/ADMIN/MEMBER/GUEST)
- `Business` — the core tenant entity (workspace-scoped)
- `BusinessMode` — industry+mode per business
- `Branch` — physical/operational branch
- `Store` — sub-branch retail point
- `Staff` — employee profile linked to user
- `StaffAssignment` — staff assigned to branch/store with role
- `Role` — RBAC role (PLATFORM/BUSINESS/WORKSPACE scope)
- `Permission` — individual permission (module+action)
- `RolePermission` — many-to-many role↔permission
- `UserRole` — user↔role with optional business scope

**Catalog Domain:**
- `Category` — hierarchical categories (self-referencing parent)
- `Brand` — product brands
- `Unit` — measurement units with conversion support
- `UnitConversion` — conversion factors between units
- `CatalogItem` — core product/service entity (with variants, menu items, etc.)
- `CatalogItemVariant` — size/color/option variants
- `CatalogItemImage` — multiple images per item/variant
- `CatalogItemAssignment` — item availability by branch/store
- `PriceList` — pricing tiers
- `PriceListItem` — item prices within price lists

**Customers & Suppliers:**
- `CustomerGroup` — grouping with discount percentage
- `Customer` — customer profile (linked to contact)
- `Supplier` — supplier profile

**Payments Domain:**
- `PaymentMethod` — cash/card/mobile/bank/credit
- `Payment` — polymorphic payment record (linked to sale/invoice/purchase/subscription)

**Inventory Domain:**
- `InventoryLocation` — warehouse/store/branch location
- `InventoryBalance` — stock levels per item per location (with batch/expiry)

**Procurement:**
- `Purchase` — direct purchase
- `PurchaseItem` — purchase line items
- `PurchaseOrder` — PO with status workflow
- `PurchaseOrderItem` — PO line items with received quantity tracking
- `GoodsReceived` — goods receipt against PO
- `GoodsReceivedItem` — receipt line items

**Stock Operations:**
- `StockMovement` — ledger of all stock changes (sale/purchase/adjustment/transfer/return)
- `StockAdjustment` — physical count adjustment
- `StockAdjustmentItem` — adjustment line items
- `StockTransfer` — inter-location transfer
- `StockTransferItem` — transfer line items

**Sales & Revenue:**
- `Sale` — sale transaction
- `SaleItem` — sale line items (with captured costPrice for COGS)
- `POSSession` — point-of-sale shift
- `Quotation` — quotation-to-sale pipeline
- `QuotationItem` — quotation line items
- `Invoice` — invoice (auto-created from sale or standalone)
- `InvoiceItem` — invoice line items
- `Return` — sale return/refund
- `ReturnItem` — return line items

**Expenses:**
- `ExpenseCategory` — expense categorization
- `Expense` — expense record with approval workflow

**Customer Credit:**
- `CustomerCreditAccount` — per-customer credit account
- `CustomerCreditTransaction` — credit transaction ledger

**Cash Management:**
- `CashRegister` — physical/virtual cash drawer
- `CashTransaction` — cash in/out transactions

**Subscriptions & Wallet:**
- `SubscriptionPlan` — available subscription plans
- `Subscription` — business subscription
- `SubscriptionPayment` — payment against subscription
- `SubscriptionWallet` — prepaid wallet per business
- `SubscriptionTransaction` — wallet transaction ledger
- `WalletDepositRequest` — deposit request with approval workflow

**Sales Network:**
- `SalesHierarchy` — sales organizational levels
- `SalesProfile` — sales person profile
- `Lead` — sales lead pipeline
- `LeadActivity` — lead activity history
- `LeadAssignment` — lead assignment tracking

**Commissions:**
- `CommissionRule` — commission calculation rules
- `CommissionLedger` — commission entries
- `CommissionPayout` — payout batch

**QR Ordering:**
- `DistributionCampaign` — QR code distribution campaign
- `QRCode` — physical QR code (tracked)
- `QRMenuItem` — menu items linked to QR
- `QRCodeAssignment` — QR assignment history
- `QRCodeInstallation` — QR installation record

**Support:**
- `SupportTicket` — customer support tickets

**Cross-Cutting:**
- `Notification` — in-app notifications
- `NotificationPreference` — per-user notification preferences
- `Activity` — user activity log
- `AuditLog` — detailed audit trail with before/after snapshots
- `Upload` — file upload tracking (ImageKit)
- `Setting` — key-value settings (business/user scoped)

**Email & Communications:**
- `EmailConfig` — SMTP configuration
- `EmailTemplate` — email templates with variables
- `EmailLog` — email send tracking
- `CampaignSegment` — audience segments (JSON criteria)
- `Campaign` — email campaign
- `CampaignRecipient` — individual campaign recipient status

**AI/Firdaus:**
- `FirdausWorkflow` — persistent AI workflow state machine
- `BusinessMemory` — learned business patterns (suppliers, products, vocabulary)

### ER Diagram (Text)

```
Workspace 1──* WorkspaceMember *──1 User
     │
     └──1──* Business 1──* Branch 1──* Store
                    │
                    ├──* CatalogItem *──* Category, Brand, Unit
                    │       │
                    │       ├──* CatalogItemVariant
                    │       ├──* PriceListItem *──1 PriceList
                    │       └──* InventoryBalance *──1 InventoryLocation
                    │
                    ├──* Customer *──* CustomerGroup
                    ├──* Supplier
                    ├──* Staff *──* StaffAssignment *── Branch/Store/Role
                    │
                    ├──* Sale *──* SaleItem *──1 CatalogItem
                    │     │
                    │     └──* Invoice *──* InvoiceItem
                    │           │
                    │           └──* Payment *──1 PaymentMethod
                    │
                    ├──* Purchase *──* PurchaseItem *──1 CatalogItem
                    │     │
                    │     └── Payment
                    │
                    ├──* PurchaseOrder *──* PurchaseOrderItem *── CatalogItem
                    │     │
                    │     └──* GoodsReceived *──* GoodsReceivedItem
                    │
                    ├──* Expense *──1 ExpenseCategory
                    ├──* CustomerCreditAccount *──* CustomerCreditTransaction
                    ├──* CashRegister *──* CashTransaction
                    ├──* Quotation *──* QuotationItem
                    ├──* Return *──* ReturnItem
                    ├──* StockAdjustment *──* StockAdjustmentItem
                    ├──* StockTransfer *──* StockTransferItem
                    │
                    ├──* Subscription *──1 SubscriptionPlan
                    ├──* SubscriptionWallet *──* SubscriptionTransaction
                    ├──* WalletDepositRequest
                    │
                    ├──* QRCode *──* QRMenuItem *── CatalogItem
                    ├──* Setting
                    ├──* Upload
                    ├──* FirdausWorkflow
                    ├──* BusinessMemory
                    ├──* Contact *──* Organization
                    ├──* EmailConfig
                    └──* EmailTemplate *──* Campaign *──* CampaignRecipient

User *──* Role (via UserRole) *──* Permission (via RolePermission)

SalesHierarchy 1──* SalesProfile 1──* Lead
SalesProfile *──* CommissionLedger *──1 CommissionPayout
CommissionRule *──1 SalesHierarchy

DistributionCampaign 1──* QRCode 1──* QRCodeInstallation *── Business
QRCode *── QRMenuItem *──1 CatalogItem

InventoryLocation 1──* InventoryBalance *──1 CatalogItem
InventoryBalance *──* StockMovement
```

### Key Indexing Patterns
- All foreign keys indexed
- Unique constraint on `(businessId, slug)` for business-scoped entities
- Unique constraint on `(businessId, name)` for named entities
- Date indexes on saleDate, purchaseDate, expenseDate, createdAt for reporting
- Composite index on `(businessId, status)` for filtered queries
- No composite indexes for common query patterns (e.g., `(businessId, saleDate)` on sales)

---

## 4. APPLICATION FLOW

### Complete Request Flow

```
Browser
  ↓
Next.js Middleware (src/middleware.ts)
  ├── Check public routes (/login, /register, /privacy, /terms, /menu)
  ├── Check static assets (/_next, /favicon, /images, /api/auth)
  ├── Check session cookie (better-auth.session_token)
  ├── Redirect to /login if no session & not public
  └── Redirect to /platform/dashboard if logged in & visiting /login
  ↓
Next.js Router (App Router)
  ↓
Root Layout (src/app/layout.tsx)
  └── <Providers> (src/components/providers.tsx)
        ├── <QueryClientProvider> (TanStack React Query)
        ├── <ThemeProvider> (next-themes)
        ├── <AuthProvider> (Auth context + better-auth)
        │   └── <FirdausProvider> (AI assistant frontend)
        │       └── {children}
        ├── <FirdausGlobalListener>
        ├── <FirdausGreeter> + <FirdausResponseToast>
        ├── <Toaster>
        └── <LauncherSound>
  ↓
Specific Layout (platform, workspaces, auth, business)
  ↓
Server Component / Client Component
  │
  ├── Server Component (async, direct Prisma access)
  │   └── Server Action (src/features/*/actions/)
  │       └── Service Layer (src/features/*/services/)
  │           ├── Validation (Zod schemas)
  │           ├── Business Logic
  │           ├── Prisma ORM → PostgreSQL
  │           ├── FirdausEventBus.emit() (side effect)
  │           └── ActionResponse { success, message, data }
  │
  └── Client Component
        ├── TanStack React Query (useQuery / useMutation)
        ├── Zustand stores (auth, workspace, UI)
        ├── react-hook-form (forms)
        └── UI Update (optimistic / revalidate)
```

### Data Flow Patterns

**Server Component (RSC) Pattern:**
```typescript
async function Page({ params }) {
  const user = await requireAuth();
  const data = await prisma.sale.findMany({ where: { businessId } });
  return <ClientComponent data={data} />;
}
```

**Client Mutation Pattern:**
```typescript
"use client";
function Form() {
  const { mutate } = useMutation({
    mutationFn: async (data) => {
      return createSale(data, businessId, workspaceId, userId);
    },
    onSuccess: () => revalidatePath("/sales"),
  });
  return <form onSubmit={() => mutate(formData)}>...</form>;
}
```

**Service Pattern:**
```typescript
export async function createSale(data, businessId, workspaceId, userId) {
  try {
    // Zod validation
    // Business logic
    // Prisma $transaction
    // Event emission
    return { success: true, message: "...", data: { id } };
  } catch (error) {
    console.error("...", error);
    return { success: false, message: "..." };
  }
}
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### Authentication

- **Library:** Better Auth v1.6 (self-hosted, open-source Next.js auth)
- **Provider:** Email/password only (OAuth not enabled)
- **Config:** `src/lib/auth.ts` — `betterAuth()` with Prisma adapter
- **Session config:**
  - Expires: 7 days
  - Update age: 24 hours
  - Fresh age: 5 minutes
- **Cookie:** `better-auth.session_token` (sameSite: lax, secure in prod)
- **Rate limit:** 20 requests per 60-second window
- **Password reset:** Email via Nodemailer with SMTP config
- **Pre-sign-in hook:** Normalizes phone/username login (allows login without @)
- **Post-user-create hook:** Upserts additional user fields (firstName, lastName, phone, etc.)
- **Additional fields:** phone, username, firstName, lastName, gender, isOnboarded, mustChangePassword

### Authorization

- **RBAC System:** 3 scope levels — PLATFORM, BUSINESS, WORKSPACE
- **Roles model:** `Role` → `Permission` (via `RolePermission` join table)
- **User-role assignment:** `UserRole` (userId + roleId + optional businessId)
- **Platform roles:** super-admin, national-manager, national-sales-manager, region-manager, team-leader, freelancer, marketing-manager, support-agent, finance-officer
- **Business roles:** owner, manager, cashier, accountant, doctor, pharmacist, chef
- **Workspace roles:** OWNER, ADMIN, MEMBER, GUEST
- **Client check:** `usePermission()` hook checks permission slugs
- **Server check:** `requireAuth()` → `getSessionUser()` fetches user + roles + permissions

### Current Authorization Gaps

| Issue | Severity | Detail |
|-------|----------|--------|
| No service-level permission checks | **HIGH** | Most service functions don't check user permissions before executing |
| RBAC infrastructure exists but unused | **HIGH** | Role/Permission tables populated but not enforced in business logic |
| `UserRole.businessId` nullable | **MODERATE** | Platform roles can access ALL business data |
| Workspace members see all businesses | **MODERATE** | Intended, but could leak across unrelated businesses |
| Middleware only checks session existence | **LOW** | No scope/role checking at middleware layer |
| Permission slugs are strings | **LOW** | No runtime enforcement of module+action pairs |

---

## 6. MULTI-TENANCY

### Tenancy Model

```
User
  └── * WorkspaceMember ─── * Workspace
                                    │
                                    └── * Business ─── * Branch ─── * Store
```

**Tenant Isolation Layers:**
1. **Workspace-level:** Users are members of workspaces; businesses belong to workspaces
2. **Business-level:** ALL data entities scoped by `businessId`
3. **Branch-level:** Sales, inventory, staff further scoped by `branchId`
4. **Store-level:** Finer granularity via `storeId`

### Tenant Leakage Risks

| Risk | Location | Severity |
|------|----------|----------|
| Workspace members can see all businesses | Default query scoping | MODERATE |
| No RBAC in service layer | All feature services | HIGH |
| Platform roles access all data | UserRole.null businessId | HIGH |
| No tenant context middleware | middleware.ts | LOW |

**Data isolation is enforced by `businessId` in WHERE clauses, but without systematic RBAC verification at the service layer, a compromised user with valid session could access any business's data by manipulating `businessId` parameters.**

---

## 7. AI ARCHITECTURE (FIRDAUS)

### Current State: Rule-Based Business Intelligence

The "Firdaus" system is **not AI/ML** — it is a deterministic, rule-based business intelligence engine with Swahili output strings. No LLM, NLP, voice, or machine learning is implemented.

### Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      FIRDAUS AI SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ FirdausEventBus  │    │WorkflowAutomation│    │ ReorderEngine │ │
│  │ (pub/sub, 12     │◄───│ (auto-reorder,   │◄───│  (90-day      │ │
│  │  event types)    │    │  low-stock alert) │    │  velocity)   │ │
│  └────────┬────────┘    └──────────────────┘    └──────┬───────┘ │
│           │                                            │          │
│  ┌────────▼────────┐    ┌──────────────────┐    ┌──────▼───────┐ │
│  │ RevenueEngine   │    │ProcurementAdvisor│    │DebtCollection│ │
│  │ (daily/weekly/  │    │(supplier scoring │    │  Engine      │ │
│  │  monthly sales, │    │ reliability 40%, │    │  (30/60/90   │ │
│  │  trends, risks) │    │ delivery 25%,    │    │  day risk,   │ │
│  │                 │    │ cost 20%, volume │    │  Swahili     │ │
│  │                 │    │ 15% → score/100) │    │  reminders)  │ │
│  └────────┬────────┘    └──────────────────┘    └──────┬───────┘ │
│           │                                            │          │
│  ┌────────▼─────────────────────────────────────────┐  │         │
│  │              HealthScoreService                   │  │         │
│  │  (sales 25% + cashflow 20% + inventory 20% +     │  │         │
│  │   customers 20% + debt 15% = 0-100, grade A-F)   │  │         │
│  └──────────────────────────────────────────────────┘  │         │
│                                                         │         │
│  ┌─────────────────────────────────────────────────┐    │         │
│  │              Enkai Intelligence                  │    │         │
│  │  (anomaly-detection, automation-rules,           │◄───┘         │
│  │   business-insights, forecasting, recommendations│              │
│  │   trend-analysis)                                │              │
│  └─────────────────────────────────────────────────┘              │
│                                                                    │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│  │ FirdausWorkflow  │    │  BusinessMemory  │    │  Firdaus    │ │
│  │ (state machine:  │    │  (8 memory types:│    │  Frontend   │ │
│  │  STARTED→COLLECT │    │  suppliers,      │    │  (chat,      │ │
│  │  →VALIDATE→      │    │  customers,      │    │  toast,      │ │
│  │  EXECUTE→DONE)   │    │  products, terms)│    │  response)  │ │
│  └──────────────────┘    └──────────────────┘    └──────────────┘ │
│                                                                    │
│  ┌──────────────────────┐    ┌──────────────────┐                 │
│  │    Email AI Module   │    │  WhatsApp Module │                 │
│  │  (campaign handling) │    │  (empty stub)    │                 │
│  └──────────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Flow

```
External Action (Sale, Purchase, etc.)
  → Service Layer calls firdausEventBus.emit()
  → FirdausEventBus runs all registered handlers (Promise.allSettled)
    → WorkflowAutomation: auto-reorder recommendations
    → Default handlers: low-stock notifications, large-expense alerts
  → AuditLog entry written
```

### AI Module Details

| Module | Lines | Input | Output | Algorithm |
|--------|-------|-------|--------|-----------|
| **FirdausEventBus** | 170 | Event type + data | Side effects, audit log | Publisher-subscriber pattern |
| **ReorderEngine** | 134 | businessId | Prioritized reorder recommendations | 90-day sales velocity, stock vs reorder point comparison |
| **RevenueEngine** | 385 | businessId | Sales summaries, product trends, customer risk, branch performance | Aggregation + period-over-period comparison (10% thresholds) |
| **ProcurementAdvisor** | 133 | businessId | Supplier scoring, best/cheapest/fastest | Weighted scoring (reliability 40%, delivery 25%, cost 20%, volume 15%) |
| **DebtCollectionEngine** | 126 | businessId | Overdue accounts, collection reminders | 30/60/90-day risk classification, escalating Swahili templates |
| **HealthScoreService** | 193 | businessId | 5-component score (0-100), grade A-F | Weighted composite: sales 25% + cashflow 20% + inventory 20% + customers 20% + debt 15% |
| **WorkflowAutomation** | 130 | businessId + userId | Auto-reorder POs, notifications | Event-driven rule execution |

### What's Missing

| Component | Status | Evidence |
|-----------|--------|----------|
| LLM Integration | ❌ NOT IMPLEMENTED | No OpenAI/Anthropic/Cohere in package.json |
| Speech Recognition | ❌ NOT IMPLEMENTED | Only `speech-recognition.d.ts` types exist, `src/ai/` is empty |
| Voice Wake Word | ❌ NOT IMPLEMENTED | No wake word detection |
| Voice Synthesis | ❌ NOT IMPLEMENTED | No TTS library |
| Audio Pipeline | ❌ NOT IMPLEMENTED | No audio processing |
| NLP/Intent Detection | ❌ NOT IMPLEMENTED | No natural language processing |
| Named Entity Recognition | ❌ NOT IMPLEMENTED | No NER system |
| Machine Learning Models | ❌ NOT IMPLEMENTED | No model serving or training pipeline |
| Actual AI Conversations | ❌ NOT IMPLEMENTED | FirdausWorkflow state machine exists but no AI-driven conversation |

---

## 8. ERP MODULES

| Module | Status | Tables | Quality |
|--------|--------|--------|---------|
| **Catalog** | ✅ Complete | CatalogItem, Category, Brand, Unit, PriceList, Variants, Attributes, Images, Assignments | Full-featured with custom attributes, multi-currency, variant support |
| **Inventory** | ✅ Complete | InventoryBalance, InventoryLocation, StockMovement | Location-based, batch/expiry, reorder points |
| **Sales** | ✅ Complete | Sale, SaleItem, POSSession | Walk-in, credit, partial payment, auto-invoice |
| **Purchases** | ✅ Complete | Purchase, PurchaseItem | Direct purchases with supplier tracking |
| **Suppliers** | ✅ Complete | Supplier | Active/inactive, local/international type |
| **Customers** | ✅ Complete | Customer, CustomerGroup | Retail, wholesale, walk-in types |
| **Invoices** | ✅ Complete | Invoice, InvoiceItem | Full status workflow (draft→issued→paid/partial/overdue/cancelled) |
| **Payments** | ✅ Complete | Payment, PaymentMethod | Polymorphic (sale/invoice/purchase/subscription) |
| **Cash** | ✅ Complete | CashRegister, CashTransaction | Register-level tracking with cash in/out/transfer |
| **Expenses** | ✅ Complete | Expense, ExpenseCategory | Approval workflow (draft→approved→paid) |
| **Reports** | ✅ Complete | (aggregations) | Sales, purchases, customers, suppliers, inventory, expenses, subscriptions (7 types) |
| **CRM** | ✅ Complete | Contact, Organization, Address, CommunicationLog | Contact management with org hierarchy |
| **Subscriptions** | ✅ Complete | SubscriptionPlan, Subscription, SubscriptionWallet, SubscriptionTransaction | Plan-based with wallet prepayment |
| **Wallet** | ✅ Complete | SubscriptionWallet, SubscriptionTransaction, WalletDepositRequest | Top-up, consumption, bonus tracking with admin approval |
| **Business Registration** | ✅ Complete | Business, BusinessType, BusinessTypeMode, BusinessTypeModule | Multi-industry, multi-mode wizard |
| **Settings** | ✅ Complete | Setting | Key-value with JSON encoding, business/user scoped |
| **Quotations** | ✅ Complete | Quotation, QuotationItem | Draft→sent→accepted/rejected/expired/converted |
| **Returns** | ✅ Complete | Return, ReturnItem | Sale-linked with refund tracking and condition notes |
| **Stock Transfers** | ✅ Complete | StockTransfer, StockTransferItem | Inter-location with draft/dispatched/received/cancelled workflow |
| **Stock Adjustments** | ✅ Complete | StockAdjustment, StockAdjustmentItem | Physical count reconciliation with approval |
| **Customer Credit** | ✅ Complete | CustomerCreditAccount, CustomerCreditTransaction | Full credit lifecycle with transaction ledger |
| **Sales Network** | ✅ Complete | SalesHierarchy, SalesProfile, Lead | Multi-level hierarchy, lead pipeline, assignment tracking |
| **Commissions** | ✅ Complete | CommissionRule, CommissionLedger, CommissionPayout | Hierarchical commission with per-rule configuration |
| **QR Ordering** | ✅ Complete | DistributionCampaign, QRCode, QRMenuItem, QRCodeInstallation | Campaign-based QR distribution, tracking, menu linking |
| **Email Marketing** | ⚠️ Partial | EmailConfig, EmailTemplate, Campaign, CampaignSegment, CampaignRecipient | SMTP configs, templates, campaigns exist but no automated sending queue |
| **Support** | ⚠️ Basic | SupportTicket | Ticket system with status/priority but no advanced features |
| **Purchase Orders** | ✅ Complete | PurchaseOrder, PurchaseOrderItem | Full workflow with goods receipt integration |
| **Goods Received** | ✅ Complete | GoodsReceived, GoodsReceivedItem | Receipt tracking against POs with variance support |
| **POS** | ✅ Complete | POSSession | Session management with opening/closing floats |
| **Staff** | ✅ Complete | Staff, StaffAssignment | Hierarchical assignment to business/branch/store with roles |

---

## 9. INVENTORY FLOW

### Complete Flow

```
CatalogItem
  │
  ├── Purchase ───── PurchaseItem
  │     │                │
  │     │                ▼
  │     │         InventoryBalance (+ qty)
  │     │                │
  │     │                ▼
  │     │         StockMovement (refType: "purchase", +change)
  │     │
  ├── GoodsReceived ─ GoodsReceivedItem
  │     │                │
  │     │                ▼
  │     │         InventoryBalance (+ qty)
  │     │                │
  │     │                ▼
  │     │         StockMovement (refType: "purchase", +change)
  │     │
  ├── Sale ──────── SaleItem
  │     │                │
  │     │                ▼
  │     │         InventoryBalance (- qty)
  │     │                │
  │     │                ▼
  │     │         StockMovement (refType: "sale", -change)
  │     │
  ├── Return ────── ReturnItem
  │     │                │
  │     │                ▼
  │     │         InventoryBalance (+ qty)
  │     │                │
  │     │                ▼
  │     │         StockMovement (refType: "return", +change)
  │     │
  ├── StockAdjustment ─ StockAdjustmentItem
  │     │                    │
  │     │                    ▼
  │     │             InventoryBalance (set to actual)
  │     │                    │
  │     │                    ▼
  │     │             StockMovement (refType: "adjustment", ±change)
  │     │
  ├── StockTransfer (from) ─ StockTransferItem
  │     │                        │
  │     │                        ▼
  │     │                 InventoryBalance (from: -qty)
  │     │                        │
  │     │                        ▼
  │     │                 StockMovement (refType: "transfer", -change)
  │     │
  ├── StockTransfer (to) ─ StockTransferItem
  │     │                        │
  │     │                        ▼
  │     │                 InventoryBalance (to: +qty)
  │     │                        │
  │     │                        ▼
  │     │                 StockMovement (refType: "transfer", +change)
  │     │
  └── Initial Setup
              │
              ▼
        InventoryBalance (created@0)
              │
              ▼
        StockMovement (refType: "initial")
```

**Tables involved:** CatalogItem, InventoryLocation, InventoryBalance, StockMovement, Sale/SaleItem, Purchase/PurchaseItem, GoodsReceived/GoodsReceivedItem, Return/ReturnItem, StockAdjustment/StockAdjustmentItem, StockTransfer/StockTransferItem

**Inventory Valuation Method:** Snapshot Cost Method
```
Total Value = SUM(balance.quantityOnHand × catalogItem.costPrice)
```

COGS is captured at sale time in `SaleItem.costPrice` (snapshot), ensuring historical COGS stability. Falls back to current `CatalogItem.costPrice` if snapshot is null.

---

## 10. SALES FLOW

### Complete Flow

```
Lead (sales pipeline — optional)
  │  (NEW → CONTACTED → INTERESTED → DEMO → NEGOTIATION → CONVERTED / LOST)
  │
  ▼
Customer (walk-in, retail, wholesale)
  │
  ├── Quotation (optional pre-sale step)
  │     │  (draft → sent → accepted / rejected / expired / converted)
  │     │
  │     ▼
  └── Sale (POS or manual)
        │  (draft → completed / cancelled / refunded)
        │
        ├── SaleItem (line items with catalogItemId, quantity, unitPrice, costPrice snapshot)
        │
        ├── Inventory Deduction
        │     ├── InventoryBalance.update(quantityOnHand -= qty)
        │     └── StockMovement.create(referenceType: "sale", quantityChange: -qty)
        │
        ├── Invoice (auto-created)
        │     │  (draft → issued → unpaid / partial / paid / overdue / cancelled)
        │     │
        │     └── InvoiceItem
        │
        ├── Payment (polymorphic — linked via saleId or invoiceId)
        │     │  (pending → completed / failed / refunded)
        │     │
        │     └── PaymentMethod (cash / card / mobile / bank / credit)
        │
        ├── Cash Transaction (if cash payment)
        │     └── CashTransaction.create(type: "cash_in")
        │
        └── Reports (aggregate all)
              ├── Sales reports (daily/weekly/monthly summaries)
              ├── Customer statements
              ├── P&L (revenue, COGS, profit)
              └── AI insights (RevenueEngine)
```

### Key Sale Behaviors

- **Walk-in customer** — Auto-created if no customerId provided (lookup by email "walkin@internal")
- **Credit sale** — No immediate payment, invoice status = "unpaid"
- **Cash sale** — Full payment processed, invoice status = "paid"
- **Partial payment** — Partial amount captured, invoice status = "partial"
- **Stock check** — Validates `currentQty >= requestedQty` for tracked items before allowing sale
- **Invoice number** — Generated as `INV-{businessId prefix}-{timestamp base36}-{random}`

---

## 11. PROCUREMENT FLOW

### Basic Procurement (Direct Purchase)

```
Supplier ── Purchase
              │
              ├── PurchaseItem
              │     (catalogItemId, quantity, unitCost, subtotal)
              │
              ├── Supplier Balance (Purchase.balanceDue)
              │
              ├── Inventory Update (if status = "completed")
              │     ├── InventoryBalance.update(+qty)
              │     └── StockMovement.create(refType: "purchase")
              │
              └── Payment (optional)
```

### Advanced Procurement (PO + Goods Receipt)

```
Supplier ── PurchaseOrder
              │  (draft → sent → approved → received → cancelled)
              │
              ├── PurchaseOrderItem
              │     (catalogItemId, quantity, unitCost, receivedQuantity tracking)
              │
              └── GoodsReceived
                    │  (reference: purchaseOrderId)
                    │
                    ├── GoodsReceivedItem
                    │     (catalogItemId, expectedQty, receivedQty, unitCost)
                    │
                    ├── PurchaseOrderItem.receivedQuantity update
                    │
                    └── Inventory Update
                          ├── InventoryBalance.update(+receivedQty)
                          └── StockMovement.create(refType: "purchase")
```

### Procurement Mode Toggle

Controlled by `businessSettings.advancedProcurement` (boolean):
- **Basic:** Direct Purchase creation
- **Advanced:** Requisition → PO → Goods Receipt workflow

---

## 12. REPORTING ENGINE

### 7 Report Types

| Report | Source Tables | Key Metrics |
|--------|--------------|-------------|
| **Sales Report** | Sale, SaleItem, Customer, Staff, Branch | Total sales (daily/weekly/monthly), by branch/staff/customer, period-over-period comparison |
| **Purchase Report** | Purchase, PurchaseItem, Supplier | Total spend, by supplier, by period, by category |
| **Customer Report** | Customer, Sale | Active customer ratio, acquisition trends, top customers, churn |
| **Supplier Report** | Supplier, Purchase | Total spend, by supplier, by period |
| **Inventory Report** | InventoryBalance, CatalogItem, InventoryLocation | Stock levels, low stock alerts, valuation, by location |
| **Expense Report** | Expense, ExpenseCategory | By category, by period, trends, approval status |
| **Subscription Report** | Subscription, SubscriptionPayment | Revenue from subscriptions, active/pending/expired counts |

### KPI Calculations

| KPI | Formula | Source |
|-----|---------|--------|
| **Gross Profit** | Revenue - COGS | financial-service.ts |
| **Net Profit** | Gross Profit - Operating Expenses | financial-service.ts |
| **Gross Margin** | (Gross Profit / Revenue) × 100 | financial-service.ts |
| **Net Margin** | (Net Profit / Revenue) × 100 | financial-service.ts |
| **Inventory Value** | SUM(quantityOnHand × costPrice) | financial-service.ts |
| **Cash Flow** | Opening + Inflows - Outflows = Closing | financial-service.ts |
| **Business Health** | Sales 25% + Cashflow 20% + Inventory 20% + Customers 20% + Debt 15% | health-score.ts |
| **Product Velocity** | 90-day quantity / 90 days | reorder-engine.ts |
| **Reorder Priority** | Days until stockout: ≤3=immediate, ≤7=today, ≤14=this week, ≤30=next week | reorder-engine.ts |
| **Supplier Score** | Reliability 40% + Delivery 25% + Cost 20% + Volume 15% = Score/100 | procurement-advisor.ts |

### Dashboard Data

Aggregated in `financial-service.ts:getDashboardData()`:
- Today's sales (count + total)
- Monthly sales (count + total)
- Gross profit, net profit
- Receivables total, payables total
- Cash position (sum of all active cash registers)
- Inventory value
- Low stock count
- Top 5 products (by quantity)
- Top 5 customers (by total)
- Top 5 suppliers (by total)

---

## 13. ROUTING

### Complete Route Map (84 pages, 6 layouts, 4 API routes)

```
PUBLIC ROUTES:
/                                       landing page
/login                                  login form
/register                               registration form
/forgot-password                        password reset request
/reset-password                         password reset
/privacy                                privacy policy
/terms                                  terms of service
/menu/[code]                            public QR menu

DIAGNOSTIC ROUTES:
/auth-diagnostics                       auth debug page
/session-diagnostics                    session debug page

PROTECTED ROUTES:
/profile                                user profile
/change-password                        password change

PLATFORM ROUTES (admin):
/platform/dashboard                     platform home
/platform/overview                      platform overview
/platform/profile                       admin profile
/platform/settings                      platform settings
/platform/support                       support management
/platform/users                         user management
/platform/roles                         role management
/platform/subscriptions                 subscription management
/platform/business-activations          business activation queue
/platform/deposits                      deposit management
/platform/finance                       platform finance
/platform/commissions                   commission management
/platform/distribution                  QR distribution management
/platform/leads                         lead management
/platform/leads/[id]                    lead detail
/platform/marketing                     marketing campaigns
/platform/onboarding                    client onboarding
/platform/sales                         sales management
/platform/sales/profiles                sales profiles
/platform/sales/hierarchy               sales hierarchy
/platform/sales-team/*                  (13 sub-routes)

WORKSPACE ROUTES:
/workspaces/dashboard                   workspace home
/workspaces/profile                     workspace profile
/workspaces/settings                    workspace settings
/workspaces/members                     workspace members
/workspaces/businesses                  workspace businesses list

BUSINESS ROUTES (/workspaces/businesses/[businessId]):
/ (index)                               business home
/overview                               business overview
/activation                             subscription activation
/settings                               business settings
/branches                               branch management
/staff                                  staff management
/stores                                 store management
/catalog                                catalog items
/catalog/categories                     catalog categories
/catalog/units                          measurement units
/catalog/brands                         product brands
/inventory                              inventory management
/inventory-valuation                    inventory valuation
/purchases                              purchase management
/purchase-orders                        purchase orders
/goods-received                         goods received
/suppliers                              supplier list
/suppliers/[supplierId]                 supplier detail
/suppliers/[supplierId]/statement       supplier statement
/sales                                  sales management
/pos                                    point of sale
/invoices                               invoice management
/quotations                             quotation management
/receivables                            receivables tracking
/payables                               payables tracking
/wallet                                 subscription wallet
/expenses                               expense management
/customers                              customer list
/customers/[customerId]                 customer detail
/customers/[customerId]/statement       customer statement
/reports                                reports center
/branch-performance                     branch performance
/qr-ordering                            QR ordering management
/qr-ordering/[qrCodeId]/menu            QR menu editor
/subscriptions                          subscription plan

API ROUTES:
POST /api/upload                        file upload
GET  /api/auth/me                       current user
GET  /api/auth/health                   auth health check
ALL  /api/auth/[...all]                 better-auth catch-all
```

### Layout Hierarchy

```
Root Layout (app/layout.tsx)
├── Auth Layout (app/(auth)/layout.tsx) → /login, /register, /forgot-password, /reset-password
├── Platform Layout (app/platform/layout.tsx) → /platform/*
│   └── Sales Team Layout (app/platform/sales-team/layout.tsx) → /platform/sales-team/*
└── Workspace Layout (app/workspaces/layout.tsx) → /workspaces/*
    └── Business Layout (app/workspaces/businesses/[businessId]/layout.tsx) → /workspaces/businesses/[id]/*
```

---

## 14. COMPONENT ARCHITECTURE

### Component Types

| Type | Examples | Location |
|------|----------|----------|
| **UI Primitives** | Button, Input, Select, Dialog, DropdownMenu, Popover, Tabs, Toast, Tooltip, Switch, Avatar, Progress, Separator | `src/components/ui/` |
| **Layout Components** | PlatformShell, Sidebar, Navbar, BottomNav, BusinessLayoutClient | `src/components/layout/` |
| **Providers** | Providers, AuthProvider, FirdausProvider, ThemeProvider, QueryClientProvider | `src/components/providers.tsx`, `src/features/auth/`, `src/features/enkai/` |
| **Shared Components** | Various reusable UI | `src/components/shared/` |
| **Feature Components** | BranchForm, StaffForm, CampaignList, SaleList, etc. | `src/features/*/components/` |
| **Page Components** | Next.js page.tsx files | `src/app/*/page.tsx` |

### Key Design Patterns

- **Server Components by default** — async/await with direct Prisma access
- **Client Components** — marked with `"use client"` for interactivity (forms, mutations, state)
- **React Hook Form** + **Zod** for form validation
- **Radix UI** primitives wrapped with CVA (class-variance-authority) for styling
- **Tailwind CSS 4** for all styling
- **next-themes** for dark/light/system theme switching

---

## 15. STATE MANAGEMENT

| Layer | Technology | Scope | Usage |
|-------|-----------|-------|-------|
| **Server State** | Prisma + RSC | Server | Direct database queries in async server components |
| **Server Mutations** | Server Actions | Server | Form submissions, data mutations via `"use server"` functions |
| **Server Cache** | TanStack React Query 5 | Client | useQuery/useMutation with 60s stale time, 1 retry |
| **Client State** | Zustand 5 | Client | auth-store (user, loading), workspace-store (currentWorkspace, workspaces), ui-store (sidebar, theme) |
| **URL State** | Next.js Router | Client/Server | Route params, search params, path-based navigation |
| **Form State** | react-hook-form + Zod | Client | Form validation, submission, error handling |
| **Context** | React Context | Client | AuthProvider wraps user state, FirdausProvider wraps AI assistant state |

### Caching Strategy
- **React Query:** 60s stale time, 1 retry, cache invalidation via `revalidatePath()`
- **Next.js:** `force-dynamic` on root layout (no static generation, no ISR)
- **No Redis/memcached** — all data fresh from PostgreSQL on every request

### Optimistic Updates
Not consistently implemented — most mutations await the server response before updating UI.

---

## 16. PERFORMANCE

### Heavy Queries (Identified)

| Location | Issue | Impact |
|----------|-------|--------|
| `sale-service.ts` | N+1: fetches catalogItem for each sale item in loop inside transaction | **HIGH** — O(items) queries per sale |
| `inventory-report.ts` | Multi-table joins with full table scans | **MODERATE** — paginated but no covering indexes |
| `financial-service.ts:calculateCOGS` | Loads ALL completed sale items for date range | **HIGH** — can be thousands+ for monthly range |
| `financial-service.ts:getBranchPerformance` | Per-branch loop with 5+ queries each | **HIGH** — O(branches × 5) queries |
| `reports/*` | Multiple sequential aggregation queries per report | **MODERATE** — no caching or materialization |
| `reorder-engine.ts` | Loads ALL catalog items + 90 days of saleItems | **MODERATE** — no pagination limits |
| `health-score.ts` | 12+ sequential aggregation queries per call | **MODERATE** — runs on dashboard load |
| `catalog-service.ts:deleteCatalogItem` | 12 separate count queries to check transactional history | **HIGH** — should use EXISTS instead |
| `sale-service.ts:createSale` | Walk-in customer lookup by string email for every walk-in | **MODERATE** — could use in-memory cache |
| `activation-service.ts` | Deep eager loading with nested includes | **LOW** — scoped to pending businesses |

### N+1 Query Patterns

1. **Sale creation loop:** `for (item of data.items) { await tx.catalogItem.findUnique(...) }`
2. **Branch performance loop:** `for (branch of branches) { await 5+ queries }`
3. **Catalog delete check:** `await 12× prisma.count({ where: { catalogItemId } })`
4. **Reorder velocity:** Loads all saleItems per product (no aggregation in query)

### Missing Optimizations

- No database views or materialized views for reporting
- No Redis/memcached caching layer
- No pagination limits on AI/analytics aggregate queries
- Report results not cached (recalculated per request)
- No DataLoader or batch loading pattern
- No connection pooling limits configured
- No query timeout configuration
- No database read replicas

---

## 17. SECURITY

### Current Posture

| Aspect | Rating | Detail |
|--------|--------|--------|
| **Authentication** | ✅ GOOD | Better Auth with session management, rate limiting, email/password |
| **RBAC** | ⚠️ PARTIAL | Role/Permission infrastructure exists but NOT enforced at service layer |
| **Input Validation** | ✅ GOOD | Zod schemas used throughout all mutations |
| **SQL Injection** | ✅ GOOD | Prisma ORM parameterizes all queries |
| **XSS** | ✅ GOOD | React's built-in XSS protection (automatic escaping) |
| **CSRF** | ⚠️ PARTIAL | SameSite=Lax cookie, but no explicit CSRF tokens |
| **Sensitive Data** | ⚠️ WEAK | EmailConfig stores SMTP passwords (claimed encrypted — no encryption logic visible in codebase) |
| **Audit Logs** | ✅ GOOD | AuditLog model with before/after JSON snapshots for all mutations |
| **Tenant Isolation** | ⚠️ PARTIAL | businessId scoped in data, but no enforcement at service level |
| **Password Policy** | ⚠️ BASIC | mustChangePassword flag exists, no complexity enforcement |
| **API Security** | ⚠️ PARTIAL | No API key, no rate limiting on business operations, no CORS config |

### Gaps

1. **No service-level permission checks** — Most services check only `requireAuth()` but don't verify the user has the required permission for the operation
2. **No data ownership verification** — Services accept `businessId` as parameter but don't verify the user belongs to that business
3. **No API rate limiting on mutations** — Only auth endpoint has rate limiting (20/60s)
4. **No CORS configuration** — Next.js API routes use default CORS
5. **No security headers** — No CSP, HSTS, X-Frame-Options, X-Content-Type-Options
6. **No input sanitization for search** — Zod validates structure but not content (e.g., no regex for malicious patterns)
7. **SMTP passwords not encrypted** — "encrypted at rest" claim in schema comment but no encryption implementation found
8. **No brute force protection** beyond rate limit on auth endpoint
9. **No session invalidation on password change** — Old sessions may remain valid

---

## 18. CODE QUALITY

### Duplicate Services/Actions

| Pattern | Location | Issue |
|---------|----------|-------|
| `features/branches/actions/` + `features/branches/services/` | Branches module | Overlapping responsibilities |
| `features/settings/services/` + `features/platform/actions/settings-actions.ts` | Settings module | Duplicate setting management |
| `features/payments/services/` + `features/payments/actions/` | Payments module | Both handle payment operations |
| Multiple `index.ts` action files | Various features | Confusing import paths |

### Dead/Unused Code

| Item | Location | Status |
|------|----------|--------|
| `src/ai/` directory | Empty directory | Completely empty |
| `Sidebar` component | workspace layout | Imported but commented out in JSX |
| `BottomNav` component | workspace layout | Imported but commented out in JSX |
| `use-sound.ts` hook | hooks/ | Exists, usage unclear |
| `speech-recognition.d.ts` | types/ | Type definitions only, no implementation |

### Large Files (Exceeding 300 lines)

| File | Lines | Issue |
|------|-------|-------|
| `prisma/schema.prisma` | 2812 | Acceptable for schema |
| `activation-service.ts` | ~450 | Mixed responsibilities (activate, top-up, suspend, reactivate, list) |
| `financial-service.ts` | ~500 | P&L + cash flow + valuation + branch performance + dashboard all in one |
| `sale-service.ts` | ~400 | CRUD + void + delete all in one service file |
| `revenue-engine.ts` | 385 | All analytics in one class |
| `health-score.ts` | 193 | 5 scoring functions in one class |
| `balance-service.ts` | ~200 | Multiple inventory operations in one file |

### Architecture Smells

1. **Service Layer Bypass** — Some server components query Prisma directly instead of going through service layer
2. **Action-Service Duplication** — Some features have both `actions/` and `services/` with overlapping logic
3. **Mixed Concerns** — `activation-service.ts` handles wallet top-ups AND business activation AND suspend/reactivate
4. **Dynamic Imports in Hot Paths** — `await import()` in `createSale` for audit service adds latency
5. **Hardcoded Strings** — Mix of English and Swahili across services with no i18n layer
6. **No Shared Error Handling** — Try/catch with `console.error()` repeated in every function
7. **Inconsistent Return Types** — Some return `ActionResponse`, others return raw Prisma types, some return custom interfaces
8. **No Service-Level RBAC** — Permission checks need to be added manually to every service entry point
9. **Cross-Module Dependency** — `sales/service` imports `cash-management/services/cash-integration` directly
10. **Missing Repository Pattern** — Prisma queries mixed with business logic in service layer (hard to mock/test)
11. **No Logger Abstraction** — `console.log` and `console.error` used directly throughout (no structured logging)

---

## 19. DEPENDENCY GRAPH

```
                    ┌───────────────────────┐
                    │     User / Auth       │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Workspace        │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │      Business         │
                    │   (multi-tenant root) │
                    └───┬───┬───┬───┬──────┘
                        │   │   │   │
    ┌───────────────────┘   │   │   └──────────────────┐
    ▼                       ▼   ▼                      ▼
┌──────────┐         ┌──────────────┐          ┌──────────────┐
│ Settings  │         │  Branches    │          │ Subscription │
│           │         │  Stores      │          │    Wallet    │
└──────────┘         │  Staff       │          └──────┬───────┘
                      └──────┬───────┘                 │
                             │                         ▼
    ┌────────────────────────┤                 ┌──────────────┐
    ▼                        ▼                 │ Activation   │
┌──────────┐          ┌──────────────┐         │ (top-up,     │
│ Catalog  │          │  Inventory   │         │  approve,    │
│ (items,  │          │  Locations   │         │  activate)   │
│  cats,   │          │  Balances    │         └──────────────┘
│  brands) │          │  Movements   │
└────┬─────┘          └───┬───┬──────┘
     │                    │   │
     ├────────────────────┘   │
     │                        │
     ▼                        ▼
┌──────────────┐       ┌──────────────┐
│   Sales      │       │  Purchases   │
│   SaleItems  │       │  PO / GR     │
│   Invoices   │       │  GoodsRecv   │
│   Payments   │       └──────┬───────┘
│   Returns    │              │
│   Quotations │              │
└──────┬───────┘              │
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐
│   Expenses   │       │  Suppliers   │
└──────┬───────┘       └──────┬───────┘
       │                      │
       └──────────┬───────────┘
                  ▼
          ┌──────────────┐
          │  Financial   │
          │  (P&L, cash  │
          │   flow,      │
          │   valuation) │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │   Reports    │
          └──────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │  AI Modules  │
          │  (reorder,   │
          │   revenue,   │
          │   health,    │
          │   debt)      │
          └──────────────┘
```

### Circular Dependencies

1. **Sales → Cash Management → Sales** (via cash-integration import)
2. **Sales → Invoices → Payments → Sales** (via Payment.saleId + Invoice.saleId)
3. **Inventory → Stock Movements → Inventory** (movements update balances, balances track movements)
4. **AI EventBus → All Modules → EventBus** (events trigger side effects that may create more events)

---

## 20. BUSINESS PROCESS MAP

```
                    ┌──────────────────┐
                    │  User Registration│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Workspace Creation│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Business Creation │
                    │ (type + mode)     │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Subscription Plan │
                    │ Selection         │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Wallet Top-Up     │
                    │ (deposit request) │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Admin Approval   │
                    │ + Fee Deduction  │
                    │ + Auto-Activate  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Business Active   │
                    └────────┬─────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Catalog Setup│    │ Branch Setup │    │ Staff Setup  │
│ (items,      │    │ (locations)  │    │ (assignments)│
│  categories, │    └──────┬───────┘    └──────┬───────┘
│  brands,     │           │                   │
│  units)      │           │                   │
└──────┬───────┘           │                   │
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Sales      │  │  Purchases   │  │  Inventory   │
│ (POS/manual, │  │ (PO/direct,  │  │ (management, │
│  credit/cash)│  │  GR/import)  │  │  adjustments,│
└──────┬───────┘  └──────┬───────┘  │  transfers)  │
       │                  │          └──────┬───────┘
       ▼                  ▼                 │
┌──────────────┐  ┌──────────────┐          │
│   Invoices   │  │ Goods Received│          │
│ (auto/manual)│  │ (inventory+) │          │
└──────┬───────┘  └──────┬───────┘          │
       │                  │                 │
       └──────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Payments   │  │   Expenses   │  │ Stock Moves  │
│ (polymorphic,│  │ (categorized,│  │ (ledger of   │
│  multi-type)  │  │  approved)   │  │  all changes)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                  │                 │
       └──────────────────┼─────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Reports    │  │    P&L /     │  │  AI Modules  │
│ (7 types,    │  │  Cash Flow   │  │ (reorder,    │
│  aggregated) │  │  Valuation   │  │  revenue,    │
└──────────────┘  └──────────────┘  │  health,     │
                                    │  debt,       │
        ┌───────────────────────────┘  procurement)│
        │                            └──────────────┘
        ▼
┌──────────────┐
│  Dashboard   │
│ (health      │
│  score, KPIs)│
└──────────────┘
```

---

## 21. FOLDER TREE (Complete)

```
enkai-business/
├── prisma/
│   └── schema.prisma
├── scripts/
│   └── assign-owner-roles.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── auth/health/route.ts
│   │   │   ├── auth/me/route.ts
│   │   │   ├── seed/route.ts
│   │   │   └── upload/route.ts
│   │   ├── menu/[code]/page.tsx
│   │   ├── platform/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── overview/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── roles/page.tsx
│   │   │   ├── subscriptions/page.tsx
│   │   │   ├── business-activations/page.tsx
│   │   │   ├── deposits/page.tsx
│   │   │   ├── finance/page.tsx
│   │   │   ├── commissions/page.tsx
│   │   │   ├── distribution/page.tsx
│   │   │   ├── leads/page.tsx
│   │   │   ├── leads/[id]/page.tsx
│   │   │   ├── marketing/page.tsx
│   │   │   ├── onboarding/page.tsx
│   │   │   ├── sales/page.tsx
│   │   │   ├── sales/profiles/page.tsx
│   │   │   ├── sales/hierarchy/page.tsx
│   │   │   └── sales-team/
│   │   │       ├── layout.tsx
│   │   │       ├── overview/page.tsx
│   │   │       ├── clients/page.tsx
│   │   │       ├── commissions/page.tsx
│   │   │       ├── territories/page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       ├── performance/page.tsx
│   │   │       ├── register/page.tsx
│   │   │       ├── team/page.tsx
│   │   │       ├── sales/page.tsx
│   │   │       ├── leads/page.tsx
│   │   │       ├── targets/page.tsx
│   │   │       ├── orders/page.tsx
│   │   │       └── achievements/page.tsx
│   │   ├── workspaces/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── settings/page.tsx
│   │   │   ├── members/page.tsx
│   │   │   ├── businesses/page.tsx
│   │   │   └── businesses/[businessId]/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── activation/page.tsx
│   │   │       ├── overview/page.tsx
│   │   │       ├── settings/page.tsx
│   │   │       ├── branches/page.tsx
│   │   │       ├── staff/page.tsx
│   │   │       ├── stores/page.tsx
│   │   │       ├── catalog/page.tsx
│   │   │       ├── catalog/categories/page.tsx
│   │   │       ├── catalog/units/page.tsx
│   │   │       ├── catalog/brands/page.tsx
│   │   │       ├── inventory/page.tsx
│   │   │       ├── inventory-valuation/page.tsx
│   │   │       ├── purchases/page.tsx
│   │   │       ├── purchase-orders/page.tsx
│   │   │       ├── goods-received/page.tsx
│   │   │       ├── suppliers/page.tsx
│   │   │       ├── suppliers/[supplierId]/page.tsx
│   │   │       ├── suppliers/[supplierId]/statement/page.tsx
│   │   │       ├── sales/page.tsx
│   │   │       ├── pos/page.tsx
│   │   │       ├── invoices/page.tsx
│   │   │       ├── quotations/page.tsx
│   │   │       ├── receivables/page.tsx
│   │   │       ├── payables/page.tsx
│   │   │       ├── wallet/page.tsx
│   │   │       ├── expenses/page.tsx
│   │   │       ├── customers/page.tsx
│   │   │       ├── customers/[customerId]/page.tsx
│   │   │       ├── customers/[customerId]/statement/page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       ├── branch-performance/page.tsx
│   │   │       ├── qr-ordering/page.tsx
│   │   │       ├── qr-ordering/[qrCodeId]/menu/page.tsx
│   │   │       └── subscriptions/page.tsx
│   │   ├── auth-diagnostics/page.tsx
│   │   ├── session-diagnostics/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── change-password/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── terms/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   │
│   ├── features/
│   │   ├── activation/ (actions/, services/)
│   │   ├── activities/ (services/)
│   │   ├── audit-logs/ (services/)
│   │   ├── auth/ (actions/, components/, constants/, types/)
│   │   ├── branches/ (actions/, components/, constants/, context/, index.ts, schemas/, services/, types/)
│   │   ├── businesses/ (services/)
│   │   ├── campaigns/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── cash-management/ (services/)
│   │   ├── catalog/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── commissions/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── crm/ (services/)
│   │   ├── customer-credit/ (actions/, components/, constants/, index.ts, schemas/, services/)
│   │   ├── customer-groups/ (services/)
│   │   ├── customers/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── dashboards/ (services/)
│   │   ├── email-templates/ (components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── enkai/ (components/, constants/, index.ts, services/, types/)
│   │   ├── expense-categories/ (services/)
│   │   ├── expenses/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── financial/ (actions/, services/)
│   │   ├── goods-received/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── inventory/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── invoices/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── leads/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── members/ (components/)
│   │   ├── notifications/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── payments/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── permissions/ (actions/, components/, constants/, index.ts, schemas/, services/)
│   │   ├── platform/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── pos/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── procurement/ (actions/, services/)
│   │   ├── purchase-orders/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── purchases/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── qr-ordering/ (feature-gate.ts, index.ts, types/)
│   │   │   ├── qr-campaigns/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   │   ├── qr-codes/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   │   └── qr-menus/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── quotations/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── reports/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── returns/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── roles/ (actions/, components/, constants/, index.ts, schemas/, services/)
│   │   ├── sales/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── sales-network/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── settings/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── staff/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── statements/ (actions/, services/)
│   │   ├── stock/ (services/)
│   │   ├── stock-adjustments/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── stock-transfers/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── stores/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── subscriptions/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   │   └── wallet-deposits/ (actions/, schemas/, services/)
│   │   ├── suppliers/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── support-tickets/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │   ├── unit-conversions/ (services/)
│   │   ├── upload/ (actions/, components/, constants/, index.ts, services/)
│   │   ├── uploads/ (services/)
│   │   ├── users/ (actions/, components/, constants/, index.ts, schemas/, services/)
│   │   └── workspaces/ (actions/, components/, constants/, index.ts, schemas/, services/, types/)
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── platform-shell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── navbar.tsx
│   │   │   └── bottom-nav.tsx
│   │   ├── ui/ (Button, Input, Select, Dialog, DropdownMenu, Popover, Tabs, Toast, etc.)
│   │   ├── shared/
│   │   ├── providers.tsx
│   │   ├── launcher-sound.tsx
│   │   └── registrations/
│   │
│   ├── modules/ai/
│   │   ├── events/event-bus.ts
│   │   ├── inventory/reorder-engine.ts
│   │   ├── revenue/revenue-engine.ts
│   │   ├── procurement/procurement-advisor.ts
│   │   ├── credit/debt-collection-engine.ts
│   │   ├── health/health-score.ts
│   │   ├── automation/workflow-automation.ts
│   │   ├── email/
│   │   └── whatsapp/
│   │
│   ├── enkai/intelligence/
│   │   ├── index.ts
│   │   ├── anomaly-detection/
│   │   ├── automation-rules/
│   │   ├── business-insights/
│   │   ├── forecasting/
│   │   ├── recommendations/
│   │   └── trend-analysis/
│   │
│   ├── platform/
│   │   ├── index.ts
│   │   ├── analytics/index.ts
│   │   ├── dashboard/index.ts
│   │   ├── monitoring/index.ts
│   │   ├── permissions/index.ts
│   │   ├── roles/index.ts
│   │   ├── settings/index.ts
│   │   ├── support/index.ts
│   │   └── users/index.ts
│   │
│   ├── notifications/email/
│   │   ├── index.ts
│   │   └── services/
│   │       ├── smtp-service.ts
│   │       ├── template-service.ts
│   │       ├── email-queue-service.ts
│   │       └── campaign-service.ts
│   │
│   ├── server/
│   │   ├── auth.ts
│   │   └── db.ts
│   │
│   ├── stores/
│   │   ├── auth-store.ts
│   │   ├── workspace-store.ts
│   │   └── ui-store.ts
│   │
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── auth-client.ts
│   │   ├── constants.ts
│   │   ├── utils.ts
│   │   ├── phone.ts
│   │   └── validations/
│   │
│   ├── hooks/
│   │   ├── use-media-query.ts
│   │   ├── use-permission.ts
│   │   ├── use-sound.ts
│   │   └── use-toast.ts
│   │
│   ├── types/
│   │   ├── auth.ts
│   │   ├── enums.ts
│   │   ├── index.ts
│   │   ├── models.ts
│   │   ├── relationships.ts
│   │   ├── upload.ts
│   │   └── speech-recognition.d.ts
│   │
│   ├── middleware.ts
│   └── __tests__/
│       ├── auth-diagnostics.test.ts
│       ├── pricing.test.ts
│       ├── rbac.test.ts
│       └── unit-conversion.test.ts
│
├── styles/
├── docs/
├── public/
├── .env.example
├── .gitignore
├── .prettierrc
├── AGENTS.md
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
└── vitest.config.ts
```

---

## 22. SCALABILITY REVIEW

| Scale | Assessment | Primary Bottleneck |
|-------|-----------|-------------------|
| **100 businesses** | ✅ Easily handles | Single PostgreSQL instance sufficient |
| **1,000 businesses** | ⚠️ With tuning needed | DB connection pooling, query optimization, index tuning required |
| **10,000 businesses** | ❌ Requires significant refactoring | Monolithic DB, no caching, N+1 queries will cause degradation |
| **100,000 businesses** | ❌ Requires fundamental redesign | Horizontal sharding, microservices, event-driven architecture needed |
| **Millions of users** | ❌ Not designed for this | No student/parent domain model, no consumer-scale optimization |
| **Millions of AI conversations** | ❌ Not designed | FirdausWorkflow table has no partitioning, no archival strategy |

### Key Blockers for Scale

| # | Blocker | Impact |
|---|---------|--------|
| 1 | **Monolithic PostgreSQL** — single database, no read replicas | All reads hit one instance; reporting queries block writes |
| 2 | **No caching layer** — no Redis/memcached | Every request hits PostgreSQL, even for identical data |
| 3 | **No message queue** — no Kafka/RabbitMQ/SQS | Heavy processing (reports, AI) blocks the request response |
| 4 | **N+1 query patterns** — loops over items/branches | Linear degradation: O(rows) queries instead of O(1) or O(log n) |
| 5 | **No background job system** — everything synchronous | Long-running transactions (sale, report) block serverless function |
| 6 | **Prisma connection pooling** — default pool size | Serverless cold starts + limited connections = connection exhaustion |
| 7 | **Next.js serverless limits** — 10s timeout, 50MB response | Report generation and complex mutations may time out |
| 8 | **No data archival strategy** — historical data grows unbounded | Query performance degrades as tables grow |
| 9 | **Monolithic codebase** — single Next.js app | Cannot scale modules independently; full app redeploy for any change |
| 10 | **No CDN for static content** — ImageKit handles images only | No edge caching for API responses or rendered pages |

---

## 23. PRODUCTION READINESS

| Area | Score | Reasoning |
|------|-------|-----------|
| **Architecture** | **7/10** | Well-structured domain features, clear separation of concerns, but monolith with mixed concerns in large service files |
| **Database** | **7/10** | Comprehensive schema with proper indexing and constraints, but missing views, materialized views, and partitioning |
| **Security** | **5/10** | Auth is solid (Better Auth, rate limiting), RBAC infrastructure exists but is NOT enforced at the service layer; no CORS, no security headers, no CSRF tokens |
| **Scalability** | **3/10** | Monolithic DB, no caching layer, N+1 query patterns, no background jobs, no message queue |
| **Maintainability** | **6/10** | Feature folder structure is clean and domain-driven, but large service files, duplicate action/service patterns, no repository layer, console.log debugging throughout |
| **Performance** | **4/10** | N+1 query patterns in critical paths (sale creation, branch performance), unoptimized reporting queries, no query caching, 12-count checks for catalog deletion |
| **AI** | **3/10** | "AI" is entirely rule-based business intelligence; no ML, NLP, LLM, voice, or actual AI exists despite the naming |
| **ERP** | **8/10** | Comprehensive ERP with catalog, inventory, sales, purchases, invoices, payments, expenses, returns, transfers, adjustments, commissions, CRM, quotations |
| **School Module** | **0/10** | **No school-specific functionality exists** — no Student, Class, Course, Enrollment, Grade, Attendance, Parent/Guardian, or Timetable models |
| **Voice** | **1/10** | Only type definitions exist (`speech-recognition.d.ts`); no voice pipeline, wake word, STT, or TTS implemented |
| **Reporting** | **6/10** | 7 report types with good aggregation logic, but no caching, no export (CSV/PDF), no scheduled delivery, no report builder |

---

## 24. FINAL SUMMARY

### Overall Architecture Score: **5.8 / 10**

### Strengths

1. **Comprehensive ERP foundation** — 104 database models, 55 feature modules, 84 pages covering a full business management platform
2. **Clean domain separation** — Feature modules organized by business domain with clear action/service/component boundaries
3. **Strong modern tech stack** — Next.js 16, React 19, Prisma 6, TypeScript 5.7, PostgreSQL
4. **Solid authentication** — Better Auth with session management, rate limiting, phone/username login normalization
5. **Multi-tenant data model** — Business-scoped entities with workspace→business→branch→store hierarchy
6. **Extensible event system** — FirdausEventBus provides pub/sub for cross-cutting concerns
7. **Comprehensive inventory tracking** — Full lifecycle from purchase through sale with movement ledger
8. **Polymorphic payment system** — Single Payment model handles sales, invoices, purchases, subscriptions
9. **RBAC infrastructure exists** — Role, Permission, UserRole tables are in place with three scope levels
10. **Swahili localization** — AI insights and debt reminders are in Swahili (Tanzania market)
11. **Audit trail** — AuditLog model captures before/after snapshots on critical mutations
12. **Good validation culture** — Zod schemas used consistently across all mutation endpoints

### Weaknesses

1. **No school/education domain** — Despite being called a school platform, there are zero education-specific models (Student, Class, Course, Enrollment, Grade, Attendance, Parent)
2. **AI is misnamed** — Firdaus is deterministic rule-based business intelligence, not artificial intelligence; no ML, NLP, LLM, or voice exists
3. **RBAC not enforced** — Permission/Role infrastructure exists but service layer doesn't check permissions
4. **N+1 query patterns** — Multiple critical paths have O(n) query patterns (sale items, branch performance, catalog history checks)
5. **No caching strategy** — Every request hits PostgreSQL; no Redis, no memoization, no materialized views
6. **Large service files** — Multiple services exceed 300 lines with mixed responsibilities
7. **Inconsistent error handling** — Try/catch with console.error repeated in every service function
8. **Dynamic imports in hot paths** — await import() in critical mutation paths adds unpredictable latency
9. **Missing loading states** — No loading.tsx files anywhere; no Suspense boundaries
10. **No background job system** — Everything runs synchronously in the request lifecycle

### Technical Debt

1. Action-Service duplication across multiple features
2. 12 sequential count queries to check catalog item transactional history
3. O(branches) query pattern in branch performance reporting
4. Hard-coded email lookup for walk-in customer ("walkin@internal")
5. Missing loading.tsx files (no loading states for any route)
6. Circular dependencies between modules (sales↔invoice↔payment, stock↔movement)
7. Unused/disabled component code (Sidebar, BottomNav, empty src/ai/)
8. Missing error boundaries beyond root error.tsx and not-found.tsx
9. No consistent module index.ts export pattern across features
10. Console.log debugging statements in production service code

### Critical Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **No school domain model** | Platform cannot serve schools | Design Student, Class, Enrollment, Parent domain |
| 2 | **No service-level RBAC** | Data breach across tenants | Add permission checks to all service entry points |
| 3 | **Synchronous event processing** | Request timeouts under load | Move AI/notification processing to background queue |
| 4 | **No database connection pooling limits** | Connection exhaustion at scale | Configure PgBouncer or Prisma connection limits |
| 5 | **No read replicas** | Reporting queries impact production reads | Set up read replicas for analytics queries |
| 6 | **SMTP password storage** | Potential credential exposure | Implement actual encryption for EmailConfig passwords |
| 7 | **No query timeout** | Runaway queries | Set statement_timeout in PostgreSQL |
| 8 | **No data archival** | Unbounded table growth | Implement partition pruning or archival strategy |

### Missing School Platform Modules

To serve as a school platform, the following domains need to be designed and built:

| Domain | Required Models | Priority |
|--------|----------------|----------|
| **Students** | Student, StudentProfile, Guardian/Parent, EmergencyContact | CRITICAL |
| **Classes/Courses** | Class, Course, Subject, Section, Room | CRITICAL |
| **Enrollment** | Enrollment, EnrollmentHistory, AcademicYear, Term/Semester | CRITICAL |
| **Grades** | Grade, Gradebook, Assessment, ReportCard | HIGH |
| **Attendance** | Attendance, AttendanceRecord, Absence | HIGH |
| **Timetable** | Timetable, Period, Schedule | HIGH |
| **Fees** | FeeStructure, FeePayment, FeeReminder, Invoice (uses existing) | HIGH |
| **Staff-Student** | HomeroomAssignment, SubjectAssignment (uses existing Staff) | MEDIUM |
| **Discipline** | DisciplineRecord, Incident, Sanction | MEDIUM |
| **Communication** | ParentMessage, Announcement, Circular (uses existing Notification) | MEDIUM |
| **Library** | Book, BookLoan, LibraryCard | LOW |
| **Transport** | Route, BusStop, TransportAssignment | LOW |

### Architecture Bottlenecks (Action Required)

1. **Single PostgreSQL database** — All tenants and modules share one database instance
2. **In-process event bus** — Events are not durable; lost on server restart or crash
3. **No message queue** — Cannot offload heavy processing (reports, AI analysis)
4. **Monolithic Next.js application** — Cannot scale modules independently
5. **Prisma connection management** — Serverless cold starts + connection pool limits = production risk
6. **No WebSocket/SSE** — Real-time inventory/sales updates not supported
7. **Large mutation transactions** — Sale creation wraps entire workflow in one $transaction (risk of long-running locks)
8. **No read/write separation** — Reporting queries compete with transactional operations on same database

---

*End of Architecture Audit. Generated 2026-06-29 from full codebase inspection.*
