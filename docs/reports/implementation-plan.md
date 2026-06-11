# Enkai Business — Commerce SaaS Implementation Plan

---

## Architecture Guardrails (Mandatory — Override All Previous Decisions)

### 1. Business Hierarchy — All Modules Must Respect

```
Workspace
 └── Business
      └── Branch
           └── Store
```

- Workspace owns multiple businesses.
- Business has multiple branches.
- Branch has multiple stores.
- Store is optional.
- Business may operate without branches.
- Business may operate without stores.

Every Commerce module records its position in this hierarchy.

### 2. Multi-Tenant Rule — Never on User

**Never place `tenantId` on `User`.**

```
User
  ↓
WorkspaceMember
  ↓
Workspace
```

A user may belong to multiple workspaces. Membership is through `WorkspaceMember` only.

### 3. UUID Rule — All Primary Entities

```prisma
id String @id @default(uuid())
```

No integer IDs. No auto-increment IDs.

### 4. Mobile First

Every feature designed for:
1. Mobile (Android smartphone — primary)
2. Tablet
3. Desktop

Not the reverse.

### 5. CatalogItem Is the Single Universal Domain

| Context | Terminology |
|---------|-------------|
| Database | `CatalogItem`, `CatalogItemVariant`, `CatalogItemImage` |
| Developer API | `catalogItemId` in all foreign keys |
| Business UI | "Products", "Categories", "Brands", "Units", "Pricing" |

**No `Product` model exists in the database.**

All transactional entities reference `catalogItemId` — never `productId`.

Future industries extend via `itemType` field without schema changes:

```
CatalogItem (universal)
  ├── itemType = PRODUCT      → Commerce "Products" (current implementation)
  ├── itemType = SERVICE       → Future
  ├── itemType = MEDICINE      → Future Healthcare
  ├── itemType = MENU_ITEM     → Future Restaurant
  ├── itemType = RAW_MATERIAL  → Future Manufacturing
  └── itemType = FINISHED_GOOD → Future Manufacturing
```

### 6. Commerce-Only Scope — Current Release

| Field | Value |
|-------|-------|
| Industry | `COMMERCE` |
| Modes | `RETAIL`, `WHOLESALE`, `RETAIL + WHOLESALE` |

**Excluded (architecture only, no implementation):**
Healthcare, Pharmacy, Clinic, Hospital, Restaurant, Manufacturing, Agriculture, Services

No UI, routes, services, database logic, permissions, or workflows for excluded industries.

### 7. Staff Is Foundation — Not Extended Commerce

Every Commerce operation depends on staff:
- POS sessions require an assigned cashier
- Sales require a salesperson
- Inventory adjustments require a staff member
- Expenses require an approver
- Reports filter by staff

### 8. Payments Are Independent — Not Under Sales

Payments is a shared domain supporting:
- Sale Payments
- Invoice Payments
- Customer Credit Payments
- Subscription Payments
- Supplier Payments
- Expense Reimbursements

### 9. Financial Domains Are Separate — Never Merged

| Domain | Owns |
|--------|------|
| Sales | Sale, SaleItem |
| Payments | Payment, PaymentMethod |
| Expenses | Expense, ExpenseCategory |
| Customer Credit | CustomerCreditAccount, CustomerCreditTransaction |
| Cash Management | CashRegister, CashTransaction |
| Subscriptions | SubscriptionPlan, Subscription, SubscriptionWallet, SubscriptionTransaction |

Each domain owns its own models and services.

### 10. Enkai Is First-Class — Not a Utility

Enkai is the platform intelligence layer. It must be designed to **execute actions across domains** — all business domains expose service interfaces that Enkai can call later. Do not couple Enkai to UI components.

### 11. Auditability — Track Everything

Every critical action tracks:
- Who (userId)
- What (action, resourceType, resourceId)
- When (createdAt)
- Where (ipAddress, userAgent)

Three domains: `audit-logs`, `activities`, `notifications`.

### 12. QR Ordering Is Strategic — Prepare Architecture

Even if implementation is delayed, architecture must include:
- QR Code
- QR Menu
- QR Order
- QR Campaign
- QR Analytics

---

## Complete Feature Tree (56 modules)

### LAYER 0 — Platform Foundation (10 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 1 | `auth` | Login, register, session, password reset | Better Auth tables | `users` |
| 2 | `users` | User profiles, account, avatar | `User` (Prisma) | `auth`, `roles` |
| 3 | `workspaces` | Multi-tenant workspace CRUD, members | `Workspace`, `WorkspaceMember` | `users` |
| 4 | `businesses` | Business CRUD, industry modes, hierarchy root | `Business`, `BusinessMode` | `workspaces` |
| 5 | `branches` | Branch/outlet CRUD, head office, hours | `Branch` | `businesses` |
| 6 | `stores` | Store/warehouse CRUD | `Store` | `branches` |
| 7 | `staff` | Staff profiles, business/branch/store assignment, roles | `Staff` (new), `StaffAssignment` (new) | `users`, `businesses`, `branches`, `stores`, `roles` |
| 8 | `roles` | Dynamic role CRUD, scope, assignment | `Role`, `RolePermission`, `UserRole` | `permissions` |
| 9 | `permissions` | Permission slug registry | `Permission` | none |
| 10 | `enkai` | AI assistant, voice, commands, memory, automation, insights, tools | None initially | all (cross-domain) |

#### Staff Assignment Model

```
Staff
  ├── Business Level     → StaffAssignment (level=business, businessId)
  ├── Branch Level       → StaffAssignment (level=branch, businessId, branchId)
  └── Store Level        → StaffAssignment (level=store, businessId, branchId, storeId)
```

```prisma
model Staff {
  id            String   @id @default(uuid())
  userId        String   @unique
  businessId    String
  employeeCode  String?
  position      String?
  hireDate      DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User              @relation(fields: [userId], references: [id])
  business      Business          @relation(fields: [businessId], references: [id])
  assignments   StaffAssignment[]

  @@unique([businessId, employeeCode])
  @@index([businessId])
  @@map("staff")
}

model StaffAssignment {
  id        String   @id @default(uuid())
  staffId   String
  level     String   // "business", "branch", "store"
  businessId String
  branchId  String?
  storeId   String?
  roleId    String?
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())

  staff   Staff   @relation(fields: [staffId], references: [id])
  role    Role?   @relation(fields: [roleId], references: [id])

  @@unique([staffId, level, branchId, storeId])
  @@index([staffId])
  @@index([branchId])
  @@index([storeId])
  @@map("staff_assignments")
}
```

#### Enkai Architecture — Cross-Domain Service Interface

```
enkai/
├── assistant/     ← AI assistant that calls domain services
├── voice/         ← Voice command processing
├── commands/      ← Slash commands mapping to domain actions
├── actions/       ← Server actions
├── memory/        ← Context retention
├── automation/    ← Business process automation
├── insights/      ← AI business insights
├── prompts/       ← LLM prompt templates
├── tools/         ← Tool definitions for AI agent
└── index.ts
```

Enkai calls domain services via a shared interface pattern:

```
User: "Enkai sell 2kg sugar"
  → enkai/commands parses intent
  → enkai/tools calls catalog service (find sugar)
  → enkai/tools calls sales service (create sale)
  → enkai/actions returns result
```

Every business domain exposes a clean service interface that Enkai's tool layer can consume. No UI coupling.

---

### LAYER 1 — Commerce Core: Catalog Domain (1 module, 6 sub-features)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 11 | `catalog` | Universal catalog — CatalogItem, variants, images, assignments | `CatalogItem` (enhanced), `CatalogItemVariant` (new), `CatalogItemImage` (new), `CatalogItemAssignment` (new) | `businesses`, `branches`, `stores`, `categories`, `brands`, `units` |
| 11a | `catalog/products` | Commerce products: CatalogItem where itemType=PRODUCT | Same as catalog | `catalog` |
| 11b | `catalog/categories` | Hierarchical product categories | `Category` (new, self-referencing) | `businesses` |
| 11c | `catalog/brands` | Brand management | `Brand` (new) | `businesses` |
| 11d | `catalog/units` | Units of measure with conversions | `Unit` (new) | `businesses` |
| 11e | `catalog/pricing` | Price lists, bulk, customer-group pricing | `PriceList` (new), `PriceListItem` (new) | `catalog/products`, `customer-groups` |
| 11f | `catalog/assignments` | CatalogItemAssignment — availability by branch/store | `CatalogItemAssignment` (new) | `branches`, `stores` |

#### CatalogItemAssignment — Branch/Store Availability

```
CatalogItem
    ↓
CatalogItemAssignment  ← businessId, catalogItemId, branchId?, storeId?, isAvailable
    ↓
Branch → Store
```

**Rules:**
- Default: CatalogItem is available business-wide (no assignment records)
- Restrict: assignment with `isAvailable = false` at branch or store level
- Enable for specific branch: create assignments only for that branch
- Never assume all products exist everywhere

```prisma
model CatalogItemAssignment {
  id             String   @id @default(uuid())
  businessId     String
  catalogItemId  String
  branchId       String?
  storeId        String?
  isAvailable    Boolean  @default(true)
  sortOrder      Int      @default(0)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  business      Business     @relation(fields: [businessId], references: [id])
  catalogItem   CatalogItem  @relation(fields: [catalogItemId], references: [id])
  branch        Branch?      @relation(fields: [branchId], references: [id])
  store         Store?       @relation(fields: [storeId], references: [id])

  @@unique([businessId, catalogItemId, branchId, storeId])
  @@index([catalogItemId])
  @@index([branchId])
  @@index([storeId])
  @@map("catalog_item_assignments")
}
```

---

### LAYER 2 — Commerce Operations (8 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 12 | `inventory` | Inventory locations and balances — belongs to location, not product | `InventoryLocation` (new), `InventoryBalance` (new) | `catalog`, `stores`, `branches`, `businesses` |
| 13 | `stock` | Stock movement ledger (every QTY change logged) | `StockMovement` (new) | `inventory` |
| 14 | `stock-adjustments` | Write-offs, found stock, damage, expiry | `StockAdjustment` (new), `StockAdjustmentItem` (new) | `inventory` |
| 15 | `stock-transfers` | Inter-store transfer requests, dispatch, receipt | `StockTransfer` (new), `StockTransferItem` (new) | `inventory`, `stores` |
| 16 | `customers` | Customer CRUD — retail, wholesale, walk-in | `Customer` (new) | `businesses`, `customer-groups` |
| 17 | `customer-groups` | Group definitions for pricing, targeting | `CustomerGroup` (new) | `businesses` |
| 18 | `suppliers` | Supplier CRUD — local and international | `Supplier` (new) | `businesses` |
| 19 | `payments` | **Independent domain**. Polymorphic payments | `Payment` (new), `PaymentMethod` (new) | `businesses`, `stores` |

#### Inventory Ownership — Location-Based (Critical)

**Inventory does NOT belong to Product. Inventory belongs to locations.**

```
CatalogItem
    ↓
InventoryLocation  ← Business, Branch, or Store level
    ↓
InventoryBalance  ← quantity per CatalogItem per Location
```

```prisma
model InventoryLocation {
  id          String   @id @default(uuid())
  businessId  String
  branchId    String?  // null = business-level location
  storeId     String?  // null = branch-level location
  name        String
  type        String   // "business", "branch", "store"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  business    Business            @relation(fields: [businessId], references: [id])
  branch      Branch?             @relation(fields: [branchId], references: [id])
  store       Store?              @relation(fields: [storeId], references: [id])
  balances    InventoryBalance[]

  @@unique([businessId, branchId, storeId])
  @@index([businessId])
  @@index([branchId])
  @@index([storeId])
  @@map("inventory_locations")
}

model InventoryBalance {
  id              String   @id @default(uuid())
  locationId      String
  catalogItemId   String
  variantId       String?
  quantityOnHand  Decimal  @default(0)
  quantityAvailable Decimal @default(0)
  quantityCommitted Decimal @default(0)
  reorderPoint    Decimal  @default(0)
  maxStock        Decimal  @default(0)
  batchNo         String?
  expiryDate      DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  location    InventoryLocation @relation(fields: [locationId], references: [id])
  catalogItem CatalogItem       @relation(fields: [catalogItemId], references: [id])

  @@unique([locationId, catalogItemId, variantId])
  @@index([catalogItemId])
  @@index([locationId])
  @@map("inventory_balances")
}
```

**Why:** This prevents future redesign. A business may have inventory at business level (central warehouse), branch level (regional depot), or store level (retail floor). Each location type can hold stock independently.

#### Customer Architecture

```prisma
model Customer {
  id              String   @id @default(uuid())
  businessId      String
  userId          String?
  customerType    String   @default("retail")  // retail, wholesale, walk_in
  firstName       String
  lastName        String?
  email           String?
  phone           String?
  address         String?
  city            String?
  customerGroupId String?
  creditLimit     Decimal  @default(0)
  isActive        Boolean  @default(true)
  metadata        Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business        @relation(fields: [businessId], references: [id])
  customerGroup   CustomerGroup?  @relation(fields: [customerGroupId], references: [id])
  creditAccount   CustomerCreditAccount?

  @@index([businessId])
  @@index([phone])
  @@index([customerType])
  @@map("customers")
}
```

**Customer types:**
- `retail` — Regular retail customer with profile
- `wholesale` — Bulk buyer, may have credit account
- `walk_in` — Anonymous/transient, no profile

#### Supplier Architecture

```prisma
model Supplier {
  id            String   @id @default(uuid())
  businessId    String
  supplierType  String   @default("local")  // local, international
  name          String
  email         String?
  phone         String?
  address       String?
  city          String?
  country       String   @default("Tanzania")
  taxId         String?
  paymentTerms  String?  // "cash", "15_days", "30_days", etc.
  currency      String   @default("TZS")
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  business      Business    @relation(fields: [businessId], references: [id])

  @@index([businessId])
  @@map("suppliers")
}
```

#### Payments — Independent Polymorphic Domain

```prisma
model Payment {
  id                  String   @id @default(uuid())
  businessId          String
  workspaceId         String?
  branchId            String?
  storeId             String?
  paymentMethodId     String?
  amount              Decimal  @default(0)
  reference           String?
  paidAt              DateTime @default(now())
  status              String   @default("completed")  // pending, completed, failed, refunded
  notes               String?

  // Polymorphic — exactly one reference is set
  saleId              String?  // Sale payment
  invoiceId           String?  // Invoice payment
  customerCreditTxId  String?  // Customer credit payment
  subscriptionId      String?  // Subscription payment
  purchaseId          String?  // Supplier payment
  expenseId           String?  // Expense reimbursement

  createdById         String?
  createdAt           DateTime @default(now())

  business            Business       @relation(fields: [businessId], references: [id])
  store               Store?         @relation(fields: [storeId], references: [id])
  paymentMethod       PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  createdBy           User?          @relation(fields: [createdById], references: [id])

  @@index([saleId])
  @@index([invoiceId])
  @@index([subscriptionId])
  @@index([purchaseId])
  @@index([businessId, paidAt])
  @@map("payments")
}
```

---

### LAYER 3 — Commerce Procurement (3 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 20 | `purchases` | Purchase transactions with full hierarchy | `Purchase` (new), `PurchaseItem` (new) | `suppliers`, `catalog`, `stores`, `payments`, `staff` |
| 21 | `purchase-orders` | PO creation, approval, fulfillment | `PurchaseOrder` (new), `PurchaseOrderItem` (new) | `suppliers`, `catalog` |
| 22 | `goods-received` | GRN, partial receipt, quality check | `GoodsReceived` (new), `GoodsReceivedItem` (new) | `purchase-orders`, `inventory` |

---

### LAYER 4 — Commerce Sales & Revenue (9 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 23 | `sales` | **Full hierarchy recorded from day one** | `Sale` (new), `SaleItem` (new) | `catalog`, `customers`, `stores`, `payments`, `staff` |
| 24 | `pos` | POS sessions, till operations | `POSSession` (new) | `sales`, `catalog`, `stores`, `payments`, `staff` |
| 25 | `quotations` | Quotes, approval, conversion to sale | `Quotation` (new), `QuotationItem` (new) | `catalog`, `customers` |
| 26 | `invoices` | Invoicing, payment tracking, overdue | `Invoice` (new), `InvoiceItem` (new) | `sales`, `customers`, `payments` |
| 27 | `returns` | Returns, refund, exchange | `Return` (new), `ReturnItem` (new) | `sales`, `inventory`, `payments` |
| 28 | `expenses` | Expense recording, approval | `Expense` (new) | `expense-categories`, `staff`, `payments` |
| 29 | `expense-categories` | Expense category definitions | `ExpenseCategory` (new) | `businesses` |
| 30 | `customer-credit` | Credit sales, collections, statements | `CustomerCreditAccount` (new), `CustomerCreditTransaction` (new) | `customers`, `payments` |
| 31 | `cash-management` | Cash in/out, petty cash, reconciliation | `CashRegister` (new), `CashTransaction` (new) | `businesses`, `stores`, `staff` |

#### Sale — Full Hierarchy Ownership

```prisma
model Sale {
  id              String   @id @default(uuid())
  workspaceId     String   // From day one
  businessId      String   // From day one
  branchId        String?  // From day one (null if business has no branches)
  storeId         String?  // From day one (null if no store)
  customerId      String?
  staffId         String?  // From day one
  saleDate        DateTime @default(now())
  reference       String?
  status          String   @default("completed")  // draft, completed, cancelled, refunded
  subtotal        Decimal  @default(0)
  discountTotal   Decimal  @default(0)
  taxTotal        Decimal  @default(0)
  grandTotal      Decimal  @default(0)
  profitMargin    Decimal?
  notes           String?
  createdById     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workspace       Workspace    @relation(fields: [workspaceId], references: [id])
  business        Business     @relation(fields: [businessId], references: [id])
  branch          Branch?      @relation(fields: [branchId], references: [id])
  store           Store?       @relation(fields: [storeId], references: [id])
  customer        Customer?    @relation(fields: [customerId], references: [id])
  staff           Staff?       @relation(fields: [staffId], references: [id])
  createdBy       User?        @relation(fields: [createdById], references: [id])
  items           SaleItem[]

  @@index([businessId])
  @@index([branchId])
  @@index([storeId])
  @@index([customerId])
  @@index([staffId])
  @@index([saleDate])
  @@map("sales")
}
```

#### Customer Credit Architecture

```prisma
model CustomerCreditAccount {
  id              String   @id @default(uuid())
  businessId      String
  customerId      String   @unique
  creditLimit     Decimal  @default(0)
  currentBalance  Decimal  @default(0)  // Positive = customer owes
  status          String   @default("active")  // active, frozen, closed
  lastTransactionAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business                   @relation(fields: [businessId], references: [id])
  customer        Customer                   @relation(fields: [customerId], references: [id])
  transactions    CustomerCreditTransaction[]

  @@index([businessId])
  @@map("customer_credit_accounts")
}

model CustomerCreditTransaction {
  id              String   @id @default(uuid())
  accountId       String
  type            String   // credit_sale, payment, adjustment, write_off, refund
  amount          Decimal  // Positive = increases debt, Negative = reduces debt
  balanceBefore   Decimal
  balanceAfter    Decimal
  reference       String?  // saleId, paymentId
  description     String?
  createdById     String?
  createdAt       DateTime @default(now())

  account         CustomerCreditAccount @relation(fields: [accountId], references: [id])
  createdBy       User?                 @relation(fields: [createdById], references: [id])

  @@index([accountId])
  @@index([createdAt])
  @@map("customer_credit_transactions")
}
```

#### Cash Management — Independent from POS

```prisma
model CashRegister {
  id              String   @id @default(uuid())
  businessId      String
  branchId        String?
  storeId         String?
  name            String
  type            String   // main, petty_cash, till
  currency        String   @default("TZS")
  openingBalance  Decimal  @default(0)
  currentBalance  Decimal  @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business          @relation(fields: [businessId], references: [id])
  branch          Branch?           @relation(fields: [branchId], references: [id])
  store           Store?            @relation(fields: [storeId], references: [id])
  transactions    CashTransaction[]

  @@index([businessId])
  @@map("cash_registers")
}

model CashTransaction {
  id              String   @id @default(uuid())
  registerId      String
  type            String   // cash_in, cash_out, transfer_in, transfer_out, opening_balance, closing_balance, cash_count
  amount          Decimal
  balanceBefore   Decimal
  balanceAfter    Decimal
  reference       String?  // saleId, expenseId, paymentId
  description     String?
  performedById   String?
  createdAt       DateTime @default(now())

  register        CashRegister @relation(fields: [registerId], references: [id])
  performedBy     User?        @relation(fields: [performedById], references: [id])

  @@index([registerId])
  @@index([createdAt])
  @@map("cash_transactions")
}
```

---

### LAYER 5 — Commerce Intelligence (2 modules, domain-driven sub-modules)

| # | Feature | Sub-modules | Depends On |
|---|---------|-------------|------------|
| 32 | `reports` | sales/, inventory/, purchases/, expenses/, customers/, suppliers/, subscriptions/ | All Commerce modules |
| 33 | `dashboards` | Role-specific views, KPIs | `reports` |

```
reports/
├── sales/           ← Daily/weekly/monthly revenue, trends, top products
├── inventory/       ← Stock valuation, low stock, turnover, expiry
├── purchases/       ← Spend analysis, supplier performance
├── expenses/        ← Cost breakdown, category analysis
├── customers/       ← CLV, top customers, acquisition
├── suppliers/       ← Lead times, reliability, spend
├── subscriptions/   ← MRR, churn, ARPU, lifetime value
├── dashboards/      ← Composed views per role
└── index.ts
```

---

### LAYER 6 — Subscriptions & Wallet (1 module, 4 sub-features)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 34 | `subscriptions` | Plans, wallet, transactions, payments | `SubscriptionPlan` (exist), `Subscription` (exist), `SubscriptionPayment` (exist), `SubscriptionWallet` (new), `SubscriptionTransaction` (new) | `businesses`, `payments` |
| 34a | `subscriptions/plans` | Plan CRUD, pricing tiers | SubscriptionPlan | — |
| 34b | `subscriptions/wallet` | Wallet — advance payments, bonus, daily billing | `SubscriptionWallet`, `SubscriptionTransaction` | — |
| 34c | `subscriptions/transactions` | Wallet financial audit trail | SubscriptionTransaction | `wallet` |
| 34d | `subscriptions/payments` | Payment processing | SubscriptionPayment | `payments` |

#### Subscription Wallet

```prisma
model SubscriptionWallet {
  id              String   @id @default(uuid())
  businessId      String   @unique
  balance         Decimal  @default(0)     // Available credit
  totalDeposited  Decimal  @default(0)
  totalConsumed   Decimal  @default(0)
  bonusBalance    Decimal  @default(0)     // Promotional credits
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  business        Business                  @relation(fields: [businessId], references: [id])
  transactions    SubscriptionTransaction[]

  @@map("subscription_wallets")
}

model SubscriptionTransaction {
  id              String    @id @default(uuid())
  walletId        String
  type            String    // deposit, consumption, bonus, adjustment, refund, expiry
  amount          Decimal
  balanceBefore   Decimal
  balanceAfter    Decimal
  reference       String?   // subscriptionId, paymentId
  description     String?
  expiresAt       DateTime? // For bonus/promo credits
  createdAt       DateTime  @default(now())

  wallet          SubscriptionWallet @relation(fields: [walletId], references: [id])

  @@index([walletId])
  @@index([createdAt])
  @@map("subscription_transactions")
}
```

---

### LAYER 7 — Commerce Channels (4 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 35 | `commissions` | Rules, calculation, ledger, payouts | `CommissionRule`, `CommissionLedger`, `CommissionPayout` (exist) | `sales-network`, `subscriptions` |
| 36 | `qr-ordering` | **Modular** — codes, menus, orders, campaigns, analytics | QRCode (exist), `QRMenuItem` (new), `QROrder` (new), `QROrderItem` (new) | `catalog`, `businesses`, `sales` |
| 36a | `qr-ordering/qr-codes` | QR code generation, management | QRCode | — |
| 36b | `qr-ordering/qr-menus` | Digital menus linked to QR codes | `QRMenuItem` | `catalog` |
| 36c | `qr-ordering/qr-orders` | Orders placed via QR scan | `QROrder`, `QROrderItem` | `sales`, `qr-menus` |
| 36d | `qr-ordering/qr-campaigns` | Distribution campaigns | `DistributionCampaign` | `qr-codes` |
| 36e | `qr-ordering/qr-analytics` | Scan data, conversion, popular items | Computed | `qr-codes`, `qr-orders` |
| 37 | `sales-network` | Sales hierarchy, profiles, team tree | `SalesHierarchy`, `SalesProfile` (exist) | `users`, `leads`, `commissions` |
| 38 | `leads` | Lead capture, assignment, conversion | `Lead`, `LeadActivity`, `LeadAssignment` (exist) | `sales-network` |

---

### LAYER 8 — Extended Commerce (2 modules)

| # | Feature | Responsibility | DB Entities | Depends On |
|---|---------|---------------|-------------|------------|
| 39 | `onboarding` | Lead → workspace → business → active | Logic-based | `leads`, `workspaces`, `businesses` |
| 40 | `billing` | Subscription billing, invoices | Extends SubscriptionPayment | `subscriptions`, `payments` |

---

### LAYER 9 — Cross-Cutting & Settings (7 modules)

| # | Feature | Sub-modules | Depends On |
|---|---------|-------------|------------|
| 41 | `notifications` | In-app, email, SMS | none |
| 42 | `activities` | User action log — who/what/when/where | none |
| 43 | `audit-logs` | Compliance audit — before/after state, IP, user-agent | none |
| 44 | `uploads` | ImageKit file management | none |
| 45 | `settings` | business-, tax-, receipt-, numbering-, payment-, user- | `businesses` |

---

## Complete Model Map

### Existing Models (28) — Retained

User, Workspace, WorkspaceMember, Business, BusinessMode, Branch, Store, CatalogItem, Role, Permission, RolePermission, UserRole, SalesHierarchy, SalesProfile, Lead, LeadActivity, LeadAssignment, SubscriptionPlan, Subscription, SubscriptionPayment, CommissionRule, CommissionLedger, CommissionPayout, DistributionCampaign, QRCode, QRCodeAssignment, QRCodeInstallation, SupportTicket

### Existing CatalogItem — Enhanced

```prisma
model CatalogItem {
  id           String   @id @default(uuid())
  businessId   String
  name         String
  slug         String
  description  String?
  sku          String?
  barcode      String?
  itemType     CatalogItemType  // PRODUCT | SERVICE | MEDICINE | MENU_ITEM | RAW_MATERIAL | FINISHED_GOOD

  // Commerce-specific (nullable — used only when itemType=PRODUCT)
  categoryId   String?
  brandId      String?
  unitId       String?
  price        Decimal   @default(0)
  costPrice    Decimal?  @default(0)
  taxRate      Decimal?  @default(0)
  currency     String    @default("TZS")
  isService    Boolean   @default(false)
  trackStock   Boolean   @default(true)
  imageUrl     String?
  isActive     Boolean   @default(true)
  metadata     Json?

  business     Business             @relation(fields: [businessId], references: [id])
  category     Category?            @relation(fields: [categoryId], references: [id])
  brand        Brand?               @relation(fields: [brandId], references: [id])
  unit         Unit?                @relation(fields: [unitId], references: [id])
  variants     CatalogItemVariant[]
  images       CatalogItemImage[]
  assignments  CatalogItemAssignment[]
  balances     InventoryBalance[]
  createdBy    User?                @relation(fields: [createdById], references: [id])
  updatedBy    User?                @relation(fields: [updatedById], references: [id])

  @@unique([businessId, slug])
  @@unique([businessId, sku])
  @@index([businessId, itemType])
  @@map("catalog_items")
}
```

### New Models (51)

| # | Model | Feature | Key Fields |
|---|-------|---------|-----------|
| 1 | `CatalogItemVariant` | catalog | id, catalogItemId, name, sku, barcode, price, costPrice, attributes (Json), sortOrder |
| 2 | `CatalogItemImage` | catalog | id, catalogItemId, variantId?, url, alt, sortOrder |
| 3 | `CatalogItemAssignment` | catalog | id, businessId, catalogItemId, branchId?, storeId?, isAvailable, sortOrder |
| 4 | `Category` | catalog/categories | id, businessId, name, slug, parentId?, description, imageUrl, sortOrder, isActive |
| 5 | `Brand` | catalog/brands | id, businessId, name, slug, description, logoUrl, isActive |
| 6 | `Unit` | catalog/units | id, businessId, name, abbreviation, type (count/weight/volume/length), isBase |
| 7 | `PriceList` | catalog/pricing | id, businessId, name, type (retail/wholesale/promo), priority, startDate, endDate, isActive |
| 8 | `PriceListItem` | catalog/pricing | id, priceListId, catalogItemId, variantId?, unitPrice, minQuantity |
| 9 | `Staff` | staff | id, userId, businessId, employeeCode, position, hireDate, isActive |
| 10 | `StaffAssignment` | staff | id, staffId, level (business/branch/store), businessId, branchId?, storeId?, roleId?, isPrimary |
| 11 | `Customer` | customers | id, businessId, userId?, customerType (retail/wholesale/walk_in), firstName, lastName, email, phone, address, city, customerGroupId?, creditLimit, isActive |
| 12 | `CustomerGroup` | customer-groups | id, businessId, name, description, discountPercent, isDefault |
| 13 | `Supplier` | suppliers | id, businessId, supplierType (local/international), name, email, phone, address, city, country, taxId, paymentTerms, currency, isActive |
| 14 | `PaymentMethod` | payments | id, businessId, name, type (cash/card/mobile/bank/credit), isActive |
| 15 | `Payment` | payments | id, businessId, workspaceId?, branchId?, storeId?, paymentMethodId?, amount, reference, paidAt, status, saleId?, invoiceId?, customerCreditTxId?, subscriptionId?, purchaseId?, expenseId?, createdById |
| 16 | `Purchase` | purchases | id, workspaceId, businessId, branchId?, storeId?, supplierId, purchaseDate, reference, status, subtotal, tax, total, notes, createdById, staffId? |
| 17 | `PurchaseItem` | purchases | id, purchaseId, catalogItemId, variantId?, quantity, unitCost, subtotal |
| 18 | `PurchaseOrder` | purchase-orders | id, workspaceId, businessId, branchId?, supplierId, orderDate, expectedDate, status, subtotal, tax, total, notes, createdById, staffId? |
| 19 | `PurchaseOrderItem` | purchase-orders | id, purchaseOrderId, catalogItemId, variantId?, quantity, unitCost, receivedQuantity, subtotal |
| 20 | `GoodsReceived` | goods-received | id, workspaceId, businessId, branchId?, storeId?, purchaseOrderId?, receivedDate, reference, notes, createdById, staffId? |
| 21 | `GoodsReceivedItem` | goods-received | id, goodsReceivedId, catalogItemId, variantId?, expectedQuantity, receivedQuantity, unitCost |
| 22 | `InventoryLocation` | inventory | id, businessId, branchId?, storeId?, name, type (business/branch/store), isActive |
| 23 | `InventoryBalance` | inventory | id, locationId, catalogItemId, variantId?, quantityOnHand, quantityAvailable, quantityCommitted, reorderPoint, maxStock, batchNo?, expiryDate? |
| 24 | `StockMovement` | stock | id, locationId, catalogItemId, variantId?, quantityChange, balanceBefore, balanceAfter, reference, referenceType, notes, createdById |
| 25 | `StockAdjustment` | stock-adjustments | id, businessId, locationId, adjustmentDate, reason, status, notes, approvedById, createdById |
| 26 | `StockAdjustmentItem` | stock-adjustments | id, stockAdjustmentId, catalogItemId, variantId?, expectedQty, actualQty, difference, reason |
| 27 | `StockTransfer` | stock-transfers | id, businessId, fromLocationId, toLocationId, transferDate, status, notes, createdById |
| 28 | `StockTransferItem` | stock-transfers | id, stockTransferId, catalogItemId, variantId?, quantity, receivedQuantity |
| 29 | `Sale` | sales | id, workspaceId, businessId, branchId?, storeId?, customerId?, staffId?, saleDate, reference, status, subtotal, discountTotal, taxTotal, grandTotal, profitMargin, notes, createdById |
| 30 | `SaleItem` | sales | id, saleId, catalogItemId, variantId?, quantity, unitPrice, discount, subtotal, costPrice |
| 31 | `POSSession` | pos | id, businessId, storeId, openedById, closedById?, openedAt, closedAt, openingFloat, closingFloat, expectedAmount, actualAmount, difference, status |
| 32 | `Quotation` | quotations | id, workspaceId, businessId, branchId?, customerId?, createdById, staffId?, quoteDate, expiryDate, status, subtotal, tax, total, notes |
| 33 | `QuotationItem` | quotations | id, quotationId, catalogItemId, variantId?, quantity, unitPrice, discount, subtotal |
| 34 | `Invoice` | invoices | id, workspaceId, businessId, branchId?, customerId, saleId?, invoiceDate, dueDate, invoiceNumber, status, subtotal, tax, total, paidAmount, balanceDue, notes |
| 35 | `InvoiceItem` | invoices | id, invoiceId, catalogItemId?, description, quantity, unitPrice, subtotal |
| 36 | `Return` | returns | id, workspaceId, businessId, branchId?, storeId?, saleId, returnDate, reference, reason, status, refundAmount, refundMethod, notes |
| 37 | `ReturnItem` | returns | id, returnId, catalogItemId, variantId?, quantity, unitPrice, reason, condition |
| 38 | `Expense` | expenses | id, workspaceId, businessId, branchId?, storeId?, categoryId, amount, expenseDate, reference, description, paidTo, receiptUrl, status, createdById, approvedById, staffId? |
| 39 | `ExpenseCategory` | expense-categories | id, businessId, name, description, isActive |
| 40 | `CustomerCreditAccount` | customer-credit | id, businessId, customerId (unique), creditLimit, currentBalance, status |
| 41 | `CustomerCreditTransaction` | customer-credit | id, accountId, type, amount, balanceBefore, balanceAfter, reference, description, createdById |
| 42 | `CashRegister` | cash-management | id, businessId, branchId?, storeId?, name, type (main/petty_cash/till), currency, openingBalance, currentBalance, isActive |
| 43 | `CashTransaction` | cash-management | id, registerId, type, amount, balanceBefore, balanceAfter, reference, description, performedById |
| 44 | `SubscriptionWallet` | subscriptions/wallet | id, businessId (unique), balance, totalDeposited, totalConsumed, bonusBalance |
| 45 | `SubscriptionTransaction` | subscriptions/wallet | id, walletId, type, amount, balanceBefore, balanceAfter, reference, description, expiresAt? |
| 46 | `Notification` | notifications | id, userId, title, message, type, referenceType, referenceId, isRead, readAt, createdAt |
| 47 | `Activity` | activities | id, userId, action, resourceType, resourceId, metadata (Json), ipAddress, userAgent, createdAt |
| 48 | `AuditLog` | audit-logs | id, userId, action, resourceType, resourceId, before (Json), after (Json), ipAddress, userAgent, createdAt |
| 49 | `Upload` | uploads | id, businessId, uploadedById, fileName, fileUrl, fileId, thumbnailUrl, size, mimeType, folder, tags |
| 50 | `Setting` | settings | id, businessId?, userId?, key, value, type, description, isPublic |
| 51 | `QROrder` | qr-ordering/qr-orders | id, businessId, qrCodeId, customerId?, orderDate, status, subtotal, tax, total, notes |
| 52 | `QROrderItem` | qr-ordering/qr-orders | id, qrOrderId, catalogItemId, quantity, unitPrice, subtotal |
| 53 | `QRMenuItem` | qr-ordering/qr-menus | id, businessId, qrCodeId, catalogItemId, isAvailable, sortOrder, price |


**Total: 28 existing + 53 new = 81 models**

---

## Dependency Graph

```
enkai (no deps, calls all domain services via tool interface)
├── auth → users
├── permissions (no deps)
├── roles → permissions
│   ├── users → auth, roles
│   ├── workspaces → users
│   │   └── businesses → workspaces
│   │       ├── categories → businesses
│   │       ├── brands → businesses
│   │       ├── units → businesses
│   │       ├── expense-categories → businesses
│   │       ├── branches → businesses
│   │       │   └── stores → branches
│   │       ├── customer-groups → businesses
│   │       │   └── customers → businesses, customer-groups
│   │       ├── suppliers → businesses
│   │       ├── staff → users, businesses, branches, stores, roles
│   │       ├── catalog → businesses, categories, brands, units, branches, stores
│   │       │   ├── products → catalog (itemType=PRODUCT filter)
│   │       │   ├── pricing → products, customer-groups
│   │       │   ├── inventory → catalog, stores (InventoryLocation)
│   │       │   │   ├── stock → inventory
│   │       │   │   ├── stock-adjustments → inventory
│   │       │   │   └── stock-transfers → inventory
│   │       │   ├── sales → catalog, customers, stores, payments, staff
│   │       │   │   ├── pos → sales, stores, payments, staff
│   │       │   │   ├── quotations → catalog, customers
│   │       │   │   ├── invoices → sales, customers, payments
│   │       │   │   └── returns → sales, inventory, payments
│   │       │   ├── purchases → suppliers, catalog, stores, payments
│   │       │   ├── purchase-orders → suppliers, catalog
│   │       │   │   └── goods-received → purchase-orders, inventory
│   │       │   ├── customer-credit → customers, payments
│   │       │   ├── cash-management → businesses, stores, staff
│   │       │   └── qr-ordering → catalog, businesses, sales
│   │       ├── payments → businesses (independent, polymorphic)
│   │       ├── expenses → expense-categories, staff
│   │       ├── subscriptions → businesses, payments
│   │       │   └── wallet → subscriptions
│   │       ├── sales-network → users
│   │       │   ├── leads → sales-network
│   │       │   │   └── onboarding → leads, workspaces, businesses
│   │       │   └── commissions → sales-network, subscriptions
│   │       └── settings → businesses (modular)
│   ├── notifications (no deps)
│   ├── activities (no deps)
│   ├── audit-logs (no deps)
│   ├── uploads (no deps)
│   └── reports → all Commerce modules (domain-driven)
│       └── dashboards → reports
```

---

## Implementation Phases

### Phase A — Prisma Schema
1. Add 53 new models to `prisma/schema.prisma`
2. Enhance CatalogItem with new FKs and relations
3. Replace flat `Inventory` with `InventoryLocation` + `InventoryBalance`
4. Add hierarchy fields (workspaceId, branchId, storeId) to all transactional models
5. Run `prisma generate` and `prisma db push`
6. Verify `tsc --noEmit` — zero errors

### Phase B — Foundation Features
Build: `enkai`, `permissions`, `roles`, `auth`, `users`, `staff`, `workspaces`, `businesses`, `branches`, `stores`
- Migrate existing services/actions/types/validations into feature structure

### Phase C — Catalog Domain
Build: `catalog` with sub-features `products/`, `categories/`, `brands/`, `units/`, `pricing/`, `assignments/`

### Phase D — Commerce Foundation
Build: `customers`, `customer-groups`, `suppliers`, `payments`, `inventory`, `stock`

### Phase E — Procurement
Build: `purchases`, `purchase-orders`, `goods-received`, `stock-adjustments`, `stock-transfers`

### Phase F — Sales & Revenue
Build: `sales`, `pos`, `quotations`, `invoices`, `returns`, `expenses`, `expense-categories`

### Phase G — Financial
Build: `customer-credit`, `cash-management`

### Phase H — Commerce Channels
Build: `subscriptions` (plans, wallet, transactions, payments), `sales-network`, `leads`, `onboarding`, `commissions`, `qr-ordering` (codes, menus, orders, campaigns, analytics)

### Phase I — Intelligence & Cross-Cutting
Build: `reports` (domain-driven sub-modules), `dashboards`, `settings` (modular), `notifications`, `activities`, `audit-logs`, `uploads`

### Phase J — Migration & Verification
1. Migrate all existing `src/server/actions/*` → feature actions
2. Migrate all existing `src/server/services/*` → feature services
3. Migrate `src/types/*` → feature types
4. Migrate `src/lib/validations/*` → feature schemas
5. `tsc --noEmit` — zero errors
6. Update seed script for all 81 models
7. Run seed — verify data integrity

---

## Domain Map Summary

| Domain | Layer | Owns | Key Principle |
|--------|-------|------|---------------|
| auth | 0 | Better Auth | Phone/email/username login |
| users | 0 | User (Prisma) | No tenantId on User |
| workspaces | 0 | Workspace, WorkspaceMember | Multi-tenant via membership |
| businesses | 0 | Business, BusinessMode | Hierarchy root |
| branches | 0 | Branch | Optional hierarchy level |
| stores | 0 | Store | Optional hierarchy level |
| staff | 0 | Staff, StaffAssignment | Business/branch/store levels |
| roles | 0 | Role, Permission, UserRole | Dynamic RBAC |
| permissions | 0 | Permission | Module+action pairs |
| enkai | 0 | None (cross-domain) | Calls all domain services |
| catalog | 1 | CatalogItem, variants, images, assignments | Universal domain — no Product model |
| inventory | 2 | InventoryLocation, InventoryBalance | Belongs to location, not product |
| stock | 2 | StockMovement | Ledger for every QTY change |
| stock-adjustments | 2 | StockAdjustment, StockAdjustmentItem | Corrections |
| stock-transfers | 2 | StockTransfer, StockTransferItem | Inter-location moves |
| customers | 2 | Customer | Retail/wholesale/walk-in |
| customer-groups | 2 | CustomerGroup | Segmentation |
| suppliers | 2 | Supplier | Local/international |
| payments | 2 | Payment, PaymentMethod | Independent, polymorphic |
| purchases | 3 | Purchase, PurchaseItem | Full hierarchy |
| purchase-orders | 3 | PurchaseOrder, PurchaseOrderItem | Procurement pipeline |
| goods-received | 3 | GoodsReceived, GoodsReceivedItem | Inventory trigger |
| sales | 4 | Sale, SaleItem | Workspace→Business→Branch→Store→Staff→Customer |
| pos | 4 | POSSession | Till operations |
| quotations | 4 | Quotation, QuotationItem | Pre-sales |
| invoices | 4 | Invoice, InvoiceItem | Billing |
| returns | 4 | Return, ReturnItem | Reverse sale |
| expenses | 4 | Expense | Operational costs |
| expense-categories | 4 | ExpenseCategory | Cost grouping |
| customer-credit | 4 | CustomerCreditAccount, CustomerCreditTransaction | Buy-now-pay-later |
| cash-management | 4 | CashRegister, CashTransaction | Independent from POS |
| reports | 5 | Computed | Domain-driven sub-modules |
| dashboards | 5 | UI only | Role-specific views |
| subscriptions | 6 | Plan, Wallet, Transaction, Payment | Flexible billing |
| commissions | 7 | Rule, Ledger, Payout | Sales compensation |
| qr-ordering | 7 | QRCode, QROrder, QRMenuItem, Campaign | Strategic channel |
| sales-network | 7 | SalesHierarchy, SalesProfile | Team management |
| leads | 7 | Lead, Activity, Assignment | Pipeline |
| onboarding | 7 | Logic-based | Lead→Active Customer |
| billing | 8 | Extends subscription | Revenue collection |
| notifications | 9 | Notification | Alerts |
| activities | 9 | Activity | Who/What/When |
| audit-logs | 9 | AuditLog | Before/after + IP |
| uploads | 9 | Upload | ImageKit |
| settings | 9 | Setting | 6 modular sub-domains |

---

## Feature Module Template

```
feature-name/
├── actions/       # "use server" functions
├── components/    # Reusable UI components
├── services/      # Business logic (also exposed for Enkai tool interface)
├── schemas/       # Zod validation schemas
├── types/         # TypeScript types
├── constants/     # Constants and enums
├── hooks/         # React hooks (mobile-first)
├── store/         # Zustand store (when needed)
├── utils/         # Utilities (when needed)
└── index.ts       # Barrel exports
```

**Omission rule**: A sub-directory may be omitted only if genuinely empty. Document reasons in index.ts.

Every service layer must expose a clean interface so Enkai's tool layer can consume it without UI coupling.

---

## RBAC Model

| Scope | Level | Examples |
|-------|-------|----------|
| Platform | Super Admin, Support Agent, Finance Officer | All businesses, system config |
| Business | Owner, Manager, Accountant | Single business operations |
| Branch | Branch Manager | Single branch operations |
| Store | Store Manager, Cashier | Single store operations |

Roles are dynamic (database-driven). Permissions follow the pattern `{module}.{action}` (e.g., `sales.create`, `inventory.read`, `products.manage`).

---

## Key Architectural Rules (Final)

1. **Business Hierarchy**: Workspace → Business → Branch → Store. All modules respect this.
2. **Multi-Tenant**: Never tenantId on User. Use WorkspaceMember.
3. **UUIDs**: All primary keys are UUIDs. No auto-increment.
4. **CatalogItem**: Universal domain. No Product model. All FKs use `catalogItemId`.
5. **UI terminology**: "Products" to users, "CatalogItem" in database.
6. **Commerce-Only**: Only RETAIL, WHOLESALE, RETAIL+WHOLESALE. No other industries.
7. **Staff Foundation**: Every Commerce operation depends on staff.
8. **Payments Independent**: Shared domain. Not under Sales.
9. **Financial Domains**: Sales, Payments, Expenses, Customer Credit, Cash Management, Subscriptions — all separate.
10. **Inventory Location**: Inventory belongs to locations (Business/Branch/Store), not to products.
11. **Sale Hierarchy**: Record workspaceId, businessId, branchId, storeId, staffId, customerId from day one.
12. **Enkai First-Class**: Cross-domain tool interface. No UI coupling.
13. **Auditability**: Track who, what, when, where for every critical action.
14. **QR Strategic**: Prepare codes, menus, orders, campaigns, analytics architecture.
15. **Mobile First**: Design for Android smartphone → tablet → desktop.
16. **No Empty Folders**: Every feature directory has real implementation.
17. **Settings Modular**: 6 sub-domains. Not one large module.
18. **Reports Domain-Driven**: Each domain has its own report sub-module.
