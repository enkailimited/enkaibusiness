# Enkai Business Platform — Enterprise Architecture Review & Redesign

_Principal SaaS Architecture Assessment_

---

## 1. Executive Summary

**Platform**: Enkai Business Platform  
**Current State**: Commerce-optimized ERP with multi-industry ambitions  
**Architecture Maturity**: Early-stage modular monolith  
**Primary Gap**: Business Type abstraction layer does not exist; domains are interleaved with Commerce concerns

The current codebase is well-structured for a single vertical (Commerce) but lacks the architectural
boundaries needed to support Healthcare, Agriculture, Manufacturing, Mining, Logistics, Education,
or Hospitality without significant rework. This review identifies all gaps and provides a complete
DDD-driven redesign.

---

## 2. Current Architecture Analysis

### 2.1 Strengths

- Consistent module pattern: `actions/`, `components/`, `constants/`, `schemas/`, `services/`, `types/`
- Clean route separation: `platform/` (admin), `workspaces/` (tenant), public
- Subscription/wallet engine is well isolated
- Sales network (hierarchy + leads + commissions) is cleanly bounded
- Prisma schema has proper indexes, UUIDs, snake_case mapping
- AI assistant (Firdaus) is modular with workflows, memory, voice, tools

### 2.2 Critical Architectural Gaps

| Gap | Severity | Impact |
|-----|----------|--------|
| No Business Type abstraction | Critical | Every new industry requires schema duplication |
| Domains coupled to Commerce | Critical | Inventory, POS, Purchasing tied to Commerce assumptions |
| Industry enum is flat enum, not model | High | Cannot add industry-specific fields/behaviors |
| Payment verification not modeled | High | QR Commerce requires payment confirmation workflow |
| Delivery system does not exist | High | QR Commerce requires delivery agents, routes, POD |
| Customer portal / login does not exist | High | Customers cannot self-serve |
| No billing/invoicing engine proper | Medium | Invoices exist but no AR aging, dunning, etc |
| No treasury / multi-currency engine | Medium | TZS-only, no FX, no bank reconciliation |
| No HR / payroll module | Medium | Staff exists but no time tracking, payroll |
| No analytics / BI data pipeline | Medium | Reports are basic, no data warehouse |
| No webhook / integration engine | Low | No REST API for 3rd party integrations |
| No multi-tenancy tenant isolation | Low | Schema-level tenant via businessId, no DB isolation |

### 2.3 Current Module-to-Domain Mapping

```
Current Feature                    Domain                    Business Type
─────────────────────────────────  ────────────────────────  ────────────────
auth, users, workspaces            Platform Core             ALL
businesses, branches, stores       Platform Core             ALL
staff, roles, permissions          Platform Core             ALL
notifications, settings            Platform Core             ALL
uploads, activities, audit-logs    Platform Core             ALL
subscriptions, wallet              Platform Core (Billing)   ALL
support-tickets                    Platform Core             ALL
catalog (products, brands, ...)    Commerce Catalog          Commerce only
inventory, stock, adjustments      Commerce Inventory        Commerce only
sales, pos, returns                Commerce POS              Commerce only
purchases, purchase-orders         Commerce Procurement      Commerce only
goods-received                     Commerce Procurement      Commerce only
invoices, quotations               Commerce Billing          Commerce only
payments, cash-management          Commerce Finance          Commerce only
customers, customer-groups         Commerce CRM              Commerce only
customer-credit                    Commerce CRM              Commerce only
expenses, expense-categories       Commerce Finance          Commerce only
leads, sales-network               Sales Network (Platform)  Platform
commissions                        Sales Network (Platform)  Platform
qr-ordering, qr-codes, qr-menus    QR Commerce               Commerce only
email-campaigns                    Platform Comms            Platform
firdaus (AI)                       AI Platform               ALL
```

**Problem**: `Inventory`, `Purchasing`, `Payments`, `Invoicing`, `Expenses`, `Customers` are all
modeled as Commerce-specific but many of these are actually shared patterns needed by all industries.
A Hospital needs invoicing, payments, and customers. A Farm needs purchases and expenses.

---

## 3. Proposed Architecture: Business-Type-Driven DDD

### 3.1 High-Level Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PLATFORM CORE                                      │
│  Auth | Workspace | Users | Roles/Permissions | Notifications            │
│  Settings | Uploads | Audit | Activity | Webhooks | API Gateway          │
├─────────────────────────────────────────────────────────────────────────┤
│                        SHARED MODULES                                     │
│  Subscription Billing | Wallet | Support Tickets | File Management       │
│  Email/SMS Engine | AI Assistant | Reports/BI | Analytics               │
│  CRM (Customer Mgmt) | Financial Core (GL, AR, AP, Treasury)            │
├─────────────────────────────────────────────────────────────────────────┤
│                     BUSINESS TYPE LAYER                                   │
│                                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Commerce │  │Healthcare│  │Agriculture│  │Manufact. │  ...            │
│  │          │  │          │  │          │  │          │                 │
│  │ Retail   │  │ Clinic   │  │ Farm     │  │ Factory  │                 │
│  │ Wholesale│  │ Pharmacy │  │ Co-op    │  │ Workshop │                 │
│  │ Both     │  │ Hospital │  │          │  │          │                 │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘                 │
├─────────────────────────────────────────────────────────────────────────┤
│                     INDUSTRY EXTENSIONS                                   │
│  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ QR Commerce  │  │Patients  │  │Crops     │  │ BOM      │             │
│  │ Delivery     │  │Appts     │  │Harvests  │  │ProdOrd   │             │
│  │ CustomerPort │  │MedRec    │  │Farms     │  │WorkCntr  │             │
│  └──────────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BOUNDED CONTEXT MAP                               │
│                                                                         │
│  ┌─────────────────────┐   ┌─────────────────────┐                     │
│  │ Identity & Access   │   │ Workspace & Org      │                     │
│  │ (User, Auth, Role)  │──▶│ (Workspace, Business, │                     │
│  │                     │   │  Branch, Store)       │                     │
│  └─────────────────────┘   └──────────┬──────────┘                     │
│                                       │                                 │
│  ┌─────────────────────┐   ┌──────────▼──────────┐                     │
│  │ Subscription/Billing│   │ Shared CRM           │                     │
│  │ (Plan, Sub, Wallet) │   │ (Customer, Group,    │                     │
│  │                     │   │  Contact, Address)   │                     │
│  └─────────────────────┘   └─────────────────────┘                     │
│                                                                         │
│  ┌─────────────────────┐   ┌─────────────────────┐                     │
│  │ Financial Core       │   │ Catalog Core         │                     │
│  │ (GL, AP, AR,        │   │ (Item, Category,     │                     │
│  │  Treasury, Tax)      │   │  Brand, Unit, Price) │                     │
│  └─────────────────────┘   └─────────────────────┘                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ COMMERCE CONTEXT                                                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │ POS/Sales│ │Inventory │ │Procurement│ │ Billing  │           │    │
│  │  │ (Sale,   │ │(Location,│ │(Purchase, │ │ (Invoice,│           │    │
│  │  │  Return)  │ │ Balance, │ │  PO, GR)  │ │  Quote)  │           │    │
│  │  └──────────┘ │ Movement)│ └──────────┘ └──────────┘           │    │
│  │               └──────────┘                                      │    │
│  │  ┌────────────────────┐ ┌─────────────────────┐                 │    │
│  │  │ QR Commerce (Order,│ │ Delivery (Agent,    │                 │    │
│  │  │ Payment, Storefront│ │ Vehicle, Route, POD)│                 │    │
│  │  └────────────────────┘ └─────────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌─────────────────────┐   ┌─────────────────────┐                     │
│  │ Sales Network        │   │ Support              │                     │
│  │ (Hierarchy, Profile, │   │ (Ticket, Priority,   │                     │
│  │  Lead, Commission)   │   │  Assignment)         │                     │
│  └─────────────────────┘   └─────────────────────┘                     │
│                                                                         │
│  ┌─────────────────────┐   ┌─────────────────────┐                     │
│  │ Communication        │   │ AI/Intelligence      │                     │
│  │ (Email, SMS, Notif,  │   │ (Firdaus, Workflows,  │                     │
│  │  Campaign)           │   │  Memory, Insights)   │                     │
│  └─────────────────────┘   └─────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Missing Business Type Architecture

### 4.1 Current Problem

The schema has:
```prisma
enum Industry {
  COMMERCE HEALTHCARE RESTAURANT MANUFACTURING AGRICULTURE SERVICES
}
```

This is a static enum — it cannot carry industry-specific configuration, modules,
pricing rules, or compliance requirements.

### 4.2 Required: Business Type as a First-Class Model

```prisma
model BusinessType {
  id          String   @id @default(uuid())
  slug        String   @unique  // "commerce", "healthcare", "agriculture", etc.
  name        String
  description String?
  isActive    Boolean  @default(true)

  // Each business type defines its own available modes
  definedModes    BusinessTypeMode[]     // e.g. Commerce → retail, wholesale, both
  definedModules  BusinessTypeModule[]   // e.g. Commerce → pos, inventory, procurement
  businesses      Business[]             // Businesses of this type

  @@map("business_types")
}

model BusinessTypeMode {
  id              String   @id @default(uuid())
  businessTypeId  String   @map("business_type_id")
  mode            String   // "retail", "wholesale", "both", "clinic", "hospital", etc.
  label           String
  description     String?

  businessType    BusinessType @relation(fields: [businessTypeId], references: [id])

  @@unique([businessTypeId, mode])
  @@map("business_type_modes")
}

model BusinessTypeModule {
  id              String   @id @default(uuid())
  businessTypeId  String   @map("business_type_id")
  moduleSlug      String   // "pos", "inventory", "patients", "crops", "bom", etc.
  isRequired      Boolean  @default(false)
  sortOrder       Int      @default(0)

  businessType    BusinessType @relation(fields: [businessTypeId], references: [id])

  @@unique([businessTypeId, moduleSlug])
  @@map("business_type_modules")
}
```

Then on the Business model, replace the enum with:

```prisma
model Business {
  ...
  businessTypeId  String?   @map("business_type_id")
  businessType    BusinessType? @relation(fields: [businessTypeId], references: [id])
  modes           BusinessMode[]
  ...
}
```

This allows:
- Adding new industries without schema changes
- Industry-specific pricing rules
- Industry-specific module provisioning
- Industry-specific UI routing and permission sets

---

## 5. Complete Domain-by-Domain Gap Analysis

### 5.1 Platform Core — SHARED (ALL Business Types)

| Module | Status | Gaps |
|--------|--------|------|
| Authentication | ✅ Complete | MFA, OAuth social login, SSO |
| User Management | ✅ Complete | User profile, invite, password reset |
| Workspace | ✅ Complete | Multi-member with OWNER/ADMIN/MEMBER/GUEST |
| Business | ⚠️ Partial | Needs BusinessType model, not enum |
| Branch/Store | ✅ Complete | Location hierarchy |
| Staff | ✅ Complete | Assignment to branch/store/role |
| Roles/Permissions | ✅ Complete | RBAC with PLATFORM/BUSINESS scope |
| Notifications | ⚠️ Partial | In-app works; SMS/email channels need completion |
| Settings | ✅ Complete | Key-value per business/user |
| Uploads | ✅ Complete | ImageKit integration |
| Activities | ✅ Complete | Activity log with metadata |
| Audit Logs | ✅ Complete | Before/after snapshots |

**Missing from Platform Core**:
- **Webhook Engine** — Outgoing webhooks for 3rd party integrations
- **API Gateway / Public REST API** — No public API exists
- **Multi-Tenant Admin Console** — Complete platform admin for all tenants
- **Tenant Onboarding Wizard** — Automated provisioning pipeline
- **Feature Flags** — Per-business-type/per-plan feature gating
- **Data Export/Import** — CSV/Excel bulk operations

### 5.2 Shared Modules — ALL Business Types

| Module | Status | Gaps |
|--------|--------|------|
| Subscription Billing | ✅ Complete | Plans, subscriptions, wallet, deposit requests |
| Wallet | ✅ Complete | Balance, transactions, deposits |
| CRM (Customer) | ⚠️ Partial | Customer exists but no full CRM |
| Support Tickets | ✅ Complete | CRUD with assignment, priority |
| AI Assistant (Firdaus) | ✅ Complete | Workflows, memory, voice, automation |
| Reports | ⚠️ Partial | Basic reports exist, no BI/dashboard builder |
| Email/SMS | ⚠️ Partial | SMTP config, templates, campaigns — partially built |
| File Management | ✅ Complete | Uploads with ImageKit |

**Missing from Shared Modules**:
- **General Ledger (CoA)** — Chart of accounts, journals, double-entry bookkeeping
- **Accounts Payable** — Full AP with aging, payment scheduling, reconciliation
- **Accounts Receivable** — Full AR with aging, dunning letters, collections
- **Treasury / Cash Management** — Bank accounts, reconciliation, cash forecasting
- **Tax Engine** — Multi-tax (VAT, sales tax, withholding), tax reporting
- **Multi-Currency** — FX rates, currency conversion, revaluation
- **Contract / Agreement Management** — Customer/supplier contracts
- **Document Management** — Contract storage, versioning, approval workflows
- **Compliance / Audit Trail** — Regulatory compliance tracking

### 5.3 Commerce Module — CURRENT FOCUS

| Sub-module | Status | Gaps |
|------------|--------|------|
| Catalog (Products) | ✅ Complete | Items, variants, images, assignments, price lists |
| Categories | ✅ Complete | Hierarchical |
| Brands | ✅ Complete | |
| Units | ✅ Complete | With conversions |
| POS / Sales | ⚠️ Partial | Sale creation exists; no offline POS, no receipt printing, no barcode scanning |
| Inventory | ⚠️ Partial | Location/balance/movement works; no FIFO/LIFO costing, no cycle count workflow |
| Purchasing | ⚠️ Partial | Purchase + PO + GR works; no automated reorder |
| Suppliers | ✅ Complete | |
| Customers | ⚠️ Partial | No customer portal, no login, no self-service |
| Customer Groups | ✅ Complete | With discount percentages |
| Customer Credit | ✅ Complete | Credit accounts, transactions |
| Invoices | ⚠️ Partial | Basic invoicing; no recurring invoices, no automated dunning |
| Quotations | ✅ Complete | |
| Returns | ✅ Complete | |
| Expenses | ✅ Complete | Categories, approval workflow |
| Cash Management | ✅ Complete | Registers, transactions |
| Payments | ⚠️ Partial | Payment recording works; no payment gateway integration, no reconciliation |
| POS Sessions | ✅ Complete | Opening/closing floats |

### 5.4 QR Commerce — MAJOR GAPS

| Sub-module | Status | Gaps |
|------------|--------|------|
| QR Code Generation | ✅ Complete | Campaigns, code generation |
| QR Code Assignment/Installation | ✅ Complete | Assignment and installation tracking |
| QR Public Menu (Read-only) | ✅ Complete | Customer scans → sees menu |
| QR Menu Management | ✅ Complete | Admin selects items per QR code |

**CRITICAL MISSING for QR Commerce**:

| Feature | Why Needed |
|---------|-----------|
| **Order Engine** | Customer must place orders (not just view a menu). Order model with status pipeline. |
| **Cart/Session** | Customer must add items to cart, review, checkout. |
| **Payment at Order** | Customer chooses payment method at order time. |
| **Payment Verification** | Mobile money requires reference verification; cash requires agent confirmation. |
| **Delivery Agents** | Agents assigned to deliver orders. |
| **Vehicles** | Vehicle tracking for deliveries. |
| **Routes** | Delivery route planning. |
| **Proof of Delivery** | Photo or signature confirmation. |
| **Customer Account/Login** | Customer registers, logs in, views order history. |
| **Order Tracking** | Customer tracks order in real time. |
| **Customer Portal** | Full self-service portal (orders, payments, statements, credit). |
| **Unpaid Debt Mgmt** | Unpaid/partial payments tracked as customer debt. |

### 5.5 Financial Core — MAJOR GAPS

| Feature | Status |
|---------|--------|
| Chart of Accounts | ❌ Missing |
| Double-Entry Journals | ❌ Missing |
| General Ledger | ❌ Missing |
| Accounts Payable Aging | ❌ Missing |
| Accounts Receivable Aging | ❌ Missing |
| Bank Reconciliation | ❌ Missing |
| Multi-Currency | ❌ Missing (TZS hardcoded) |
| Tax Engine (VAT, withholding) | ❌ Missing (taxRate field exists but no engine) |
| Financial Reports (P&L, Balance Sheet) | ❌ Missing |
| Budgeting / Forecasting | ❌ Missing |
| Fixed Assets Register | ❌ Missing |
| Deferred Revenue | ❌ Missing |

### 5.6 Delivery System — ENTIRELY MISSING

| Entity | Need |
|--------|------|
| `DeliveryAgent` | Person who delivers orders |
| `Vehicle` | Car, bike, truck used for delivery |
| `DeliveryAssignment` | Links order → agent → vehicle |
| `DeliveryRoute` | Planned route for multiple deliveries |
| `ProofOfDelivery` | Photo, signature, or PIN confirmation |
| `DeliveryZone` | Geographic zones for routing |
| `DeliveryFee` | Fee calculation based on distance/weight/zone |

### 5.7 Customer Portal — ENTIRELY MISSING

| Feature | Need |
|---------|------|
| Customer Registration (self) | Customers register via QR or web |
| Customer Login | Auth for customers |
| Customer Dashboard | Order history, statements, credit balance |
| Address Management | Multiple delivery addresses |
| Order Placement | Cart → checkout → payment → confirmation |
| Order Tracking | Real-time status updates |
| Payment History | Past payments, receipts |
| Credit Statement | If customer has credit account |

### 5.8 Missing for Future Industries

#### Healthcare
| Entity | Need |
|--------|------|
| `Patient` | Extended customer with medical fields |
| `Appointment` | Scheduling with practitioners |
| `MedicalRecord` | Diagnoses, prescriptions, test results |
| `Practitioner` | Doctor/nurse with licenses, specializations |
| `Consultation` | Visit records |
| `Prescription` | Medications prescribed |
| `Ward/Room` | Inpatient management |
| `InsuranceClaim` | Insurance billing |

#### Agriculture
| Entity | Need |
|--------|------|
| `Farm` | Land parcels, GPS coordinates |
| `Crop` | Crop types, varieties, seasons |
| `Planting` | Planting records with dates, area, seed type |
| `Harvest` | Harvest records with yield, quality |
| `Field` | Field/plot management |
| `InputApplication` | Fertilizer, pesticide, irrigation records |
| `Livestock` | Animal tracking, health records, breeding |

#### Manufacturing
| Entity | Need |
|--------|------|
| `BillOfMaterial` | Product structure with components |
| `ProductionOrder` | Manufacturing batch orders |
| `WorkCenter` | Machines, production lines |
| `Routing` | Step-by-step manufacturing process |
| `QualityCheck` | QC inspections |
| `MaintenanceSchedule` | Equipment maintenance |

#### Mining
| Entity | Need |
|--------|------|
| `Mine` | Mining site |
| `ProductionShift` | Shift-based production recording |
| `CrushingRecord` | Crushing plant throughput |
| `WeighbridgeTicket` | Weight measurements for trucks |
| `Fleet` | Trucks, loaders, excavators |
| `ExportShipment` | Export documentation, customs |

---

## 6. Complete Bounded Context / Domain Model

### 6.1 Platform Core Contexts

```yaml
Identity & Access:
  Entities: User (already exists), Session, Account, Verification
  Value Objects: Email, Phone, Username, Password
  Aggregates: User (root)
  Services: AuthService, SessionService, PasswordResetService
  Domain Events: UserRegistered, UserLoggedIn, PasswordChanged

Workspace & Organization:
  Entities: Workspace, WorkspaceMember, Business, BusinessType,
            BusinessTypeMode, BusinessTypeModule, BusinessMode,
            Branch, Store, Staff, StaffAssignment
  Value Objects: Slug, Currency, Timezone, Address
  Aggregates: Workspace (root), Business (root)
  Services: WorkspaceService, BusinessService, StaffService

Roles & Permissions:
  Entities: Role, Permission, RolePermission, UserRole
  Aggregates: Role (root)
  Services: RBACService, PermissionService
  Domain Events: RoleAssigned, PermissionGranted
```

### 6.2 Shared Module Contexts

```yaml
Subscription Billing:
  Entities: SubscriptionPlan, Subscription, SubscriptionPayment,
            SubscriptionWallet, SubscriptionTransaction, WalletDepositRequest
  Aggregates: Subscription (root), SubscriptionWallet (root)
  Services: PlanService, SubscriptionService, WalletService
  Domain Events: SubscriptionStarted, SubscriptionSuspended,
                 WalletDeposited, WalletConsumed

Support:
  Entities: SupportTicket
  Value Objects: TicketStatus, TicketPriority
  Aggregates: SupportTicket (root)
  Services: TicketService

Notifications:
  Entities: Notification, NotificationPreference
  Aggregates: Notification (root)
  Services: NotificationService, EmailService, SMSService

Communication:
  Entities: EmailConfig, EmailTemplate, EmailLog, Campaign,
            CampaignSegment, CampaignRecipient
  Aggregates: Campaign (root)
  Services: CampaignService, TemplateService, EmailQueueService

AI / Intelligence:
  Entities: FirdausWorkflow, BusinessMemory
  Aggregates: FirdausWorkflow (root)
  Services: AssistantService, InsightsEngine, ForecastEngine
```

### 6.3 Shared Financial Contexts (NEW — must be built)

```yaml
General Ledger:
  Entities: Account (CoA), JournalEntry, JournalLine
  Value Objects: AccountCode, AccountType (Asset/Liability/Equity/Revenue/Expense)
  Aggregates: JournalEntry (root)
  Services: LedgerService, AccountService
  Domain Events: JournalPosted, AccountBalanceChanged

Accounts Receivable:
  Entities: Receivable (extends Invoice), PaymentAllocation, DunningLetter
  Aggregates: Receivable (root)
  Services: ARService, AgingService, DunningService

Accounts Payable:
  Entities: Payable, PaymentSchedule, VendorCredit
  Aggregates: Payable (root)
  Services: APService, PaymentRunService

Treasury:
  Entities: BankAccount, BankTransaction, ReconciliationRule
  Aggregates: BankAccount (root)
  Services: ReconciliationService, CashForecastService

Tax:
  Entities: TaxRate, TaxRule, TaxReport
  Aggregates: TaxRate (root)
  Services: TaxCalculationService, TaxReportingService
```

### 6.4 Commerce Contexts

```yaml
Catalog:
  Entities: CatalogItem, CatalogItemVariant, CatalogItemImage,
            Category, Brand, Unit, UnitConversion,
            CatalogItemAssignment, PriceList, PriceListItem
  Aggregates: CatalogItem (root), PriceList (root)
  Services: CatalogService, PriceListService, BrandService, etc.
  Domain Events: ItemCreated, ItemPriceChanged, StockTracked

POS / Sales:
  Entities: Sale, SaleItem, POSSession
  Value Objects: PricingTier, SaleStatus
  Aggregates: Sale (root), POSSession (root)
  Services: SaleService, POSSessionService
  Domain Events: SaleCompleted, SaleRefunded, POSSessionClosed

Inventory:
  Entities: InventoryLocation, InventoryBalance, StockMovement,
            StockAdjustment, StockAdjustmentItem,
            StockTransfer, StockTransferItem
  Aggregates: InventoryLocation (root)
  Services: BalanceService, StockService, TransferService,
            ReorderService
  Domain Events: StockAdjusted, StockTransferred, LowStockAlert

Procurement:
  Entities: Purchase, PurchaseItem, PurchaseOrder, PurchaseOrderItem,
            GoodsReceived, GoodsReceivedItem, Supplier
  Aggregates: PurchaseOrder (root), Purchase (root)
  Services: PurchaseService, PurchaseOrderService, GoodsReceivedService
  Domain Events: POApproved, GoodsReceived, PurchaseCompleted

Commerce Billing:
  Entities: Invoice, InvoiceItem, Quotation, QuotationItem, Return, ReturnItem
  Aggregates: Invoice (root), Quotation (root)
  Services: InvoiceService, QuotationService, ReturnService
  Domain Events: InvoiceSent, InvoicePaid, QuotationAccepted

Commerce CRM:
  Entities: Customer, CustomerGroup, CustomerCreditAccount,
            CustomerCreditTransaction
  Aggregates: Customer (root), CustomerCreditAccount (root)
  Services: CustomerService, CreditService, GroupService

Cash Management:
  Entities: CashRegister, CashTransaction
  Aggregates: CashRegister (root)
  Services: CashService, RegisterService
```

### 6.5 QR Commerce Contexts (NEW — must be extended)

```yaml
QR Commerce:
  Entities: QRCode (exists), QRMenuItem (exists),
            QRCodeAssignment (exists), QRCodeInstallation (exists),
            DistributionCampaign (exists)
  NEW: Order, OrderItem, Cart, CartItem
  Aggregates: QRCode (root), Order (root)
  Services: OrderService, CartService, MenuService

Delivery:
  NEW Entities: DeliveryAgent, Vehicle, DeliveryAssignment,
                DeliveryRoute, ProofOfDelivery, DeliveryZone
  Aggregates: DeliveryAssignment (root)
  Services: DeliveryService, RoutingService, AssignmentService
  Domain Events: DeliveryAssigned, OutForDelivery, Delivered

Customer Portal:
  NEW Entities: CustomerUser (extends User or linked to Customer),
                CustomerSession, CustomerAddress
  Aggregates: CustomerUser (root)
  Services: CustomerAuthService, PortalService
```

### 6.6 Sales Network Context

```yaml
Sales Network:
  Entities: SalesHierarchy, SalesProfile, Lead, LeadActivity,
            LeadAssignment, CommissionRule, CommissionLedger,
            CommissionPayout
  Aggregates: SalesProfile (root), Lead (root)
  Services: HierarchyService, ProfileService, LeadService,
            CommissionService, PayoutService
  Domain Events: LeadConverted, CommissionEarned, PayoutCompleted
```

---

## 7. Missing Database Entities — Complete List

### 7.1 Urgent (QR Commerce & Delivery)

| Entity | Table | Fields |
|--------|-------|--------|
| `Order` | `orders` | id, businessId, qrCodeId, customerId, orderDate, status (pending/confirmed/preparing/out_for_delivery/delivered/completed/cancelled), subtotal, deliveryFee, discount, tax, total, paidAmount, balanceDue, paymentStatus (paid/partial/unpaid), notes, createdAt |
| `OrderItem` | `order_items` | id, orderId, catalogItemId, variantId, quantity, unitPrice, subtotal, notes |
| `Cart` | `carts` | id, businessId, qrCodeId, customerId, sessionId, expiresAt, createdAt |
| `CartItem` | `cart_items` | id, cartId, catalogItemId, variantId, quantity, unitPrice, createdAt |
| `DeliveryAgent` | `delivery_agents` | id, businessId, userId, name, phone, photo, isActive, vehicleId, createdAt |
| `Vehicle` | `vehicles` | id, businessId, type (bike/car/truck), plateNumber, model, color, isActive |
| `DeliveryAssignment` | `delivery_assignments` | id, orderId, agentId, vehicleId, status (assigned/picked_up/out_for_delivery/delivered/failed), assignedAt, deliveredAt, notes |
| `DeliveryRoute` | `delivery_routes` | id, businessId, name, zone, stops (JSON), isActive |
| `ProofOfDelivery` | `proof_of_deliveries` | id, deliveryAssignmentId, type (photo/signature/pin), value (URL or hash), capturedAt |
| `DeliveryZone` | `delivery_zones` | id, businessId, name, boundaries (GeoJSON), baseFee, perKmFee, isActive |
| `CustomerUser` | `customer_users` | id, customerId, email, phone, password, isVerified, lastLoginAt — OR extend existing User model with customer relation |
| `CustomerAddress` | `customer_addresses` | id, customerId, label (home/work), address, city, lat, lng, isDefault |
| `PaymentVerification` | `payment_verifications` | id, paymentId, method (mobile/cash/bank/credit), reference, verifiedBy, verifiedAt, status (pending/verified/failed), notes |

### 7.2 Financial Core (NEW)

| Entity | Table | Fields |
|--------|-------|--------|
| `Account` (CoA) | `accounts` | id, businessId, code, name, type (asset/liability/equity/revenue/expense), isActive, parentId |
| `JournalEntry` | `journal_entries` | id, businessId, entryDate, reference, description, totalDebit, totalCredit, status (draft/posted), postedAt, createdBy |
| `JournalLine` | `journal_lines` | id, journalEntryId, accountId, debit, credit, description |
| `BankAccount` | `bank_accounts` | id, businessId, bankName, accountName, accountNumber, currency, openingBalance, currentBalance, isActive |
| `BankTransaction` | `bank_transactions` | id, bankAccountId, transactionDate, description, reference, debit, credit, balance, isReconciled |
| `Reconciliation` | `reconciliations` | id, bankAccountId, periodStart, periodEnd, bankBalance, systemBalance, difference, status, matchedCount, unmatchedCount |
| `TaxRate` | `tax_rates` | id, businessId, name, rate, type (VAT/sales_tax/withholding), isActive |
| `TaxReport` | `tax_reports` | id, businessId, period, totalSales, totalPurchases, taxDue, taxCredits, netPayable, status |

### 7.3 Future Industry Entities (Healthcare)

| Entity | Table |
|--------|-------|
| `Patient` | `patients` |
| `Practitioner` | `practitioners` |
| `Appointment` | `appointments` |
| `Consultation` | `consultations` |
| `MedicalRecord` | `medical_records` |
| `Prescription` | `prescriptions` |
| `Medication` | `medications` |
| `Ward` | `wards` |
| `Room` | `rooms` |
| `Admission` | `admissions` |
| `InsuranceClaim` | `insurance_claims` |
| `LabTest` | `lab_tests` |
| `LabResult` | `lab_results` |

### 7.4 Future Industry Entities (Agriculture)

| Entity | Table |
|--------|-------|
| `Farm` | `farms` |
| `Field` | `fields` |
| `Crop` | `crops` |
| `CropVariety` | `crop_varieties` |
| `Planting` | `plantings` |
| `Harvest` | `harvests` |
| `InputApplication` | `input_applications` |
| `InputProduct` | `input_products` |
| `Livestock` | `livestocks` |
| `LivestockBreeding` | `livestock_breedings` |
| `LivestockHealth` | `livestock_healths` |
| `SoilTest` | `soil_tests` |

### 7.5 Future Industry Entities (Manufacturing)

| Entity | Table |
|--------|-------|
| `BillOfMaterial` | `bill_of_materials` |
| `BOMComponent` | `bom_components` |
| `ProductionOrder` | `production_orders` |
| `ProductionStep` | `production_steps` |
| `WorkCenter` | `work_centers` |
| `Machine` | `machines` |
| `Routing` | `routings` |
| `RoutingStep` | `routing_steps` |
| `QualityCheck` | `quality_checks` |
| `MaintenanceSchedule` | `maintenance_schedules` |

### 7.6 Future Industry Entities (Mining)

| Entity | Table |
|--------|-------|
| `Mine` | `mines` |
| `MineSite` | `mine_sites` |
| `ProductionShift` | `production_shifts` |
| `CrushingRecord` | `crushing_records` |
| `WeighbridgeTicket` | `weighbridge_tickets` |
| `FleetVehicle` | `fleet_vehicles` |
| `FleetTrip` | `fleet_trips` |
| `ExportShipment` | `export_shipments` |
| `QualitySample` | `quality_samples` |

---

## 8. Missing Workflows

### 8.1 QR Commerce Workflow (COMPLETE)

```
Customer scans QR
  ↓
Opens storefront (public page) ── exists
  ↓
**NEW**: Registers/login (if new customer)
  ↓
**NEW**: Browses products, adds to cart
  ↓
**NEW**: Reviews cart → proceeds to checkout
  ↓
**NEW**: Chooses delivery or pickup
  ↓
**NEW**: Chooses payment method (cash, mobile, bank, credit)
  ↓
**NEW**: Places order
  ↓
**NEW**: Payment verification
  ├─ Cash: pending verification by delivery agent
  ├─ Mobile: reference verification
  ├─ Bank: reference verification
  └─ Credit: added to customer receivables
  ↓
**NEW**: Order confirmed
  ↓
**NEW**: Delivery agent assigned
  ↓
**NEW**: Agent picks up order
  ↓
**NEW**: Out for delivery
  ↓
**NEW**: Delivered → Proof of Delivery captured
  ↓
**NEW**: Payment verified (if cash)
  ↓
**NEW**: Order completed
```

### 8.2 Financial Workflows (NEW)

```
Period-End Close:
  Verify all sales posted to GL
  Verify all purchases posted to GL
  Reconcile bank accounts
  Run AR aging → send dunning letters
  Run AP aging → schedule payments
  Calculate tax liability
  Generate financial statements (P&L, Balance Sheet, Cash Flow)

Procure-to-Pay:
  Requisition → Approval → PO → Supplier → Goods Received
  → Invoice Received → 3-Way Match → Payment Schedule → Payment

Order-to-Cash:
  Lead → Quote → Order → Fulfillment → Shipment → Invoice
  → Payment → Reconciliation → Recognition
```

---

## 9. Missing Routes / Pages / APIs

### 9.1 Customer Portal Routes (NEW)

| Route | Purpose |
|-------|---------|
| `/menu/[code]/order` | Place order from QR menu |
| `/customer/login` | Customer login |
| `/customer/register` | Customer registration |
| `/customer/dashboard` | Customer home |
| `/customer/orders` | Order history |
| `/customer/orders/[id]` | Order detail + tracking |
| `/customer/wallet` | Customer wallet/credit |
| `/customer/addresses` | Saved addresses |
| `/customer/profile` | Profile management |

### 9.2 Business Delivery Routes (NEW)

| Route | Purpose |
|-------|---------|
| `/workspaces/businesses/[id]/delivery/agents` | Manage delivery agents |
| `/workspaces/businesses/[id]/delivery/vehicles` | Manage vehicles |
| `/workspaces/businesses/[id]/delivery/zones` | Delivery zones & pricing |
| `/workspaces/businesses/[id]/delivery/orders` | Active delivery orders |
| `/workspaces/businesses/[id]/delivery/routes` | Route management |

### 9.3 QR Commerce Business Routes (NEW)

| Route | Purpose |
|-------|---------|
| `/workspaces/businesses/[id]/qr-ordering/orders` | Manage QR orders |
| `/workspaces/businesses/[id]/qr-ordering/payments` | Payment verification |
| `/workspaces/businesses/[id]/qr-ordering/settings` | QR storefront settings |

### 9.4 Financial Routes (NEW)

| Route | Purpose |
|-------|---------|
| `/workspaces/businesses/[id]/finance/chart-of-accounts` | CoA management |
| `/workspaces/businesses/[id]/finance/journal` | Journal entries |
| `/workspaces/businesses/[id]/finance/ledger` | General ledger view |
| `/workspaces/businesses/[id]/finance/ar` | Accounts receivable |
| `/workspaces/businesses/[id]/finance/ap` | Accounts payable |
| `/workspaces/businesses/[id]/finance/bank-accounts` | Bank accounts |
| `/workspaces/businesses/[id]/finance/reconciliation` | Bank reconciliation |
| `/workspaces/businesses/[id]/finance/reports/profit-loss` | P&L statement |
| `/workspaces/businesses/[id]/finance/reports/balance-sheet` | Balance sheet |
| `/workspaces/businesses/[id]/finance/reports/cash-flow` | Cash flow |
| `/workspaces/businesses/[id]/finance/reports/tax` | Tax reports |

---

## 10. Final Module Map

```
┌────────────────────────────────────────────────────────────────────────────┐
│  PLATFORM CORE                                                              │
│                                                                            │
│  ├── Identity & Access        │ auth, users, sessions, invites             │
│  ├── Workspace & Org          │ workspaces, businesses, branches, stores   │
│  ├── Business Type Framework  │ business-types, type-modes, type-modules   │
│  ├── Staff                    │ staff, assignments                         │
│  ├── Roles & Permissions      │ roles, permissions, rbac                   │
│  ├── Platform Admin           │ platform management, settings              │
│  ├── Webhook Engine  [NEW]    │ webhooks, event publishing                 │
│  └── Public API      [NEW]    │ REST API gateway, API keys                 │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  SHARED MODULES (ALL Business Types)                                        │
│                                                                            │
│  ├── Subscription Billing     │ plans, subscriptions, wallet, deposits     │
│  ├── Support                  │ tickets                                    │
│  ├── Notifications            │ notifications, preferences                 │
│  ├── Communication            │ email config, templates, campaigns         │
│  ├── AI / Intelligence        │ firdaus, workflows, memory, insights       │
│  ├── Files & Uploads          │ uploads                                    │
│  ├── Activities & Audit       │ activities, audit-logs                     │
│  ├── Reports & BI   [NEW]     │ report builder, dashboards, data export    │
│  ├── General Ledger  [NEW]    │ chart of accounts, journals, ledger        │
│  ├── Accounts Receivable [NEW]│ aging, dunning, collections                │
│  ├── Accounts Payable  [NEW]  │ aging, payment runs                        │
│  ├── Treasury         [NEW]   │ bank accounts, reconciliation              │
│  ├── Tax Engine       [NEW]   │ rates, calculation, reporting              │
│  └── Multi-Currency   [NEW]   │ FX rates, conversion                       │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  COMMERCE (Business Type: Commerce)                                         │
│                                                                            │
│  ├── Retail Mode:                                                          │
│  │   ├── POS / Sales           │ sales, sale-items, pos-sessions          │
│  │   ├── Cash Management       │ registers, cash-transactions              │
│  │   └── Walk-in Customers     │ walk-in flow                              │
│  ├── Wholesale Mode:                                                       │
│  │   ├── Quotations            │ quotes, quote-items                       │
│  │   ├── Customer Credit       │ credit accounts, credit transactions      │
│  │   └── Bulk Pricing          │ price lists, tiered pricing               │
│  ├── Both (Retail + Wholesale):                                            │
│  │   ├── Catalog               │ items, variants, categories, brands, etc │
│  │   ├── Inventory             │ locations, balances, movements           │
│  │   ├── Procurement           │ purchases, POs, goods-received           │
│  │   ├── Suppliers             │ supplier management                       │
│  │   ├── CRM                   │ customers, groups, addresses             │
│  │   ├── Billing               │ invoices, returns                         │
│  │   ├── Expenses              │ categories, expenses                      │
│  │   └── Payments              │ methods, payments                         │
│  ├── QR Commerce [EXTEND]:                                                 │
│  │   ├── QR Storefront         │ public menu (exists)                      │
│  │   ├── Cart & Order  [NEW]  │ carts, orders, order-items               │
│  │   ├── Payment Verification  │ payment-verifications                     │
│  │   ├── Customer Portal [NEW] │ customer auth, dashboard, history        │
│  │   └── Delivery     [NEW]    │ agents, vehicles, routes, POD            │
│  └── Sales Network             │ hierarchy, profiles, leads, commissions   │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  HEALTHCARE (Business Type: Healthcare)  *** FUTURE ***                     │
│                                                                            │
│  ├── Patient Management  [NEW] │ patients, medical-records                │
│  ├── Appointments        [NEW] │ appointments, scheduling                  │
│  ├── Consultations       [NEW] │ consultations, prescriptions             │
│  ├── Inpatient           [NEW] │ wards, rooms, admissions                 │
│  ├── Pharmacy            [NEW] │ medications, dispensing                  │
│  ├── Lab                 [NEW] │ lab tests, results                       │
│  ├── Insurance Billing   [NEW] │ claims, eligibility                      │
│  └── Practitioner Mgmt  [NEW] │ doctors, nurses, licenses, schedules     │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  AGRICULTURE (Business Type: Agriculture)  *** FUTURE ***                   │
│                                                                            │
│  ├── Farm Management     [NEW] │ farms, fields, GPS                       │
│  ├── Crop Management     [NEW] │ crops, varieties, planting, harvests     │
│  ├── Input Management    [NEW] │ fertilizers, pesticides, applications    │
│  ├── Livestock           [NEW] │ animals, breeding, health                │
│  ├── Soil & Lab          [NEW] │ soil tests, recommendations             │
│  └── Cooperative Mgmt    [NEW] │ farmer groups, collective buying         │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  MANUFACTURING (Business Type: Manufacturing)  *** FUTURE ***               │
│                                                                            │
│  ├── BOM                 [NEW] │ bill of materials, components            │
│  ├── Production Orders   [NEW] │ production orders, work orders           │
│  ├── Work Centers        [NEW] │ machines, production lines               │
│  ├── Routing             [NEW] │ manufacturing steps, instructions        │
│  ├── Quality Control     [NEW] │ inspections, QC checks                   │
│  └── Maintenance         [NEW] │ equipment maintenance, schedules         │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│  MINING (Business Type: Mining)  *** FUTURE ***                             │
│                                                                            │
│  ├── Mine Operations     [NEW] │ mines, sites, shifts                     │
│  ├── Crushing            [NEW] │ crushing records, throughput             │
│  ├── Weighbridge         [NEW] │ weighbridge tickets, truck weights       │
│  ├── Fleet Management    [NEW] │ vehicles, trips, fuel                    │
│  ├── Export              [NEW] │ shipments, customs, documentation        │
│  └── Quality             [NEW] │ sampling, assays                         │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Platform Completeness Assessment

### 11.1 Current State

| Domain | Completeness | Notes |
|--------|-------------|-------|
| Platform Core (Auth, Workspace, Staff, RBAC) | **85%** | Missing webhooks, public API, multi-tenant console |
| Commerce — Catalog | **90%** | Mature; minor gaps (bulk import/export) |
| Commerce — POS / Sales | **65%** | Core works; no offline, no receipt printing, no barcode |
| Commerce — Inventory | **70%** | Location/balance works; no FIFO costing, no cycle count |
| Commerce — Procurement | **75%** | PO→GR workflow works; no automated reorder |
| Commerce — CRM | **40%** | Customer records exist; no portal, no self-service |
| Commerce — Billing | **50%** | Invoices/quotations exist; no recurring, no dunning |
| QR Commerce | **15%** | Menu display only; no orders, payments, delivery |
| Delivery System | **0%** | Entirely missing |
| Customer Portal | **0%** | Entirely missing |
| Financial Core (GL, AR, AP) | **5%** | Just payments and expenses; no double-entry accounting |
| Treasury / Multi-Currency | **0%** | Entirely missing |
| Tax Engine | **10%** | Tax rate field exists on items; no calculation |
| Sales Network | **80%** | Mature; hierarchy, leads, commissions |
| Subscription Billing | **85%** | Mature; plans, wallet, deposits |
| Support | **80%** | Ticket CRUD works; no knowledge base |
| Communications | **40%** | Email config exists; campaigns partially built |
| AI / Intelligence | **75%** | Firdaus workflow, memory, forecasts exist |
| Reports & Analytics | **30%** | Basic reports; no BI dashboards |

### 11.2 Overall ERP Readiness

| Criterion | Score | Status |
|-----------|-------|--------|
| **Platform Core Readiness** | 85% | ✅ Production-ready for SaaS |
| **Commerce Readiness** | 60% | ⚠️ Usable for basic retail/wholesale |
| **Financial Readiness** | 10% | ❌ Not ready — needs GL, AR, AP |
| **QR Commerce Readiness** | 15% | ❌ Needs order, payment, delivery |
| **Multi-Industry Readiness** | 5% | ❌ No Business Type abstraction |
| **CRM Readiness** | 30% | ❌ Needs customer portal |
| **Subscription Billing Readiness** | 85% | ✅ Production-ready |
| **Overall ERP Readiness** | **35%** | ❌ Functional for Commerce only |

---

## 12. Strategic Recommendations

### 12.1 What to Build Next (Priority Order)

#### Phase 1: Complete Commerce (Months 1-3)

```
Priority 1: Business Type Framework
  - Replace Industry enum with BusinessType model
  - Create BusinessTypeModule/registration system
  - Seed Commerce + future types
  - Migration script for existing businesses
  Impact: Enables all future multi-industry work

Priority 2: QR Commerce — Order Engine
  - Cart → Order → OrderItem models
  - Customer cart session (anonymous + registered)
  - Order status pipeline
  - Storefront page with add-to-cart
  Impact: Unlocks the full QR Commerce use case

Priority 3: QR Commerce — Delivery System
  - DeliveryAgent, Vehicle, DeliveryAssignment, POD
  - Delivery zone pricing
  - Agent assignment workflow
  Impact: Completes QR Commerce loop

Priority 4: QR Commerce — Customer Portal
  - Customer registration + login
  - Customer dashboard, order history
  - Address management
  - Order tracking page
  Impact: Enables customer self-service

Priority 5: QR Commerce — Payment Verification
  - Payment verification workflow
  - Mobile money reference check
  - Cash-on-delivery confirmation
  - Partial/unpaid to customer debt
  Impact: Enables payment reconciliation
```

#### Phase 2: Financial Core (Months 4-6)

```
Priority 6: General Ledger
  - Chart of Accounts
  - Double-entry journal
  - Auto-posting from sales/purchases/payments
  - Trial balance
  Impact: Foundational for all financial reporting

Priority 7: AR / AP with Aging
  - Accounts Receivable aging
  - Accounts Payable aging
  - Dunning/collection letters
  - Payment scheduling
  Impact: Professional financial management

Priority 8: Bank Reconciliation
  - Bank account management
  - Upload bank statements
  - Auto-match / manual reconciliation
  Impact: Cash management accuracy

Priority 9: Financial Reports
  - Profit & Loss statement
  - Balance Sheet
  - Cash Flow statement
  - Tax reports (VAT)
  Impact: CFO-ready financial reporting
```

#### Phase 3: Expand Horizons (Months 7-12)

```
Priority 10: New Business Type — Healthcare
  - Patients, Practitioners, Appointments
  - Medical records, prescriptions
  - Insurance billing

Priority 11: Platform Infrastructure
  - Public REST API (for integrations)
  - Webhook engine
  - Data export/import
  - Multi-tenant admin console

Priority 12: Agriculture / Manufacturing (select one)
  - Based on market demand
  - Agriculture: farms, crops, harvests
  - Manufacturing: BOM, production orders
```

### 12.2 Architectural Rules Going Forward

1. **Every new feature must declare its Business Type**. If it's shared across all types, it goes in Platform Core or Shared Modules.

2. **Commerce features must not assume all businesses are Commerce**. Query patterns should filter by business type.

3. **Financial transactions must use double-entry from day one**. The current single-entry payment model will not scale.

4. **Customer must be a first-class domain separate from Commerce**. Move Customer to Shared CRM.

5. **QR Commerce is not "just a menu"**. Rename and restructure to reflect Order → Payment → Delivery pipeline.

6. **Every new table needs a business_type_id or be truly shared**. This prevents future schema migration pain.

7. **Feature flags should gate industry-specific modules**. Plans should define which modules are available per business type.

### 12.3 Quick Wins (Immediately Actionable)

| Task | Effort | Impact |
|------|--------|--------|
| Add `business_type_id` to Business (foreign key, not enum) | 2 days | Enables all multi-industry work |
| Create `Order` + `OrderItem` models | 2 days | Fills biggest QR Commerce gap |
| Add customer login (link Customer → User) | 3 days | Enables customer portal |
| Create delivery agent workflow | 5 days | Completes delivery loop |
| Chart of Accounts seed data | 2 days | Starts GL foundation |
| Auto-post sales to GL journal | 3 days | Starts financial automation |

---

## 13. Conclusion

The Enkai platform has a solid foundation with a well-structured codebase, clean module
organization, and several production-ready modules (auth, workspace, RBAC, catalog,
subscriptions, sales network). However, it is currently a **Commerce-only ERP** that
needs architectural evolution to become a true **multi-industry business platform**.

The three critical transformations needed are:

1. **Business Type Abstraction** — Replace the Industry enum with a first-class
   BusinessType model to enable multi-industry support.

2. **QR Commerce Completion** — Extend from "read-only menu" to full
   Order → Payment → Delivery → Customer Portal pipeline.

3. **Financial Core** — Add double-entry General Ledger, AR/AP with aging,
   bank reconciliation, and proper financial reporting.

Current Commerce functionality is approximately **60% complete** for daily business
operations. Overall ERP readiness (across all industries) is approximately **35%**,
with the platform core being the most mature area.

Following the phased build plan above will transform Enkai from a Commerce-focused
operational tool into an enterprise-grade, multi-industry business platform within
12 months.
