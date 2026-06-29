# Enkai Platform — Full Implementation Blueprint

_CTO-Level Architecture & Development Plan_

**Stack**: Laravel 12 · Next.js 15 · PostgreSQL · Redis · Queue Workers  
**Pattern**: Modular Monolith → Future Microservice Extraction  
**Architecture**: Event-Driven · Domain-Driven · Multi-Tenant · Business-Type-Oriented

---

## Table of Contents

1. Domain Architecture
2. Bounded Contexts
3. Aggregate Roots
4. Entity Maps
5. Database Schema Design
6. Service Layer Design
7. API Design
8. Event Design
9. Module Dependencies
10. Permissions Matrix
11. Multi-Tenant Design
12. Financial Posting Rules
13. Deployment Architecture
14. Microservice vs Modular Monolith Recommendation
15. Development Phases
16. Migration Strategy
17. Technical Risks
18. Implementation Roadmap

---

## 1. Domain Architecture

### 1.1 High-Level Layer Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                                   │
│                   Next.js 15 App Router (Frontend)                            │
│                                                                              │
│  Platform Admin Panel  │  Business Dashboard  │  Customer Portal  │  Public │
│  (platform/*)          │  (workspaces/*)      │  (customer/*)     │  (menu/*)│
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ API (REST + Server Actions)
                                    │
┌──────────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                     │
│                         Laravel 12 Backend                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                        API GATEWAY                                      │  │
│  │  Authentication · Rate Limiting · Tenant Resolution · Request Logging  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     DOMAIN LAYER (Bounded Contexts)                     │  │
│  │                                                                         │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │  │
│  │  │ Identity &  │ │ Workspace & │ │  Financial  │ │   CRM       │     │  │
│  │  │ Access      │ │ Org         │ │  Core       │ │             │     │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐     │  │
│  │  │ Subscription│ │ Operations  │ │ Asset Mgmt  │ │ Comm. + AI  │     │  │
│  │  │ + Billing   │ │             │ │             │ │             │     │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘     │  │
│  │                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    BUSINESS TYPE LAYER                             │  │  │
│  │  │  Commerce · Healthcare · Agriculture · Manufacturing · Mining     │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    INDUSTRY EXTENSIONS                             │  │  │
│  │  │  POS · Inventory · QR · Delivery · Patients · Crops · BOM ...     │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                    │                                          │
│                                    ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                     INFRASTRUCTURE LAYER                                │  │
│  │  Event Bus · Queue Workers · Caching · File Storage · Email · SMS     │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                           │
│                                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │PostgreSQL │  │  Redis   │  │   S3     │  │ Elastic  │  │  Queue   │     │
│  │(Primary)  │  │(Cache)   │  │(Files)   │  │(Search)  │  │(Jobs)    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Directory Structure (Laravel 12)

```
app/
├── Domain/
│   ├── Identity/
│   │   ├── Entities/
│   │   ├── ValueObjects/
│   │   ├── Aggregates/
│   │   ├── Repositories/
│   │   ├── Services/
│   │   ├── Events/
│   │   ├── Listeners/
│   │   └── Policies/
│   ├── Workspace/
│   ├── Business/
│   ├── Staff/
│   ├── Rbac/
│   ├── Financial/
│   │   ├── GeneralLedger/
│   │   ├── AccountsReceivable/
│   │   ├── AccountsPayable/
│   │   ├── Treasury/
│   │   └── Tax/
│   ├── Crm/
│   ├── Subscription/
│   ├── Operations/
│   ├── AssetManagement/
│   ├── Communication/
│   ├── Ai/
│   ├── SalesNetwork/
│   ├── Commerce/
│   │   ├── Catalog/
│   │   ├── Inventory/
│   │   ├── Procurement/
│   │   ├── Pos/
│   │   ├── OrderManagement/
│   │   ├── Delivery/
│   │   ├── QrStorefront/
│   │   └── CustomerPortal/
│   ├── Healthcare/          # Future
│   ├── Agriculture/         # Future
│   ├── Manufacturing/       # Future
│   └── Mining/              # Future
├── Infrastructure/
│   ├── Persistence/
│   │   ├── Eloquent/
│   │   └── Migrations/
│   ├── Events/
│   ├── Queue/
│   ├── Cache/
│   ├── Files/
│   └── Search/
├── Api/
│   ├── Http/
│   │   ├── Controllers/
│   │   ├── Resources/
│   │   ├── Requests/
│   │   └── Middleware/
│   └── GraphQL/             # Optional future
└── Shared/
    ├── ValueObjects/
    ├── Traits/
    ├── Interfaces/
    └── Helpers/
```

---

## 2. Bounded Contexts

### 2.1 Context Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          BOUNDED CONTEXT MAP                                     │
│                                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐    │
│  │ Identity & Access    │◄──│ Workspace & Org     │──►│ Subscription        │    │
│  │ (User, Auth, MFA)   │   │ (WS, Business,       │   │ (Plan, Sub, Wallet) │    │
│  │                      │   │  Branch, Store)      │   │                      │    │
│  └──────┬──────────────┘   └──────────┬──────────┘   └─────────────────────┘    │
│         │                             │                                          │
│         ▼                             ▼                                          │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐    │
│  │ RBAC                 │   │ Staff               │   │ Operations           │    │
│  │ (Role, Permission,   │   │ (Staff, Assignment) │   │ (Task, Schedule,     │    │
│  │  Policy)             │   │                      │   │  Team, Location)     │    │
│  └─────────────────────┘   └─────────────────────┘   └─────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐    │
│  │ Financial Core       │──►│ CRM                 │──►│ Asset Management    │    │
│  │ (GL, AR, AP,         │   │ (Contact, Org,      │   │ (Asset, Maint,      │    │
│  │  Treasury, Tax)      │   │  Address, History)  │   │  Inspection)        │    │
│  └─────────────────────┘   └─────────────────────┘   └─────────────────────┘    │
│                                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                         BUSINESS TYPE LAYER                                 │   │
│  │                                                                            │   │
│  │  ┌──────────────────────────────────────────────────────────────────────┐  │   │
│  │  │  COMMERCE                                                             │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │   │
│  │  │  │ Catalog  │ │Inventory │ │Procure-  │ │  POS/    │ │  Order   │  │  │   │
│  │  │  │          │ │          │ │ment      │ │  Sales   │ │  Mgmt    │  │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │   │
│  │  │  │  QR      │ │ Delivery │ │ Customer │ │  Sales   │ │  Billing │  │  │   │
│  │  │  │Storefront│ │          │ │ Portal   │ │  Network │ │          │  │  │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐    │
│  │ Communication        │──►│ AI / Intelligence   │──►│ Platform Admin      │    │
│  │ (Notif, Email, SMS,  │   │ (Firdaus, Workflow,  │   │ (Activity, Audit,   │    │
│  │  Campaign)           │   │  Memory, Forecast)  │   │  Settings, Webhook) │    │
│  └─────────────────────┘   └─────────────────────┘   └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Context Relationships

| Context | Collaborates With | Communication |
|---------|------------------|---------------|
| Identity & Access | All contexts | Synchronous (API) |
| Workspace & Org | Identity, Staff, RBAC, Subscription | Sync + Events |
| Financial Core | CRM, Commerce (POS, Order, Procurement) | Events (auto-post) |
| CRM | Commerce, Healthcare, All industry contexts | Shared entities |
| Subscription | Workspace, Wallet | Events (renewal, suspend) |
| Commerce/Catalog | Commerce/Inventory, Commerce/Procurement | Sync |
| Commerce/OrderMgmt | Commerce/Delivery, Financial Core, CRM | Events |
| Commerce/POS | Commerce/OrderMgmt, Financial Core, Inventory | Events |
| Communication | All contexts | Async (queue) |
| AI | All contexts | Async |

---

## 3. Aggregate Roots

### 3.1 Platform Core Aggregates

| Aggregate | Root Entity | Key Entities | Invariants |
|-----------|------------|--------------|------------|
| `User` | User | Session, Account, Verification | Email unique, phone unique |
| `Workspace` | Workspace | WorkspaceMember | Owner must exist, unique slug |
| `Business` | Business | BusinessMode, Setting | Unique slug per workspace |
| `Branch` | Branch | Store | Unique name per business |
| `Staff` | Staff | StaffAssignment | User linked once per business |
| `Role` | Role | RolePermission, UserRole | Unique slug per scope |

### 3.2 Shared Domain Aggregates

| Aggregate | Root Entity | Key Entities | Invariants |
|-----------|------------|--------------|------------|
| `Account` (CoA) | Account | — | Unique code per business, balanced tree |
| `JournalEntry` | JournalEntry | JournalLine | Debits = Credits, must balance |
| `Contact` | Contact | Address, CommunicationLog | At least one contact method |
| `Subscription` | Subscription | SubscriptionPayment | Status transitions: active → grace → suspended |
| `SubscriptionWallet` | SubscriptionWallet | SubscriptionTransaction | Balance never negative |
| `Asset` | Asset | Assignment, MaintenanceRecord | — |
| `Notification` | Notification | — | — |
| `SupportTicket` | SupportTicket | — | Status pipeline: open → in_progress → resolved |

### 3.3 Commerce Aggregates

| Aggregate | Root Entity | Key Entities | Invariants |
|-----------|------------|--------------|------------|
| `CatalogItem` | CatalogItem | Variant, Image, Assignment | Unique slug per business |
| `PriceList` | PriceList | PriceListItem | Unique name per business |
| `InventoryLocation` | InventoryLocation | InventoryBalance | — |
| `StockMovement` | StockMovement | — | Quantity change must match balance update |
| `StockAdjustment` | StockAdjustment | StockAdjustmentItem | Expected ≠ Actual creates difference |
| `StockTransfer` | StockTransfer | StockTransferItem | Source location must have sufficient stock |
| `PurchaseOrder` | PurchaseOrder | PurchaseOrderItem | Status: draft → sent → approved → received |
| `GoodsReceived` | GoodsReceived | GoodsReceivedItem | Cannot exceed PO quantities |
| `Sale` | Sale | SaleItem | Grand total = subtotal - discount + tax |
| `POSSession` | POSSession | — | Cannot have two open sessions per store |
| `Invoice` | Invoice | InvoiceItem | Balance due ≥ 0, paid amount ≤ total |
| `Quotation` | Quotation | QuotationItem | Expiry date must be in future |
| `Return` | Return | ReturnItem | Cannot exceed original sale quantity |
| `Expense` | Expense | — | Approval required above threshold |
| `CashRegister` | CashRegister | CashTransaction | Balance = sum of all transactions |
| `Order` | Order | OrderItem | Status pipeline, payment status track |
| `Cart` | Cart | CartItem | Expires after inactivity |
| `DeliveryAssignment` | DeliveryAssignment | ProofOfDelivery | Cannot deliver without assignment |
| `QRCode` | QRCode | QRMenuItem, Assignment, Installation | Unique code |
| `Customer` | Customer | CustomerCreditAccount, Address | Credit balance cannot exceed limit |

### 3.4 Sales Network Aggregates

| Aggregate | Root Entity | Key Entities | Invariants |
|-----------|------------|--------------|------------|
| `SalesProfile` | SalesProfile | — | Unique per user, manager must be higher level |
| `Lead` | Lead | LeadActivity, LeadAssignment | Status pipeline: new → contacted → ... → converted/lost |
| `CommissionRule` | CommissionRule | — | — |
| `CommissionPayout` | CommissionPayout | CommissionLedger | Payout amount = sum of ledger entries |

---

## 4. Entity Maps

### 4.1 Platform Core Entities

```
User
├── id: UUID
├── email: string (unique)
├── phone: string? (unique)
├── username: string? (unique)
├── firstName: string
├── lastName: string
├── password: hashed string
├── emailVerifiedAt: datetime?
├── isActive: bool
├── mustChangePassword: bool
├── avatarUrl: string?
├── metadata: json?
├── timestamps
└── Relations:
    ├── sessions: Session[]
    ├── accounts: Account[]
    ├── workspaceMemberships: WorkspaceMember[]
    ├── userRoles: UserRole[]
    ├── staffProfile: Staff?
    ├── salesProfile: SalesProfile?
    └── createdBusinesses: Business[]

Workspace
├── id: UUID
├── name: string
├── slug: string (unique)
├── logoUrl: string?
├── description: string?
├── isActive: bool
├── timestamps
└── Relations:
    ├── members: WorkspaceMember[]
    └── businesses: Business[]

WorkspaceMember
├── id: UUID
├── workspaceId: UUID (FK)
├── userId: UUID (FK)
├── role: enum (OWNER, ADMIN, MEMBER, GUEST)
├── timestamps
└── Unique: [userId, workspaceId]

Business
├── id: UUID
├── workspaceId: UUID (FK)
├── businessTypeId: UUID (FK)     ★ NEW — replaces Industry enum
├── name: string
├── slug: string
├── email: string?
├── phone: string?
├── address: string?
├── logoUrl: string?
├── taxId: string?
├── currency: string (default: TZS)
├── timezone: string
├── isActive: bool
├── createdById: UUID? (FK)
├── metadata: json?
├── timestamps
└── Unique: [workspaceId, slug]

BusinessType                         ★ NEW MODEL
├── id: UUID
├── slug: string (unique)
├── name: string
├── description: string?
├── isActive: bool
├── config: json?                    # Module definitions, defaults
├── timestamps
└── Relations:
    ├── definedModes: BusinessTypeMode[]
    ├── definedModules: BusinessTypeModule[]
    └── businesses: Business[]

BusinessTypeMode                     ★ NEW MODEL
├── id: UUID
├── businessTypeId: UUID (FK)
├── slug: string                     # "retail", "wholesale", "both", "clinic", "hospital", "farm"
├── label: string
├── description: string?
└── Unique: [businessTypeId, slug]

BusinessTypeModule                   ★ NEW MODEL
├── id: UUID
├── businessTypeId: UUID (FK)
├── moduleKey: string                # "pos", "inventory", "patients", "crops", "bom"
├── isRequired: bool
├── sortOrder: int
└── Unique: [businessTypeId, moduleKey]

BusinessMode (existing improvement)
├── id: UUID
├── businessId: UUID (FK)
├── businessTypeModeId: UUID (FK)    ★ FK to BusinessTypeMode instead of string
├── isActive: bool
├── timestamps
└── Unique: [businessId, businessTypeModeId]

Branch
├── id: UUID
├── businessId: UUID (FK)
├── name: string
├── code: string?
├── email: string?
├── phone: string?
├── address: string?
├── city: string?
├── state: string?
├── country: string
├── postalCode: string?
├── isHeadOffice: bool
├── openingTime: time?
├── closingTime: time?
├── metadata: json?
├── timestamps
└── Unique: [businessId, name]

Store
├── id: UUID
├── branchId: UUID (FK)
├── name: string
├── code: string?
├── description: string?
├── isActive: bool
├── metadata: json?
├── timestamps
└── Unique: [branchId, name]

Staff
├── id: UUID
├── userId: UUID (FK, unique)
├── businessId: UUID (FK)
├── employeeCode: string?
├── position: string?
├── hireDate: date?
├── isActive: bool
├── timestamps
└── Unique: [businessId, employeeCode]

StaffAssignment
├── id: UUID
├── staffId: UUID (FK)
├── level: enum (BUSINESS, BRANCH, STORE)
├── businessId: UUID (FK)
├── branchId: UUID? (FK)
├── storeId: UUID? (FK)
├── roleId: UUID? (FK)
├── isPrimary: bool
└── Unique: [staffId, level, branchId, storeId]
```

### 4.2 RBAC Entities

```
Role
├── id: UUID
├── name: string
├── slug: string (unique per scope)
├── description: string?
├── scope: enum (PLATFORM, BUSINESS)
├── isSystem: bool
├── businessId: UUID? (FK)   # null = platform role
├── timestamps
└── Relations:
    ├── permissions: RolePermission[]
    └── userAssignments: UserRole[]

Permission
├── id: UUID
├── name: string
├── slug: string (unique)
├── description: string?
├── module: string            # "catalog", "pos", "inventory", "customers", etc.
├── action: string            # "create", "read", "update", "delete", "approve"
├── timestamps
└── Unique: [module, action]

RolePermission
├── roleId: UUID (FK)
├── permissionId: UUID (FK)
└── Unique: [roleId, permissionId]

UserRole
├── userId: UUID (FK)
├── roleId: UUID (FK)
├── businessId: UUID? (FK)   # null = platform-level role
└── Unique: [userId, roleId, businessId]
```

### 4.3 Financial Core Entities

```
Account (Chart of Accounts)
├── id: UUID
├── businessId: UUID (FK)
├── code: string              # e.g. "1-1000" — hierarchical code
├── name: string              # e.g. "Cash - Main Account"
├── type: enum (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
├── subtype: string?          # "CURRENT_ASSET", "FIXED_ASSET", etc.
├── parentId: UUID? (FK)      # Self-referential for hierarchy
├── isActive: bool
├── isSystem: bool            # Cannot be deleted
├── currency: string
├── metadata: json?
├── timestamps
└── Unique: [businessId, code]

JournalEntry
├── id: UUID
├── businessId: UUID (FK)
├── entryNumber: string       # Auto-generated sequential
├── entryDate: date
├── reference: string?        # Link to source document
├── referenceType: string?    # "sale", "purchase", "payment", "invoice", etc.
├── referenceId: UUID?        # Polymorphic reference
├── description: string?
├── totalDebit: decimal
├── totalCredit: decimal
├── status: enum (DRAFT, POSTED, REVERSED)
├── postedAt: datetime?
├── createdById: UUID (FK)
├── approvedById: UUID? (FK)
├── timestamps
└── Invariant: totalDebit MUST equal totalCredit

JournalLine
├── id: UUID
├── journalEntryId: UUID (FK)
├── accountId: UUID (FK)
├── debit: decimal
├── credit: decimal
├── description: string?
├── costCenterId: UUID? (FK)  # Optional cost center allocation
├── projectId: UUID? (FK)
└── Invariant: Either debit OR credit must be zero

Receivable
├── id: UUID
├── businessId: UUID (FK)
├── contactId: UUID (FK)
├── invoiceId: UUID? (FK)     # Source invoice
├── originalAmount: decimal
├── balanceDue: decimal
├── dueDate: date
├── status: enum (CURRENT, AGING_1_30, AGING_31_60, AGING_61_90, OVER_90, PAID, WRITTEN_OFF)
├── timestamps
└── Invariant: balanceDue ≥ 0

Payable
├── id: UUID
├── businessId: UUID (FK)
├── supplierId: UUID (FK)
├── purchaseId: UUID? (FK)
├── originalAmount: decimal
├── balanceDue: decimal
├── dueDate: date
├── status: enum (CURRENT, AGING_1_30, AGING_31_60, AGING_61_90, OVER_90, PAID)
├── timestamps

BankAccount
├── id: UUID
├── businessId: UUID (FK)
├── bankName: string
├── accountName: string
├── accountNumber: string
├── currency: string
├── openingBalance: decimal
├── currentBalance: decimal
├── isActive: bool
├── metadata: json?
├── timestamps

BankTransaction
├── id: UUID
├── bankAccountId: UUID (FK)
├── transactionDate: date
├── description: string
├── reference: string?
├── debit: decimal
├── credit: decimal
├── balance: decimal
├── isReconciled: bool (default: false)
├── reconciledAt: datetime?
├── matchReference: string?   # Links to JournalEntry
├── timestamps

TaxRate
├── id: UUID
├── businessId: UUID (FK)
├── name: string               # "VAT 18%", "Withholding 5%"
├── rate: decimal
├── type: enum (VAT, SALES_TAX, WITHHOLDING, EXCISE)
├── isActive: bool
├── timestamps

TaxReport
├── id: UUID
├── businessId: UUID (FK)
├── period: string              # "2026-01", "2026-Q1"
├── type: enum (VAT, WITHHOLDING)
├── totalSales: decimal
├── totalPurchases: decimal
├── taxDue: decimal
├── taxCredits: decimal
├── netPayable: decimal
├── status: enum (DRAFT, SUBMITTED, PAID)
├── timestamps
```

### 4.4 CRM Entities

```
Contact (Shared — NOT Commerce-specific)
├── id: UUID
├── businessId: UUID (FK)
├── type: enum (PERSON, ORGANIZATION)
├── firstName: string?
├── lastName: string?
├── organizationName: string?
├── email: string?
├── phone: string?
├── mobile: string?
├── isActive: bool
├── metadata: json?
├── timestamps
└── Relations:
    ├── addresses: Address[]
    ├── communicationLogs: CommunicationLog[]
    ├── orders: Order[]
    ├── invoices: Invoice[]
    └── creditAccount: CreditAccount?

Address
├── id: UUID
├── contactId: UUID (FK)
├── label: string               # "Home", "Work", "Store", "Delivery"
├── addressLine1: string
├── addressLine2: string?
├── city: string
├── state: string?
├── postalCode: string?
├── country: string
├── lat: decimal?
├── lng: decimal?
├── isDefault: bool
├── timestamps

CommunicationLog
├── id: UUID
├── contactId: UUID (FK)
├── type: enum (CALL, EMAIL, SMS, MEETING, NOTE)
├── subject: string?
├── body: text?
├── direction: enum (INBOUND, OUTBOUND)
├── performedById: UUID (FK)    # Staff/User who logged it
├── timestamps

CreditAccount
├── id: UUID
├── businessId: UUID (FK)
├── contactId: UUID (FK, unique)
├── creditLimit: decimal
├── currentBalance: decimal
├── status: enum (ACTIVE, FROZEN, CLOSED)
├── lastTransactionAt: datetime?
├── timestamps
└── Invariant: currentBalance ≤ creditLimit

CreditTransaction
├── id: UUID
├── creditAccountId: UUID (FK)
├── type: enum (SALE, PAYMENT, ADJUSTMENT, WRITE_OFF, REFUND)
├── amount: decimal
├── balanceBefore: decimal
├── balanceAfter: decimal
├── reference: string?
├── description: string?
├── createdById: UUID (FK)
├── timestamps
```

### 4.5 Order Management Entities

```
Order (Channel-agnostic — ALL channels use this)
├── id: UUID
├── businessId: UUID (FK)
├── channel: enum (POS, QR_STOREFRONT, CUSTOMER_PORTAL, SALES_AGENT, API)
├── orderNumber: string (auto-generated)
├── contactId: UUID? (FK)
├── branchId: UUID? (FK)
├── storeId: UUID? (FK)
├── staffId: UUID? (FK)
├── orderDate: datetime
├── status: enum (DRAFT, PENDING, CONFIRMED, PROCESSING,
│                  OUT_FOR_DELIVERY, DELIVERED, COMPLETED, CANCELLED)
├── paymentStatus: enum (UNPAID, PARTIALLY_PAID, PAID, REFUNDED)
├── subtotal: decimal
├── discountTotal: decimal
├── taxTotal: decimal
├── deliveryFee: decimal
├── grandTotal: decimal
├── paidAmount: decimal
├── balanceDue: decimal
├── notes: text?
├── metadata: json?
├── createdById: UUID? (FK)
├── timestamps
└── Relations:
    ├── items: OrderItem[]
    ├── payments: Payment[]
    ├── deliveryAssignment: DeliveryAssignment?
    └── invoices: Invoice[]

OrderItem
├── id: UUID
├── orderId: UUID (FK)
├── catalogItemId: UUID (FK)
├── variantId: UUID? (FK)
├── quantity: decimal
├── unitPrice: decimal
├── discount: decimal
├── subtotal: decimal
├── taxRate: decimal?
├── taxAmount: decimal?
├── metadata: json?
├── timestamps

Cart
├── id: UUID
├── businessId: UUID (FK)
├── qrCodeId: UUID? (FK)
├── contactId: UUID? (FK)
├── sessionToken: string?       # For anonymous carts
├── expiresAt: datetime
├── timestamps
└── Relations:
    └── items: CartItem[]

CartItem
├── id: UUID
├── cartId: UUID (FK)
├── catalogItemId: UUID (FK)
├── variantId: UUID? (FK)
├── quantity: decimal
├── unitPrice: decimal
├── timestamps
```

### 4.6 Delivery Entities

```
DeliveryAgent
├── id: UUID
├── businessId: UUID (FK)
├── userId: UUID (FK, unique)
├── name: string
├── phone: string
├── photo: string?
├── isActive: bool
├── currentVehicleId: UUID? (FK)
├── metadata: json?
├── timestamps

Vehicle
├── id: UUID
├── businessId: UUID (FK)
├── type: enum (BIKE, CAR, VAN, TRUCK)
├── plateNumber: string
├── model: string?
├── color: string?
├── capacity: decimal?          # Max weight/volume
├── isActive: bool
├── timestamps

DeliveryAssignment
├── id: UUID
├── orderId: UUID (FK, unique)
├── agentId: UUID (FK)
├── vehicleId: UUID? (FK)
├── status: enum (ASSIGNED, PICKED_UP, OUT_FOR_DELIVERY, DELIVERED, FAILED, CANCELLED)
├── assignedAt: datetime
├── pickedUpAt: datetime?
├── deliveredAt: datetime?
├── failedReason: string?
├── notes: text?
├── timestamps
└── Relations:
    └── proofOfDelivery: ProofOfDelivery?

DeliveryRoute
├── id: UUID
├── businessId: UUID (FK)
├── name: string
├── zone: string?
├── stops: json?                 # Array of stop definitions
├── isActive: bool
├── timestamps

DeliveryZone
├── id: UUID
├── businessId: UUID (FK)
├── name: string
├── boundaries: json?            # GeoJSON polygon
├── baseFee: decimal
├── perKmFee: decimal
├── estimatedMinutes: int?
├── isActive: bool
├── timestamps

ProofOfDelivery
├── id: UUID
├── deliveryAssignmentId: UUID (FK, unique)
├── type: enum (PHOTO, SIGNATURE, PIN)
├── value: string                # URL or hash
├── capturedAt: datetime
├── notes: string?
├── timestamps
```

### 4.7 Payment Verification Entities

```
PaymentVerification
├── id: UUID
├── paymentId: UUID (FK)
├── method: enum (CASH, MOBILE_MONEY, BANK_TRANSFER, CREDIT)
├── referenceNumber: string?     # Mobile money ref, bank ref
├── verifiedById: UUID? (FK)
├── verifiedAt: datetime?
├── status: enum (PENDING, VERIFIED, REJECTED, PARTIAL)
├── rejectionReason: string?
├── metadata: json?
├── timestamps

Payment (Enhanced from existing)
├── id: UUID
├── businessId: UUID (FK)
├── paymentMethodId: UUID (FK)
├── contactId: UUID? (FK)
├── orderId: UUID? (FK)          ★ Link to Order
├── saleId: UUID? (FK)
├── invoiceId: UUID? (FK)
├── amount: decimal
├── reference: string?
├── paidAt: datetime
├── status: enum (PENDING, COMPLETED, FAILED, REFUNDED)
├── notes: string?
├── createdById: UUID? (FK)
├── timestamps
└── Relations:
    └── verification: PaymentVerification?
```

### 4.8 Sales Channel — QR Storefront

```
QRCode (existing — enhanced)
├── ...existing fields...
├── storefrontConfig: json?      # Theme, banner, logo, welcome message
├── channel: "QR_STOREFRONT"     # Identifies this sales channel
└── Relations:
    ├── menuItems: QRMenuItem[]
    └── carts: Cart[]

QRMenuItem (existing — enhanced)
├── ...existing fields...
├── channel: "QR_STOREFRONT"
└── Relations:
    ├── qrCode: QRCode
    └── catalogItem: CatalogItem
```

### 4.9 Sales Network Entities

```
SalesHierarchy
├── id: UUID
├── level: int
├── title: string               # "National Sales Manager"
├── slug: string (unique)
├── description: string?
├── timestamps

SalesProfile
├── id: UUID
├── userId: UUID (FK, unique)
├── phone: string?
├── photo: string?
├── region: string?
├── status: enum (ACTIVE, INACTIVE, SUSPENDED)
├── hierarchyId: UUID? (FK)
├── managerId: UUID? (FK)       # Self-referential
├── metadata: json?
├── timestamps
└── Relations:
    ├── manager: SalesProfile?
    ├── subordinates: SalesProfile[]
    ├── leads: Lead[]
    └── commissions: CommissionLedger[]

Lead
├── id: UUID
├── firstName: string
├── lastName: string
├── email: string?
├── phone: string?
├── businessName: string?
├── source: enum (MANUAL, SELF_REGISTRATION, SALES_REGISTRATION, REFERRAL, CAMPAIGN)
├── status: enum (NEW, CONTACTED, INTERESTED, DEMO, NEGOTIATION, CONVERTED, LOST)
├── assignedToId: UUID? (FK)    # SalesProfile
├── convertedAt: datetime?
├── convertedToUserId: UUID? (FK)  # User created when lead converts
├── estimatedValue: decimal?
├── notes: text?
├── timestamps

CommissionRule
├── id: UUID
├── name: string
├── hierarchyLevelId: UUID? (FK)
├── type: enum (FLAT, PERCENTAGE)
├── value: decimal
├── minAmount: decimal?
├── maxAmount: decimal?
├── isActive: bool
├── timestamps

CommissionLedger
├── id: UUID
├── salesProfileId: UUID (FK)
├── sourceType: string           # "subscription", "sale", "registration"
├── sourceId: UUID?
├── amount: decimal
├── description: string?
├── status: enum (PENDING, APPROVED, PAID, CANCELLED)
├── paidAt: datetime?
├── payoutId: UUID? (FK)
├── timestamps

CommissionPayout
├── id: UUID
├── amount: decimal
├── notes: string?
├── paidById: UUID (FK)
├── paidAt: datetime
├── timestamps
```

---

## 5. Database Schema Design

### 5.1 Multi-Tenant Strategy

**Strategy**: Discriminated Shared Schema (single database, all tables have `business_id`)

```php
// Laravel Global Scope
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check() && !auth()->user()->isPlatformAdmin()) {
            $builder->where('business_id', tenant()->id);
        }
    }
}

// All tenant-scoped models use this trait
trait BelongsToBusiness
{
    public static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
```

**Key design decisions**:
- `business_id` on every tenant-scoped table (indexed)
- Platform-level data (users, roles with `scope=PLATFORM`) has no `business_id`
- `workspace_id` for workspace-level scoping (above business)
- UUIDs for all primary keys (no auto-increment — prevents enumeration, easier migration)
- Soft deletes on all business-critical entities

### 5.2 Naming Conventions

```sql
-- Tables: snake_case, plural
-- Columns: snake_case
-- Primary keys: id (UUID)
-- Foreign keys: {table}_id
-- Timestamps: created_at, updated_at, deleted_at
-- Indexes: idx_{table}_{column}

-- Example
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    order_number VARCHAR(50) NOT NULL,
    contact_id UUID REFERENCES contacts(id),
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid',
    subtotal DECIMAL(15,2) NOT NULL,
    grand_total DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_orders_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_orders_contact FOREIGN KEY (contact_id) REFERENCES contacts(id)
);

CREATE INDEX idx_orders_business_status ON orders(business_id, status);
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_orders_created ON orders(created_at);
```

### 5.3 Critical Indexes

```sql
-- Multi-tenant lookups
CREATE INDEX idx_{table}_business ON {table}(business_id);
CREATE INDEX idx_{table}_business_status ON {table}(business_id, status);
CREATE INDEX idx_{table}_business_created ON {table}(business_id, created_at DESC);

-- Relationship lookups
CREATE INDEX idx_orders_contact ON orders(contact_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- Financial reporting
CREATE INDEX idx_journal_entries_date ON journal_entries(business_id, entry_date);
CREATE INDEX idx_receivables_aging ON receivables(business_id, status, due_date);
CREATE INDEX idx_payables_aging ON payables(business_id, status, due_date);

-- Sales channel
CREATE INDEX idx_orders_channel ON orders(business_id, channel);
CREATE INDEX idx_carts_session ON carts(session_token) WHERE session_token IS NOT NULL;

-- Search optimization
CREATE INDEX idx_catalog_items_search ON catalog_items USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, ''))
);
```

### 5.4 Migration Strategy

```php
// Laravel Migration — Business Type replaces Industry
Schema::create('business_types', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('slug')->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->boolean('is_active')->default(true);
    $table->json('config')->nullable();
    $table->timestamps();
});

Schema::create('business_type_modes', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('business_type_id')->constrained()->cascadeOnDelete();
    $table->string('slug');
    $table->string('label');
    $table->text('description')->nullable();
    $table->unique(['business_type_id', 'slug']);
});

Schema::create('business_type_modules', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('business_type_id')->constrained()->cascadeOnDelete();
    $table->string('module_key');
    $table->boolean('is_required')->default(false);
    $table->integer('sort_order')->default(0);
    $table->unique(['business_type_id', 'module_key']);
});

// Alter businesses table — add business_type_id, make industry nullable for transition
Schema::table('businesses', function (Blueprint $table) {
    $table->foreignUuid('business_type_id')->nullable()->constrained();
    $table->string('slug')->change(); // Remove unique if needed, make composite unique
    $table->unique(['workspace_id', 'slug'], 'uq_businesses_workspace_slug');
});

// Seed default business types
Artisan::call('db:seed', ['--class' => 'BusinessTypeSeeder']);
```

---

## 6. Service Layer Design

### 6.1 Pattern: Action + Service + Repository

Every domain follows a three-layer service pattern:

```
Controller (thin) → Action (orchestration) → Service (business logic) → Repository (data access)
```

```
Domain/Commerce/OrderManagement/
├── Actions/
│   ├── PlaceOrderAction.php
│   ├── CancelOrderAction.php
│   ├── ConfirmOrderAction.php
│   └── DispatchOrderAction.php
├── Services/
│   ├── OrderService.php
│   ├── OrderPricingService.php
│   ├── OrderInventoryService.php
│   └── OrderStatusService.php
├── Repositories/
│   ├── OrderRepository.php
│   └── OrderItemRepository.php
├── Events/
│   ├── OrderCreated.php
│   ├── OrderConfirmed.php
│   ├── OrderCancelled.php
│   └── OrderCompleted.php
├── Listeners/
│   ├── ReserveInventoryOnOrderConfirmed.php
│   ├── PostToGLOnOrderCompleted.php
│   └── NotifyCustomerOnStatusChange.php
├── Enums/
│   ├── OrderStatus.php
│   └── PaymentStatus.php
├── Exceptions/
│   ├── InsufficientInventoryException.php
│   └── OrderStateTransitionException.php
└── Rules/
    ├── OrderCanBeCancelled.php
    └── OrderStatusTransition.php
```

### 6.2 Action Examples

```php
// Action — Orchestrates a use case, calls services, dispatches events
class PlaceOrderAction
{
    public function __construct(
        private OrderService $orderService,
        private OrderPricingService $pricingService,
        private OrderInventoryService $inventoryService,
        private CartService $cartService,
        private EventDispatcher $events,
    ) {}

    public function execute(Cart $cart, array $input): Order
    {
        $this->validateCart($cart);
        $contact = $this->resolveContact($input['contact_id'] ?? null, $input['contact'] ?? null);

        $order = $this->orderService->createFromCart($cart, $contact, $input['branch_id'] ?? null);
        $this->pricingService->calculateTotals($order, $input['delivery_fee'] ?? 0);
        $this->orderService->save($order);

        $this->cartService->clear($cart);
        $this->events->dispatch(new OrderCreated($order));

        return $order;
    }

    private function validateCart(Cart $cart): void
    {
        if ($cart->items->isEmpty()) {
            throw new CartEmptyException();
        }
        if ($cart->expires_at->isPast()) {
            throw new CartExpiredException();
        }
    }

    private function resolveContact(?string $contactId, ?array $contactData): Contact
    {
        if ($contactId) {
            return Contact::findOrFail($contactId);
        }
        return Contact::create($contactData); // Or use CRM service
    }
}
```

```php
// Another Action — Cancel Order
class CancelOrderAction
{
    public function __construct(
        private OrderService $orderService,
        private OrderInventoryService $inventoryService,
        private EventDispatcher $events,
    ) {}

    public function execute(Order $order, string $reason): Order
    {
        if (!OrderStatusTransition::canTransition($order->status, OrderStatus::CANCELLED)) {
            throw new OrderStateTransitionException($order->status, OrderStatus::CANCELLED);
        }

        $order = $this->orderService->cancel($order, $reason);
        $this->inventoryService->releaseReservedStock($order);
        $this->events->dispatch(new OrderCancelled($order));

        return $order;
    }
}
```

### 6.3 Service Examples

```php
// Service — Pure business logic, no HTTP awareness
class OrderService
{
    public function __construct(
        private OrderRepository $orderRepo,
        private OrderItemRepository $itemRepo,
    ) {}

    public function createFromCart(Cart $cart, ?Contact $contact, ?string $branchId): Order
    {
        $order = new Order();
        $order->business_id = $cart->business_id;
        $order->contact_id = $contact?->id;
        $order->channel = $cart->channel;
        $order->branch_id = $branchId;
        $order->status = OrderStatus::PENDING;
        $order->payment_status = PaymentStatus::UNPAID;
        $order->order_number = $this->generateOrderNumber($cart->business_id);

        $items = $cart->items->map(fn (CartItem $ci) => new OrderItem([
            'catalog_item_id' => $ci->catalog_item_id,
            'variant_id' => $ci->variant_id,
            'quantity' => $ci->quantity,
            'unit_price' => $ci->unit_price,
            'subtotal' => $ci->quantity * $ci->unit_price,
        ]));

        $order->items = $items;
        return $order;
    }

    public function calculateTotals(Order $order, float $deliveryFee = 0): void
    {
        $order->subtotal = $order->items->sum('subtotal');
        $order->discount_total = $this->calculateDiscounts($order);
        $order->tax_total = $this->calculateTax($order);
        $order->delivery_fee = $deliveryFee;
        $order->grand_total = $order->subtotal - $order->discount_total
                            + $order->tax_total + $deliveryFee;
    }

    public function cancel(Order $order, string $reason): Order
    {
        $order->status = OrderStatus::CANCELLED;
        $order->notes = ($order->notes ? $order->notes . "\n" : '')
                      . "[Cancelled] {$reason}";
        $this->orderRepo->save($order);
        return $order;
    }

    private function generateOrderNumber(string $businessId): string
    {
        // ORD-20260623-000001 format
        $prefix = 'ORD-' . now()->format('Ymd') . '-';
        $last = $this->orderRepo->getLastNumberToday($businessId, $prefix);
        return $prefix . str_pad($last + 1, 6, '0', STR_PAD_LEFT);
    }
}
```

### 6.4 Repository Examples

```php
// Repository — Data access abstraction
class OrderRepository
{
    public function __construct(
        private EventDispatcher $events,
    ) {}

    public function findById(string $id): ?Order
    {
        return Order::with(['items', 'payments', 'deliveryAssignment'])
                    ->find($id);
    }

    public function findByBusiness(string $businessId, array $filters = []): LengthAwarePaginator
    {
        $query = Order::where('business_id', $businessId)
                      ->with(['items.catalogItem', 'contact']);

        if ($filters['status'] ?? null) {
            $query->where('status', $filters['status']);
        }
        if ($filters['channel'] ?? null) {
            $query->where('channel', $filters['channel']);
        }
        if ($filters['date_from'] ?? null) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if ($filters['date_to'] ?? null) {
            $query->where('created_at', '<=', $filters['date_to']);
        }
        if ($filters['contact_id'] ?? null) {
            $query->where('contact_id', $filters['contact_id']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($filters['per_page'] ?? 20);
    }

    public function getLastNumberToday(string $businessId, string $prefix): int
    {
        return Order::where('business_id', $businessId)
                    ->where('order_number', 'like', "{$prefix}%")
                    ->count();
    }

    public function save(Order $order): void
    {
        $order->save();
        $order->items->each(fn (OrderItem $item) => $item->order_id = $order->id);
        $order->items->each->save();
    }
}
```

---

## 7. API Design

### 7.1 API Structure

All APIs follow: `/api/{version}/{domain}/{resource}`

```
/api/v1/
├── auth/
│   ├── POST /login
│   ├── POST /register
│   ├── POST /logout
│   ├── POST /refresh
│   ├── POST /forgot-password
│   ├── POST /reset-password
│   ├── POST /mfa/setup
│   ├── POST /mfa/verify
│   └── GET  /me
├── workspaces/
│   ├── GET  /
│   ├── POST /
│   ├── GET  /{id}
│   ├── PUT  /{id}
│   ├── GET  /{id}/members
│   ├── POST /{id}/members
│   └── DELETE /{id}/members/{userId}
├── businesses/
│   ├── GET  /
│   ├── POST /
│   ├── GET  /{id}
│   ├── PUT  /{id}
│   ├── GET  /{id}/settings
│   └── PUT  /{id}/settings
├── business-types/
│   ├── GET  /
│   ├── GET  /{slug}
│   └── GET  /{slug}/modules
├── branches/
│   ├── GET  / (scoped to business)
│   ├── POST /
│   └── ...
├── staff/
│   ├── GET  /
│   ├── POST /
│   └── ...
├── crm/
│   ├── contacts/
│   ├── addresses/
│   ├── credit-accounts/
│   └── communication-logs/
├── catalog/
│   ├── items/
│   ├── categories/
│   ├── brands/
│   ├── units/
│   └── price-lists/
├── inventory/
│   ├── locations/
│   ├── balances/
│   ├── movements/
│   ├── adjustments/
│   └── transfers/
├── procurement/
│   ├── suppliers/
│   ├── purchase-orders/
│   ├── goods-received/
│   └── purchases/
├── sales/
│   ├── pos/
│   │   ├── POST /sessions/open
│   │   ├── POST /sessions/{id}/close
│   │   ├── POST /sales
│   │   └── GET  /sales
│   ├── orders/
│   │   ├── GET  /
│   │   ├── POST /
│   │   ├── GET  /{id}
│   │   ├── PUT  /{id}/status
│   │   └── POST /{id}/cancel
│   ├── carts/
│   │   ├── POST /
│   │   ├── POST /{id}/items
│   │   ├── DELETE /{id}/items/{itemId}
│   │   └── POST /{id}/checkout
│   ├── invoices/
│   ├── quotations/
│   └── returns/
├── delivery/
│   ├── agents/
│   ├── vehicles/
│   ├── assignments/
│   ├── routes/
│   └── zones/
├── qr-storefront/
│   ├── GET  /menu/{code}
│   ├── POST /menu/{code}/cart
│   ├── POST /menu/{code}/checkout
│   └── GET  /menu/{code}/order/{orderId}
├── customer-portal/
│   ├── POST /auth/login
│   ├── POST /auth/register
│   ├── GET  /dashboard
│   ├── GET  /orders
│   ├── GET  /orders/{id}
│   ├── GET  /invoices
│   ├── GET  /statements
│   └── PUT  /addresses
├── financial/
│   ├── accounts/
│   ├── journal-entries/
│   ├── receivables/
│   ├── payables/
│   ├── bank-accounts/
│   ├── reconciliations/
│   └── reports/
│       ├── GET /profit-loss
│       ├── GET /balance-sheet
│       ├── GET /cash-flow
│       └── GET /tax
├── subscriptions/
│   ├── plans/
│   ├── subscriptions/
│   ├── wallet/
│   └── deposit-requests/
├── sales-network/
│   ├── hierarchy/
│   ├── profiles/
│   ├── leads/
│   ├── commissions/
│   └── payouts/
├── support/
│   └── tickets/
├── notifications/
│   ├── GET  /
│   ├── PUT  /{id}/read
│   └── GET  /preferences
├── platform/
│   ├── users/
│   ├── roles/
│   ├── permissions/
│   ├── settings/
│   ├── activity-logs/
│   └── audit-logs/
└── webhooks/
    ├── GET  /
    ├── POST /
    ├── PUT  /{id}
    └── DELETE /{id}
```

### 7.2 API Response Format

```json
{
    "success": true,
    "data": { ... },
    "meta": {
        "current_page": 1,
        "per_page": 20,
        "total": 150,
        "last_page": 8
    },
    "message": "Order created successfully"
}
```

Error format:
```json
{
    "success": false,
    "error": {
        "code": "INSUFFICIENT_INVENTORY",
        "message": "Item 'Coca Cola 500ml' only has 3 units available, requested 10",
        "details": {
            "item_id": "uuid",
            "item_name": "Coca Cola 500ml",
            "available": 3,
            "requested": 10
        }
    }
}
```

### 7.3 Authentication

```
Header: Authorization: Bearer {token}
Header: X-Tenant: {business_id}  (for business-scoped requests)

// Laravel Sanctum (SPA) or Passport (API) tokens
// Token scopes: platform, business, customer

// Customer Portal uses separate token guard
// QR Storefront anonymous sessions use session tokens
```

### 7.4 Rate Limiting

```php
// Laravel Rate Limiter
RateLimiter::for('api', fn (Request $request) => [
     Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()),
     Limit::perMinute(5)->by('login:' . $request->ip()),
]);

// Platform admin: 300/min
// Business API: 120/min
// Customer Portal: 60/min
// Public/QR: 30/min
```

---

## 8. Event Design

### 8.1 Event Bus Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                           EVENT BUS                                     │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │ Synchronous  │   │  Queue (Job) │   │  Domain Event Publisher  │  │
│  │ (within req) │   │  (async)     │   │  (dispatches to both)    │  │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘  │
│         │                  │                       │                   │
│         ▼                  ▼                       ▼                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐  │
│  │ Subscribers  │   │ Job Workers  │   │  Laravel Event/Listener  │  │
│  │ (same proc)  │   │ (Redis/DB)   │   │  + Broadcasting          │  │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Domain Events

```php
// Base Event
abstract class DomainEvent
{
    public string $eventId;
    public string $eventType;
    public string $occurredAt;
    public string $aggregateId;
    public string $aggregateType;
    public ?string $businessId;
    public ?string $userId;
    public array $metadata = [];

    public function __construct()
    {
        $this->eventId = (string) Str::uuid();
        $this->eventType = static::class;
        $this->occurredAt = now()->toIso8601String();
    }
}

// Concrete Event
class OrderCreated extends DomainEvent
{
    public function __construct(
        public Order $order,
    ) {
        parent::__construct();
        $this->aggregateId = $order->id;
        $this->aggregateType = 'order';
        $this->businessId = $order->business_id;
        $this->metadata = [
            'order_number' => $order->order_number,
            'channel' => $order->channel->value,
            'grand_total' => (float) $order->grand_total,
            'contact_id' => $order->contact_id,
        ];
    }
}
```

### 8.3 Complete Event Catalog

```php
// === PLATFORM CORE EVENTS ===
UserRegistered        // { userId, email, name }
UserLoggedIn          // { userId, ip }
UserInvited           // { inviteId, email, invitedBy }
WorkspaceCreated      // { workspaceId, name, ownerId }
BusinessCreated       // { businessId, name, type, ownerId }
BusinessTypeChanged   // { businessId, oldType, newType }
MemberAdded           // { workspaceId, userId, role }
MemberRemoved         // { workspaceId, userId }

// === FINANCIAL EVENTS ===
JournalPosted         // { journalEntryId, businessId, totalDebit, totalCredit }
AccountBalanceChanged // { accountId, businessId, oldBalance, newBalance }
ReceivableCreated     // { receivableId, contactId, amount, dueDate }
ReceivablePaid        // { receivableId, amount, paymentId }
PayableCreated        // { payableId, supplierId, amount, dueDate }
PayablePaid           // { payableId, amount, paymentId }
BankReconciled        // { bankAccountId, period, difference }

// === COMMERCE EVENTS ===
OrderCreated          // { orderId, orderNumber, channel, total }
OrderConfirmed        // { orderId, contactId }
OrderCancelled        // { orderId, reason }
InventoryReserved     // { orderId, items: [{catalogItemId, quantity}] }
InventoryReleased     // { orderId, items: [{catalogItemId, quantity}] }
InventoryAdjusted     // { adjustmentId, locationId, reason }
StockTransferred      // { transferId, fromLocation, toLocation }
PurchaseOrderApproved // { poId, supplierId, total }
GoodsReceived         // { goodsReceivedId, poId, items }
InvoiceSent           // { invoiceId, contactId, total, dueDate }
InvoicePaid           // { invoiceId, amount, paymentId }
PaymentVerified       // { paymentId, method, status }
DeliveryAssigned      // { assignmentId, orderId, agentId }
DeliveryCompleted     // { assignmentId, orderId, agentId }

// === SUBSCRIPTION EVENTS ===
SubscriptionStarted   // { subscriptionId, businessId, planId }
SubscriptionRenewed   // { subscriptionId, endDate }
SubscriptionSuspended // { subscriptionId, reason }
WalletDeposited       // { walletId, amount, newBalance }
WalletConsumed        // { walletId, amount, reason }

// === SALES NETWORK EVENTS ===
LeadCreated           // { leadId, assignedTo }
LeadConverted         // { leadId, convertedToUserId }
CommissionEarned      // { ledgerId, salesProfileId, amount }
CommissionPaid        // { payoutId, totalAmount }
```

### 8.4 Event Listener Map

```php
// === ORDER CREATED ===
OrderCreated => [
    NotifyBusinessOwner::class,        // Send notification
    LogActivity::class,                // Record activity
    CheckInventoryAvailability::class, // Verify stock (sync)
]

// === ORDER CONFIRMED ===
OrderConfirmed => [
    ReserveInventory::class,           // Reserve stock (sync, important)
    CreateDeliveryAssignment::class,   // Auto-assign delivery if needed (async)
    PostReceivableToGL::class,         // Post to GL if credit sale (async)
    SendOrderConfirmation::class,      // Email/SMS customer (async)
    TriggerWorkflowUpdate::class,      // Update Firdaus workflow (async)
]

// === ORDER CANCELLED ===
OrderCancelled => [
    ReleaseInventory::class,          // Release reserved stock (sync)
    CancelDeliveryAssignment::class,  // Cancel delivery (async)
    ReverseGLPosting::class,          // Reverse GL entries (async)
    NotifyCustomer::class,            // Notify (async)
]

// === DELIVERY COMPLETED ===
DeliveryCompleted => [
    VerifyCashPayment::class,          // If cash on delivery, verify payment
    CompleteOrder::class,              // Mark order as completed
    PostSaleToGL::class,               // Post revenue to GL (async)
    UpdateCommissionLedger::class,     // Calculate commission if applicable
    RequestCustomerFeedback::class,    // NPS survey (async)
]

// === PAYMENT VERIFIED ===
PaymentVerified => [
    UpdateOrderPaymentStatus::class,   // Set order.payment_status = PAID
    UpdateInvoicePaidAmount::class,    // Update invoice paid amount
    UpdateReceivableBalance::class,    // Reduce receivable balance
    NotifyCustomer::class,             // Receipt notification
]
```

### 8.5 Queue Configuration

```php
// config/queue.php
// Connection: redis

'default' => env('QUEUE_CONNECTION', 'redis'),

// Queue tiers:
// - high:    Orders, payments, inventory (urgent)
// - default: Notifications, emails, events
// - low:     Reports, cleanup, maintenance
// - gl:      Financial posting (sequential integrity)

'queues' => ['high', 'default', 'low', 'gl'],
```

---

## 9. Module Dependencies

### 9.1 Dependency Graph

```
Identity ───┬── Workspace ───┬── Business ───┬── BusinessType
            │                │               │
            │                │               └── Branch ─── Store
            │                │
            │                └── Staff
            │
            ├── RBAC ──── All modules (permission checks)
            │
            └── Subscription ─── Business
                                └── SubscriptionWallet

CRM ───┬── Financial (receivables from invoices)
       ├── Commerce/OrderManagement (orders belong to contact)
       ├── Commerce/Delivery (deliver to contact address)
       └── Commerce/CustomerPortal (customer login)

Financial ─── All commerce modules (auto-posting)
            ├── Commerce/POS (sale → GL)
            ├── Commerce/OrderManagement (order → AR → GL)
            ├── Commerce/Procurement (purchase → AP → GL)
            ├── Commerce/Billing (invoice → AR → GL)
            └── Commerce/Expenses (expense → GL)

Commerce/Catalog ───┬── Commerce/Inventory (items tracked in inventory)
                     ├── Commerce/OrderManagement (items sold in orders)
                     ├── Commerce/Procurement (items purchased)
                     ├── Commerce/POS (items sold at POS)
                     └── Commerce/QRStorefront (items displayed)

Commerce/OrderManagement ───┬── Commerce/Delivery (orders delivered)
                            ├── Commerce/CustomerPortal (orders viewed)
                            ├── Financial (orders posted to GL)
                            └── Commerce/Inventory (stock reserved/released)

Commerce/POS ───┬── Commerce/OrderManagement (creates orders)
                ├── Financial (sale → GL)
                └── Commerce/CashManagement

Communication ─── All modules (notifications)
AI ─── All modules (workflows, insights)
Operations ─── All modules (tasks, scheduling)
```

### 5.2 Module Dependency Rules

```
STRICT RULES:
  1. Platform Core → No dependency on Shared or Commerce modules
  2. Shared Modules → May depend on Platform Core only
  3. Business Type Layer → May depend on Platform Core + Shared
  4. Industry Extensions → May depend on Business Type Layer + Shared + Platform Core
  5. NEVER: Industry Extension → Another Industry Extension
  6. NEVER: Business Type Layer → Industry Extension

CIRCULAR DEPENDENCY ENFORCEMENT:
  - Use events to break circular deps
  - Example: Order ↔ Inventory
    → OrderConfirmed event → InventoryListener reserves stock (no direct call)

VIOLATION CHECK:
  - ./vendor/bin/deptrac  (automated dependency checking)
  - CI pipeline enforces dependency rules
```

---

## 10. Permissions Matrix

### 10.1 Permission Structure

```
Format: {module}:{action}
Actions: create, read, update, delete, approve, export, import
```

### 10.2 Core Permissions

```
# PLATFORM SCOPE (assigned to platform admins)
platform:access                  # Can access platform admin panel
platform:settings:manage         # Manage platform-level settings
platform:users:manage            # Manage all users
platform:roles:manage            # Manage roles & permissions
platform:audit:view              # View audit logs
platform:businesses:view-all     # View all businesses
platform:businesses:suspend      # Suspend any business
platform:deposits:approve        # Approve wallet deposits
platform:subscriptions:manage    # Manage subscription plans
platform:support:manage          # Manage all support tickets

# BUSINESS SCOPE (assigned to business users)
business:settings:manage         # Manage business settings
business:branches:manage         # CRUD branches
business:stores:manage           # CRUD stores
business:staff:manage            # CRUD staff
business:roles:assign            # Assign roles to users within business

# CATALOG
catalog:items:create
catalog:items:read
catalog:items:update
catalog:items:delete
catalog:categories:manage
catalog:brands:manage
catalog:units:manage
catalog:price-lists:manage

# INVENTORY
inventory:locations:manage
inventory:balances:view
inventory:movements:view
inventory:adjustments:create
inventory:adjustments:approve
inventory:transfers:create
inventory:transfers:approve

# PROCUREMENT
procurement:suppliers:manage
procurement:pos:create
procurement:pos:approve
procurement:purchases:create
procurement:purchases:read
procurement:goods-received:create

# POS / SALES
pos:access                      # Can use POS interface
pos:sales:create
pos:sales:read
pos:sales:refund
pos:sessions:open
pos:sessions:close
pos:cash:manage                 # Cash in/out operations

# ORDERS (All Channels)
orders:create
orders:read
orders:update
orders:cancel
orders:approve
orders:dispatch

# DELIVERY
delivery:agents:manage
delivery:vehicles:manage
delivery:assignments:manage
delivery:assignments:confirm    # Mark as delivered
delivery:routes:manage
delivery:zones:manage

# QR STOREFRONT
qr-storefront:menu:manage
qr-storefront:settings:manage
qr-storefront:orders:view

# CUSTOMER PORTAL (customer self-service — implicit)
portal:access                   # Granted to all linked customers
portal:orders:view
portal:orders:place
portal:payments:view
portal:addresses:manage

# FINANCIAL
financial:accounts:manage       # Chart of Accounts
financial:journal:create
financial:journal:approve
financial:receivables:view
financial:payables:view
financial:bank-accounts:manage
financial:reconciliation:create
financial:reports:view
financial:tax:manage

# CRM
crm:contacts:create
crm:contacts:read
crm:contacts:update
crm:contacts:delete
crm:credit:manage
crm:communication:log

# BILLING
billing:invoices:create
billing:invoices:read
billing:invoices:send
billing:invoices:void
billing:quotations:create
billing:quotations:convert      # Convert quote to invoice/order
billing:returns:create
billing:returns:approve
billing:credit-notes:create

# EXPENSES
expenses:categories:manage
expenses:create
expenses:read
expenses:approve

# SALES NETWORK
sales-network:hierarchy:manage
sales-network:profiles:manage
sales-network:leads:manage
sales-network:leads:assign
sales-network:commissions:view
sales-network:commissions:approve
sales-network:payouts:create

# COMMUNICATION
communication:email:send
communication:campaigns:manage
communication:templates:manage
communication:notifications:manage

# AI
ai:workflows:manage
ai:insights:view
ai:automation:manage
```

### 10.3 Role Templates

```php
// Seed these as default roles per business
'Business Owner' => [
    'business:settings:manage',
    'business:branches:manage',
    'business:stores:manage',
    'business:staff:manage',
    'business:roles:assign',
    // All catalog permissions
    'catalog:*',
    // All inventory permissions
    'inventory:*',
    // All procurement permissions
    'procurement:*',
    // All POS permissions
    'pos:*',
    // All order permissions
    'orders:*',
    // All delivery permissions
    'delivery:*',
    // All financial permissions
    'financial:*',
    'financial:reports:view',
    // All CRM permissions
    'crm:*',
    // All billing permissions
    'billing:*',
    // All expense permissions
    'expenses:*',
    // AI
    'ai:*',
    // Communications
    'communication:*',
    // QR Storefront
    'qr-storefront:*',
],

'Sales Manager' => [
    'orders:read',
    'orders:create',
    'orders:update',
    'orders:cancel',
    'sales-network:profiles:manage',
    'sales-network:leads:manage',
    'sales-network:leads:assign',
    'sales-network:commissions:view',
    'crm:contacts:read',
    'crm:contacts:create',
    'crm:communication:log',
],

'Cashier' => [
    'pos:access',
    'pos:sales:create',
    'pos:sales:read',
    'pos:sessions:open',
    'pos:sessions:close',
    'pos:cash:manage',
    'orders:create',
    'orders:read',
    'crm:contacts:read',
],

'Delivery Agent' => [
    'delivery:assignments:manage',
    'delivery:assignments:confirm',
],

'Customer (Portal)' => [
    'portal:access',
    'portal:orders:view',
    'portal:orders:place',
    'portal:payments:view',
    'portal:addresses:manage',
],

'Staff (Read-only)' => [
    'catalog:items:read',
    'inventory:balances:view',
    'crm:contacts:read',
    'orders:read',
],
```

---

## 11. Multi-Tenant Design

### 11.1 Tenant Isolation Strategy

**Chosen Strategy**: Shared Schema with Row-Level Isolation

| Concern | Approach |
|---------|----------|
| **Data isolation** | `business_id` on every tenant-scoped table |
| **Authentication** | Separate token scopes (platform / business / customer) |
| **Session isolation** | User sessions scoped to tenant context |
| **Storage isolation** | Business-prefixed S3 paths: `{business_id}/{folder}/{file}` |
| **Queue isolation** | Queue names prefixed by business_id for job traceability |
| **Cache isolation** | Cache keys prefixed: `{business_id}:{key}` |
| **Log isolation** | Log context includes `business_id` |
| **Domain isolation** | Each business has its own subdomain or path |

### 11.2 Tenant Resolution

```php
// Middleware: ResolveTenant
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $businessId = $request->header('X-Tenant')
                     ?? $request->route('businessId')
                     ?? $request->user()?->currentBusinessId();

        if (!$businessId && !$request->user()?->isPlatformAdmin()) {
            throw new TenantResolutionException();
        }

        // Set tenant context
        app()->instance('tenant.id', $businessId);
        app()->instance('tenant', Business::findOrFail($businessId));

        // Scope all queries for this request
        TenantScoper::setCurrent($businessId);

        return $next($request);
    }
}
```

### 11.3 Tenant-Aware Models

```php
// Base model with tenant scoping
abstract class TenantModel extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = TenantScoper::current()) {
                $builder->where('business_id', $tenantId);
            }
        });

        static::creating(function (self $model) {
            if ($tenantId = TenantScoper::current()) {
                $model->business_id ??= $tenantId;
            }
        });
    }

    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}
```

### 11.4 Future Database Isolation Path

```php
// When a tenant outgrows shared schema:
// 1. Create dedicated database: enkai_tenant_{business_id}
// 2. Run migrations on that database
// 3. Update TenancyResolver to switch connection
//
// Connection switching:
'tenants' => [
    'driver' => 'pgsql',
    'host' => env('DB_HOST'),
    'port' => env('DB_PORT'),
    'database' => 'enkai_tenant_{id}',  // Replaced dynamically
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
],
```

---

## 12. Financial Posting Rules

### 12.1 Double-Entry Accounting Design

Every financial transaction generates debits and credits across the Chart of Accounts. The system enforces:

1. **Every journal entry must balance** (total debits = total credits)
2. **Account types follow standard accounting**:
   - Asset: Debit increases, Credit decreases
   - Liability: Credit increases, Debit decreases
   - Equity: Credit increases, Debit decreases
   - Revenue: Credit increases, Debit decreases
   - Expense: Debit increases, Credit decreases
3. **Auto-posting** from operational transactions
4. **No direct ledger manipulation** — all entries must come from operations

### 12.2 Auto-Posting Rules

```php
// Transaction Type → GL Posting

// === SALE (Cash Sale) ===
// Debit:  Cash/Bank (Asset)
// Credit: Sales Revenue (Revenue)
// Debit:  Cost of Goods Sold (Expense)
// Credit: Inventory (Asset)
[
    ['account' => 'CASH',           'debit' => 10000,  'credit' => 0],
    ['account' => 'SALES_REVENUE',  'debit' => 0,      'credit' => 10000],
    ['account' => 'COGS',           'debit' => 6000,   'credit' => 0],
    ['account' => 'INVENTORY',      'debit' => 0,      'credit' => 6000],
]

// === SALE (Credit Sale) ===
// Debit:  Accounts Receivable (Asset)
// Credit: Sales Revenue (Revenue)
// Debit:  Cost of Goods Sold (Expense)
// Credit: Inventory (Asset)
[
    ['account' => 'ACCOUNTS_RECEIVABLE', 'debit' => 10000, 'credit' => 0],
    ['account' => 'SALES_REVENUE',       'debit' => 0,     'credit' => 10000],
    ['account' => 'COGS',                'debit' => 6000,  'credit' => 0],
    ['account' => 'INVENTORY',           'debit' => 0,     'credit' => 6000],
]

// === PAYMENT RECEIVED (on credit sale) ===
// Debit:  Cash/Bank (Asset)
// Credit: Accounts Receivable (Asset)
[
    ['account' => 'CASH',               'debit' => 10000, 'credit' => 0],
    ['account' => 'ACCOUNTS_RECEIVABLE', 'debit' => 0,    'credit' => 10000],
]

// === PURCHASE (Cash) ===
// Debit:  Inventory (Asset)
// Credit: Cash/Bank (Asset)
[
    ['account' => 'INVENTORY',  'debit' => 5000, 'credit' => 0],
    ['account' => 'CASH',       'debit' => 0,    'credit' => 5000],
]

// === PURCHASE (Credit) ===
// Debit:  Inventory (Asset)
// Credit: Accounts Payable (Liability)
[
    ['account' => 'INVENTORY',        'debit' => 5000, 'credit' => 0],
    ['account' => 'ACCOUNTS_PAYABLE', 'debit' => 0,    'credit' => 5000],
]

// === PAYMENT MADE (on credit purchase) ===
// Debit:  Accounts Payable (Liability)
// Credit: Cash/Bank (Asset)
[
    ['account' => 'ACCOUNTS_PAYABLE', 'debit' => 5000, 'credit' => 0],
    ['account' => 'CASH',             'debit' => 0,    'credit' => 5000],
]

// === EXPENSE ===
// Debit:  Expense Account (Expense)
// Credit: Cash/Bank (Asset)
[
    ['account' => 'RENT_EXPENSE', 'debit' => 2000, 'credit' => 0],
    ['account' => 'CASH',         'debit' => 0,    'credit' => 2000],
]

// === SUBSCRIPTION CONSUMPTION ===
// Debit:  Subscription Expense (Expense)
// Credit: Deferred Revenue (Liability) or Cash (Asset)
[
    ['account' => 'SUBSCRIPTION_EXPENSE', 'debit' => 500, 'credit' => 0],
    ['account' => 'CASH',                 'debit' => 0,   'credit' => 500],
]

// === WALLET DEPOSIT ===
// Debit:  Cash/Bank (Asset)
// Credit: Customer Deposits (Liability)
[
    ['account' => 'CASH',              'debit' => 50000, 'credit' => 0],
    ['account' => 'CUSTOMER_DEPOSITS', 'debit' => 0,     'credit' => 50000],
]
```

### 12.3 Chart of Accounts Seed

```php
// Standard CoA — seeded per business on creation
$accounts = [
    // ASSETS
    ['code' => '1-1000', 'name' => 'Cash – Main',             'type' => 'ASSET', 'subtype' => 'CURRENT_ASSET'],
    ['code' => '1-1100', 'name' => 'Cash – Petty Cash',       'type' => 'ASSET', 'subtype' => 'CURRENT_ASSET'],
    ['code' => '1-2000', 'name' => 'Bank – Main Account',     'type' => 'ASSET', 'subtype' => 'CURRENT_ASSET'],
    ['code' => '1-3000', 'name' => 'Accounts Receivable',     'type' => 'ASSET', 'subtype' => 'CURRENT_ASSET'],
    ['code' => '1-4000', 'name' => 'Inventory',               'type' => 'ASSET', 'subtype' => 'CURRENT_ASSET'],
    ['code' => '1-5000', 'name' => 'Fixed Assets',            'type' => 'ASSET', 'subtype' => 'FIXED_ASSET'],
    ['code' => '1-5100', 'name' => 'Accumulated Depreciation','type' => 'ASSET', 'subtype' => 'FIXED_ASSET'],

    // LIABILITIES
    ['code' => '2-1000', 'name' => 'Accounts Payable',        'type' => 'LIABILITY', 'subtype' => 'CURRENT_LIABILITY'],
    ['code' => '2-2000', 'name' => 'Customer Deposits',       'type' => 'LIABILITY', 'subtype' => 'CURRENT_LIABILITY'],
    ['code' => '2-3000', 'name' => 'Tax Payable',             'type' => 'LIABILITY', 'subtype' => 'CURRENT_LIABILITY'],
    ['code' => '2-4000', 'name' => 'Deferred Revenue',        'type' => 'LIABILITY', 'subtype' => 'CURRENT_LIABILITY'],

    // EQUITY
    ['code' => '3-1000', 'name' => 'Owner Equity',            'type' => 'EQUITY'],
    ['code' => '3-2000', 'name' => 'Retained Earnings',       'type' => 'EQUITY'],

    // REVENUE
    ['code' => '4-1000', 'name' => 'Sales Revenue',           'type' => 'REVENUE'],
    ['code' => '4-2000', 'name' => 'Service Revenue',         'type' => 'REVENUE'],
    ['code' => '4-3000', 'name' => 'Other Income',            'type' => 'REVENUE'],

    // EXPENSES
    ['code' => '5-1000', 'name' => 'Cost of Goods Sold',      'type' => 'EXPENSE'],
    ['code' => '5-2000', 'name' => 'Rent Expense',            'type' => 'EXPENSE'],
    ['code' => '5-3000', 'name' => 'Salaries & Wages',        'type' => 'EXPENSE'],
    ['code' => '5-4000', 'name' => 'Utilities',               'type' => 'EXPENSE'],
    ['code' => '5-5000', 'name' => 'Subscription Expense',    'type' => 'EXPENSE'],
    ['code' => '5-6000', 'name' => 'Depreciation',            'type' => 'EXPENSE'],
    ['code' => '5-7000', 'name' => 'Tax Expense',             'type' => 'EXPENSE'],
    ['code' => '5-8000', 'name' => 'Other Expenses',          'type' => 'EXPENSE'],
];
```

### 12.4 Automated Posting Service

```php
class FinancialPostingService
{
    public function __construct(
        private JournalRepository $journalRepo,
        private AccountRepository $accountRepo,
    ) {}

    public function postSale(Sale $sale): JournalEntry
    {
        $lines = [];

        // Cash or Receivable?
        if ($sale->payment_status === 'paid') {
            $lines[] = new JournalLine([
                'account_id' => $this->accountRepo->findByCode($sale->business_id, '1-1000')->id,
                'debit' => $sale->grand_total,
                'credit' => 0,
            ]);
        } else {
            $lines[] = new JournalLine([
                'account_id' => $this->accountRepo->findByCode($sale->business_id, '1-3000')->id,
                'debit' => $sale->grand_total,
                'credit' => 0,
            ]);
        }

        // Revenue
        $lines[] = new JournalLine([
            'account_id' => $this->accountRepo->findByCode($sale->business_id, '4-1000')->id,
            'debit' => 0,
            'credit' => $sale->grand_total,
        ]);

        // COGS (if tracking)
        if ($sale->track_cogs) {
            $lines[] = new JournalLine([
                'account_id' => $this->accountRepo->findByCode($sale->business_id, '5-1000')->id,
                'debit' => $sale->total_cost,
                'credit' => 0,
            ]);
            $lines[] = new JournalLine([
                'account_id' => $this->accountRepo->findByCode($sale->business_id, '1-4000')->id,
                'debit' => 0,
                'credit' => $sale->total_cost,
            ]);
        }

        return $this->journalRepo->create(
            businessId: $sale->business_id,
            entryDate: $sale->sale_date,
            description: "Sale #{$sale->reference}",
            referenceType: 'sale',
            referenceId: $sale->id,
            lines: $lines,
            createdById: $sale->created_by_id,
        );
    }
}
```

---

## 13. Deployment Architecture

### 13.1 Infrastructure Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CLOUD INFRASTRUCTURE (AWS/GCP/Azure)                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  LOAD BALANCER (ALB / NGINX)                                       │  │
│  │  └─ SSL Termination │ Rate Limiting │ WAF │ Request Routing        │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                    │                                      │
│                    ┌───────────────┴───────────────┐                      │
│                    ▼                               ▼                      │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  Next.js Frontend Servers   │   │   Laravel API Servers           │  │
│  │  (Node.js, containerized)   │   │   (PHP-FPM, containerized)      │  │
│  │                            │   │                                 │  │
│  │  - Server-side rendering   │   │  - REST API                     │  │
│  │  - Static asset serving    │──▶│  - Server Actions (hybrid)       │  │
│  │  - API proxy to Laravel   │   │  - Authentication                │  │
│  │  - Customer Portal UI     │   │  - Business Logic                │  │
│  │  - QR Storefront          │   │  - File upload processing        │  │
│  └─────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                          │
│                                      │                                   │
│                    ┌───────────────┴───────────────┐                      │
│                    ▼                               ▼                      │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │      Redis Cluster          │   │     PostgreSQL (Primary)        │  │
│  │                            │   │                                 │  │
│  │  - Cache (Laravel + Next)  │   │  - All transactional data       │  │
│  │  - Session storage         │   │  - Multi-tenant schema          │  │
│  │  - Queue backend           │   │  - Partitioned by business_id   │  │
│  │  - Rate limiting           │   │  - Indexed for tenant queries   │  │
│  │  - Broadcast (WebSockets)  │   │                                 │  │
│  └─────────────────────────────┘   └──────────────┬──────────────────┘  │
│                                                    │                     │
│                                                    ▼                     │
│                                         ┌─────────────────────────┐     │
│                                         │  PostgreSQL (Replica)    │     │
│                                         │  - Read-only queries     │     │
│                                         │  - Reporting / BI        │     │
│                                         │  - Analytics             │     │
│                                         └─────────────────────────┘     │
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  Queue Workers              │   │  Object Storage (S3)            │  │
│  │  (Laravel Horizon)          │   │                                 │  │
│  │                            │   │  - Uploads / Images             │  │
│  │  - high: orders, payments  │   │  - Receipts / Documents         │  │
│  │  - default: notifications  │   │  - Delivery PODs                │  │
│  │  - low: reports, cleanup  │   │  - Backups                      │  │
│  │  - gl: financial posting  │   │                                 │  │
│  └─────────────────────────────┘   └─────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  │
│  │  Elasticsearch (Optional)   │   │  Monitoring Stack               │  │
│  │                            │   │                                 │  │
│  │  - Full-text search        │   │  - Laravel Telescope (dev)      │  │
│  │  - Catalog search          │   │  - Laravel Pulse (prod)         │  │
│  │  - Activity/audit search   │   │  - Sentry (error tracking)      │  │
│  └─────────────────────────────┘   │  - Prometheus + Grafana        │  │
│                                    └─────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Container Architecture

```yaml
# docker-compose.yml (Production-like)
services:
  # Frontend
  nextjs:
    build:
      context: ./frontend
      target: production
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.enkai.app
    replicas: 3

  # Backend
  laravel:
    build:
      context: ./backend
      target: fpm
    volumes:
      - ./backend:/var/www/html
    environment:
      - DB_CONNECTION=pgsql
      - REDIS_HOST=redis
    replicas: 5

  nginx:
    image: nginx:alpine
    volumes:
      - ./docker/nginx:/etc/nginx/conf.d
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - laravel
      - nextjs

  # Queue
  horizon:
    build:
      context: ./backend
      target: cli
    command: php artisan horizon
    environment:
      - QUEUE_CONNECTION=redis
    replicas: 3
    depends_on:
      - redis
      - postgres

  # Scheduler (one instance)
  scheduler:
    build:
      context: ./backend
      target: cli
    command: php artisan schedule:work

  # Infrastructure
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=enkai
      - POSTGRES_PASSWORD=${DB_PASSWORD}
```

### 13.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Laravel checks
      - name: PHPStan
        run: vendor/bin/phpstan analyse --level=8
      - name: Pint (Code Style)
        run: vendor/bin/pint --test
      - name: Pest Tests
        run: php artisan test
      - name: Deptrac (Dependency Check)
        run: vendor/bin/deptrac

      # Next.js checks
      - name: ESLint
        run: npm run lint
      - name: TypeScript Check
        run: npx tsc --noEmit
      - name: Playwright Tests
        run: npx playwright test

  deploy:
    needs: quality
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [nextjs, laravel, horizon, scheduler]
    steps:
      - uses: actions/checkout@v4
      - name: Build & Deploy ${{ matrix.service }}
        run: |
          docker build -t enkai/${{ matrix.service }}:${{ github.sha }} .
          docker push enkai/${{ matrix.service }}:${{ github.sha }}
          kubectl set image deployment/${{ matrix.service }} \
            ${{ matrix.service }}=enkai/${{ matrix.service }}:${{ github.sha }}
```

---

## 14. Microservice vs Modular Monolith Recommendation

### 14.1 Recommendation: MODULAR MONOLITH FIRST

```
RECOMMENDATION: Start as a well-structured modular monolith.
                Extract to microservices only when needed.
```

### 14.2 Rationale

| Criteria | Modular Monolith | Microservices |
|----------|-----------------|---------------|
| **Time to market** | ✅ Faster (3-6 months) | ❌ Slower (12-18 months) |
| **Team size** | ✅ 3-5 engineers | ❌ 8-15+ engineers |
| **Domain complexity** | ✅ Well-bounded contexts | ❌ Adds infra complexity |
| **Data integrity** | ✅ ACID transactions across domains | ❌ Eventual consistency |
| **Financial Core** | ✅ Atomic journal entries | ❌ Distributed tx risk |
| **Multi-tenant query** | ✅ Single DB, cross-tenant queries | ❌ Federation complexity |
| **Deployment** | ✅ Single deployable | ❌ Multiple deployables |
| **Scaling** | ✅ Vertical + read replicas | ✅ Independent scaling |
| **Team autonomy** | ❌ Coordinated deploys | ✅ Independent teams |

### 14.3 Extraction Path

When the platform reaches scale (1000+ businesses, 20+ engineers), extract:

```
PHASE 1 (Monolithic — now):
  Single Laravel app + Next.js frontend
  Modules organized by domain in app/Domain/
  Shared database, shared cache

PHASE 2 (Extract Financial — when finance team grows):
  Separate Laravel app: Financial Service
  Handles: GL, AR, AP, Treasury, Tax, Reports
  API communication with main app
  Own database (financial data)
  Event-driven via shared message bus

PHASE 3 (Extract Commerce — when commerce team grows):
  Separate Laravel app: Commerce Service
  Handles: POS, Orders, Inventory, Delivery, QR
  Own database (commerce data)
  API + Events with Financial Service

PHASE 4 (Extract others as needed):
  Communication Service (email/SMS/campaigns)
  AI Service (Firdaus, workflows, recommendations)
  Search Service (Elasticsearch)
```

### 14.4 Extraction Enablers (Build Now)

These patterns must be in place from day one to enable future extraction:

```php
// 1. Domain Events — already decoupled via Event Bus
event(new OrderCreated($order)); // Works in monolith AND microservice

// 2. Repository Pattern — data access abstracted
interface OrderRepositoryInterface { ... } // Swap implementation later

// 3. API-First — all domain logic accessible via API
Route::post('/api/v1/orders', [OrderController::class, 'store']);

// 4. No cross-database joins — use service calls instead
// BAD: Order::with('inventoryBalances')->get();
// GOOD: $this->inventoryService->getStockForOrder($order);

// 5. Shared kernel for value objects
namespace App\Shared\ValueObjects;
class Money { ... }
class Email { ... }
class Address { ... }
```

---

## 15. Development Phases

### 15.1 Phase Breakdown

```
PHASE 0: Foundation (Weeks 1-4)
├── Laravel project setup + Docker
├── PostgreSQL schema migrations (core tables)
├── Authentication (register, login, password reset)
├── Tenant resolution middleware + global scope
├── RBAC (roles, permissions, seeders)
├── API route structure + response format
├── Deployment pipeline (CI/CD)
├── Testing framework (Pest + Playwright)
└── Developer documentation

PHASE 1: Platform Core (Weeks 5-8)
├── Business Type framework (models, CRUD, seeders)
├── Workspace management (CRUD, members, roles)
├── Business management (CRUD, modes, settings)
├── Branch/Store management
├── Staff management + assignments
├── User invites workflow
├── Audit logging + activity tracking
├── Feature flag system
└── Webhook engine (outgoing)

PHASE 2: Financial Core (Weeks 9-14)
├── Chart of Accounts (system accounts, CRUD)
├── Journal entries (create, approve, reverse)
├── Auto-posting service (from sales, purchases, payments)
├── Accounts Receivable (aging, dunning)
├── Accounts Payable (aging, payment runs)
├── Bank accounts + reconciliation
├── Tax engine (rates, calculation, reports)
├── Multi-currency (FX rates, conversion)
├── Financial reports (P&L, Balance Sheet, Cash Flow)
└── GL integration tests + balance verification

PHASE 3: CRM + Shared Domains (Weeks 15-18)
├── Contact management (person + organization)
├── Address management
├── Communication logging
├── Credit account management
├── Contact search + deduplication
├── Operations (tasks, schedules, teams)
├── Asset management (tracking, maintenance)
├── Notification engine (in-app, email, SMS)
├── Email template system
└── Campaign management

PHASE 4: Commerce — Catalog + Inventory (Weeks 19-24)
├── Catalog items, variants, images
├── Categories (hierarchical), Brands, Units
├── Unit conversions
├── Item assignments (branch/store)
├── Price lists + tiered pricing
├── Inventory locations
├── Inventory balances + batch tracking
├── Stock movements (automatic on sale/purchase)
├── Stock adjustments + approval workflow
├── Stock transfers (location-to-location)
├── Low stock alerts
└── Catalog bulk import/export

PHASE 5: Commerce — Procurement + Billing (Weeks 25-30)
├── Supplier management
├── Purchase orders (draft → sent → approved → received)
├── Goods received against POs
├── Direct purchases
├── Quotations (create, send, convert)
├── Invoices (generate from sale/order/quote)
├── Invoice status workflow (draft → sent → paid)
├── Recurring invoices
├── Returns + refunds
├── Expense categories
├── Expense approval workflow
└── Payment methods + payment recording

PHASE 6: Commerce — POS + Cash (Weeks 31-34)
├── POS session management (open/close)
├── POS sale creation (walk-in flow)
├── POS receipt generation (PDF)
├── Barcode scanning (catalog search)
├── Cash registers (main, petty cash, till)
├── Cash in/out transactions
├── Cash register reconciliation
└── Offline POS support (PWA)

PHASE 7: Order Management + Sales Channels (Weeks 35-40)
├── Cart model + cart session management
├── Order model (all channels)
├── Order status pipeline + state machine
├── Order → inventory reservation/release
├── Order pricing + discount engine
├── QR Storefront (public menu + add to cart)
├── QR Storefront checkout flow
├── Customer Portal (auth, dashboard, orders)
├── Customer Portal (invoices, payments, addresses)
├── Sales agent order placement
├── Payment verification workflow
├── Payment → receivable posting
└── Channel-agnostic order API

PHASE 8: Delivery + QR Commerce Complete (Weeks 41-44)
├── Delivery agent management
├── Vehicle management
├── Delivery zone configuration + pricing
├── Delivery assignment workflow
├── Proof of delivery (photo, signature)
├── Delivery route planning
├── Real-time order tracking (customer)
├── QR Commerce payment integration (mobile money)
├── Partial payment + debt management
└── Delivery analytics dashboard

PHASE 9: Sales Network (Weeks 45-48)
├── Sales hierarchy management
├── Sales profile management
├── Lead pipeline (CRUD + status transitions)
├── Lead assignment + activity tracking
├── Lead conversion flow (lead → business)
├── Commission rules engine
├── Commission ledger + approval
├── Commission payout batch processing
├── Sales targets + performance tracking
└── Sales team reports + dashboards

PHASE 10: Subscription + Wallet (Weeks 49-50)
├── Subscription plan CRUD
├── Subscription lifecycle (create, renew, suspend, cancel)
├── Wallet balance management
├── Wallet deposit requests (approval workflow)
├── Daily consumption deduction
├── Grace period + suspension automation
├── Business size + QR pricing calculation
└── Subscription reports

PHASE 11: AI + Intelligence (Weeks 51-54)
├── Firdaus workflow engine
├── Business memory (learned patterns)
├── Reorder recommendations
├── Revenue forecasting
├── Churn prediction
├── Sales trend analysis
├── Automated procurement suggestions
├── Voice assistant integration
└── AI-powered dashboards

PHASE 12: Platform Infrastructure Complete (Weeks 55-58)
├── Public REST API with API keys
├── Webhook delivery (retry, logging, dashboard)
├── Data export (CSV, Excel, PDF)
├── Data import (bulk catalog, customers)
├── Multi-language support (i18n)
├── White-label option (custom domain + branding)
├── Marketplace (future)
└── Platform scalability + performance tuning
```

### 15.2 Timeline Summary

```
Phase 0:  Foundation         │ W1-W4    │ 1 month
Phase 1:  Platform Core      │ W5-W8    │ 1 month
Phase 2:  Financial Core     │ W9-W14   │ 1.5 months
Phase 3:  CRM + Shared       │ W15-W18  │ 1 month
Phase 4:  Catalog + Inventory │ W19-W24  │ 1.5 months
Phase 5:  Procurement+Billing│ W25-W30  │ 1.5 months
Phase 6:  POS + Cash         │ W31-W34  │ 1 month
Phase 7:  Order + Channels   │ W35-W40  │ 1.5 months
Phase 8:  Delivery + QR      │ W41-W44  │ 1 month
Phase 9:  Sales Network      │ W45-W48  │ 1 month
Phase 10: Subscription       │ W49-W50  │ 0.5 months
Phase 11: AI                 │ W51-W54  │ 1 month
Phase 12: Platform Infra     │ W55-W58  │ 1 month

TOTAL: ~14 months (58 weeks)
```

---

## 16. Migration Strategy

### 16.1 From Current Codebase

```yaml
CURRENT STATE:
  - Next.js 15 (full-stack, no Laravel)
  - Prisma ORM
  - PostgreSQL
  - Better Auth
  - Direct server actions (no API layer)
  - Commerce-only focus

TARGET STATE:
  - Laravel 12 (backend API)
  - Next.js 15 (frontend only)
  - PostgreSQL (same DB, new schema)
  - Laravel Sanctum/Passport (auth)
  - REST API (public-facing)
  - Multi-industry ready
```

### 16.2 Migration Approach: Strangler Fig

```
PHASE 1: Coexistence
┌─────────────────────────────────────────────┐
│  Current Next.js App (runs as-is)           │
│  ┌────────────────────────────────────────┐ │
│  │  Current routes: /workspaces/*, /platform/* │
│  │  Current auth: Better Auth              │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  NEW Laravel API (starts alongside)         │
│  ┌────────────────────────────────────────┐ │
│  │  New routes: /api/v1/*                 │ │
│  │  New auth: Sanctum                    │ │
│  │  Migrated domains: Platform Core       │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

PHASE 2: Feature Migration
  For each feature:
    1. Build in Laravel (new schema tables)
    2. Expose REST API
    3. Update Next.js to call API instead of server actions
    4. Drop old Prisma models
    5. Decommission old code

PHASE 3: Full Cutover
  - All API calls go through Laravel
  - All Next.js server actions removed
  - Prisma removed
  - Better Auth replaced with Sanctum
  - Old codebase archived

PHASE 4: New Features Only
  - All new development in Laravel + Next.js
  - Old codebase deprecated
  - Final cleanup
```

### 16.3 Data Migration Strategy

```php
// Strategy: Write to both systems during migration, then drop old

// Step 1: Add Laravel tables alongside existing Prisma tables
// Step 2: Create sync listeners in Next.js that POST to Laravel API
// Step 3: Backfill historical data from Prisma to Laravel
// Step 4: Verify data consistency (counts, sums, balances)
// Step 5: Switch reads to Laravel
// Step 6: Drop Prisma tables

// Backfill command
class MigrateBusinessTypes extends Command
{
    public function handle(): void
    {
        // Map old Industry enum to new BusinessType model
        $industries = ['COMMERCE', 'HEALTHCARE', 'AGRICULTURE', 'MANUFACTURING', 'SERVICES'];

        foreach ($industries as $industry) {
            BusinessType::firstOrCreate([
                'slug' => Str::slug($industry),
                'name' => $industry,
            ]);
        }

        // Migrate businesses
        DB::connection('prisma_pgsql')->table('businesses')->chunk(100, function ($businesses) {
            foreach ($businesses as $old) {
                $newBusiness = Business::find($old->id);
                if (!$newBusiness) continue;

                $newBusiness->business_type_id = BusinessType::where(
                    'slug', Str::slug($old->industry ?? 'COMMERCE')
                )->first()?->id;

                $newBusiness->save();
            }
        });
    }
}
```

---

## 17. Technical Risks

### 17.1 Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|------|-----------|--------|------------|
| 1 | **Database migration complexity** — 40+ existing tables need restructuring | High | High | Strangler Fig pattern; run old + new in parallel |
| 2 | **Data integrity during migration** — financial data must balance | Medium | Critical | Every migration step has a verify-back balance check |
| 3 | **Team learning curve** — Laravel + DDD unfamiliar to Next.js-only team | High | Medium | Phase 0 dedicated to training + spikes |
| 4 | **Multi-tenant query performance** — 1000+ businesses sharing one DB | Medium | High | Index strategy; read replicas; future partitioning |
| 5 | **Eventual consistency for financials** — async posting could cause out-of-balance errors | Medium | Critical | GL queue uses sequential processing; reconciliation checks run hourly |
| 6 | **Feature parity during migration** — users expect zero downtime | High | High | Strangler Fig; feature flags; canary releases |
| 7 | **Business Type framework too generic** — may not fit all future industries | Medium | Medium | Design by known industries (Commerce, HC, Ag, Manuf, Mining) — not abstract speculation |
| 8 | **Permission scope explosion** — every module adds 10+ permissions | Medium | Low | Wildcard permissions (`catalog:*`); role templates reduce complexity |
| 9 | **Third-party payment integration** — mobile money APIs vary by country | High | Medium | Payment gateway abstraction layer; adapter pattern per provider |
| 10 | **Offline POS unreliable** — rural areas have poor connectivity | High | Medium | PWA + IndexedDB for offline queue; sync when online |

### 17.2 Key Technical Decisions

```
DECISION: Modular Monolith NOT Microservices
  RISK: Future extraction cost
  MITIGATION: Domain events + repository pattern + API-first from day one

DECISION: Shared Schema NOT Database-per-Tenant
  RISK: Query performance at scale
  MITIGATION: Read replicas, partitioning strategy, future extraction path

DECISION: Laravel NOT Node.js for backend
  RISK: Team may be Node-focused
  MITIGATION: Laravel has superior DDD tooling (Pest, PHPStan, Horizon, Telescope)

DECISION: UUIDs NOT Auto-increment
  RISK: Slightly larger indexes
  MITIGATION: UUID v7 (time-ordered) for clustered indexes

DECISION: Redis for queue NOT SQS
  RISK: No built-in DLQ retry management
  MITIGATION: Laravel Horizon manages retries; future SQS swap is config change
```

---

## 18. Implementation Roadmap

### 18.1 Milestone Map

```
Q3 2026 (Now)
├── M1: Foundation Complete (Week 4)
│   ├── Laravel project, Docker, CI/CD running
│   ├── Auth + Tenant + RBAC working
│   ├── API structure defined
│   └── Business Types seeded
│
├── M2: Platform Core Complete (Week 8)
│   ├── Workspace + Business + Branch/Store CRUD
│   ├── Staff + Invites working
│   ├── Audit logging + Activity tracking
│   └── Webhook engine ready

Q4 2026
├── M3: Financial Core Complete (Week 14)
│   ├── GL posting + journal approval
│   ├── AR/AP aging reports
│   ├── Bank reconciliation working
│   ├── Tax engine + reports
│   └── Auto-posting from sales/purchases
│
├── M4: CRM + Shared Domains Complete (Week 18)
│   ├── Contact management + addresses
│   ├── Credit accounts
│   ├── Operations (tasks, teams)
│   ├── Asset management
│   └── Notifications + Email campaigns

Q1 2027
├── M5: Catalog + Inventory Complete (Week 24)
│   ├── Full catalog CRUD + bulk import
│   ├── Price lists + tiered pricing
│   ├── Inventory balances + movements
│   ├── Stock adjustments + transfers
│   └── Low stock alerts
│
├── M6: Procurement + Billing Complete (Week 30)
│   ├── Purchase orders + goods received
│   ├── Supplier management
│   ├── Invoices + recurring invoices
│   ├── Quotations + conversion
│   ├── Returns + refunds
│   └── Expense approval workflow

Q2 2027
├── M7: POS + Cash Complete (Week 34)
│   ├── POS sessions + sales
│   ├── Cash registers + transactions
│   ├── Receipt generation
│   └── Barcode scanning
│
├── M8: Order Management + Channels Complete (Week 40)
│   ├── Cart + Order engine (all channels)
│   ├── QR Storefront (public + checkout)
│   ├── Customer Portal (full self-service)
│   ├── Payment verification
│   └── Order → GL auto-posting

Q3 2027
├── M9: Delivery Complete (Week 44)
│   ├── Delivery agents + vehicles
│   ├── Zones + pricing
│   ├── Assignment + dispatch workflow
│   ├── Proof of delivery
│   └── Real-time tracking
│
├── M10: Sales Network Complete (Week 48)
│   ├── Hierarchy + profiles
│   ├── Lead pipeline + conversion
│   ├── Commission engine
│   └── Performance dashboards

Q4 2027
├── M11: Subscription + AI Complete (Week 54)
│   ├── Subscription lifecycle + wallet
│   ├── Firdaus workflows + memory
│   ├── Reorder + revenue forecasts
│   └── AI-powered insights
│
├── M12: Platform Complete (Week 58)
│   ├── Public API + webhooks
│   ├── Data export/import
│   ├── Multi-language
│   ├── Performance optimization
│   └── Production readiness review
```

### 18.2 Team Structure

```
PHASE 0-6 (Foundation → POS):  3-5 engineers
  - 1x Tech Lead / Architect
  - 1x Senior Backend (Laravel)
  - 1x Senior Frontend (Next.js)
  - 1x Full-stack Engineer
  - 1x QA / DevOps (shared)

PHASE 7-12 (Orders → Platform):  6-10 engineers
  - 1x Tech Lead / Architect
  - 2x Senior Backend (Laravel)
  - 1x Backend (financial domain focus)
  - 2x Senior Frontend (Next.js)
  - 1x Frontend (customer-facing)
  - 1x DevOps / Infrastructure
  - 1x QA Engineer
  - 1x Product Manager
```

### 18.3 Key Success Metrics

```
MILESTONE METRICS:
  Phase 0-1: Platform Core
    → User can register, create workspace, create business, invite staff
    → 100% test coverage on auth + RBAC

  Phase 2: Financial Core
    → Journal entry balances verified (100% pass)
    → Auto-posting matches manual calculation
    → AR/AP aging reports match invoice data

  Phase 4-5: Catalog + Procurement
    → 10,000 catalog items load in <2s
    → Purchase order → goods received → stock update in <5s

  Phase 7: Orders
    → QR scan → browse → cart → checkout → order created <30s
    → Order → inventory reservation in <1s
    → Order → delivery assignment in <3s

  Phase 8: Delivery
    → Agent dispatch within 60s of order confirmation
    → Proof of delivery captured in <10s

  Phase 10: Subscription
    → Daily consumption processed for 1,000 businesses in <60s
    → Grace period → suspension automated with zero data loss

  QUALITY METRICS:
    → PHPStan level 8 (no errors)
    → Test coverage >85%
    → API response time p95 <200ms
    → Zero financial reconciliation errors
    → Uptime >99.9%
```

---

## Appendix A: Technology Stack Detail

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Backend** | Laravel 12 | DDD-friendly, queues, events, testing, maturity |
| **Frontend** | Next.js 15 | SSR, file-based routing, React ecosystem, existing codebase |
| **Database** | PostgreSQL 16 | JSON support, partitioning, CTEs, maturity |
| **Cache** | Redis 7 | Queue backend, session store, rate limiting |
| **Queue** | Laravel Horizon + Redis | Job monitoring, auto-scaling workers |
| **Auth** | Laravel Sanctum | SPA tokens, API tokens, customer tokens |
| **Search** | PostgreSQL FTS (v1) → Elasticsearch (v2) | Start simple, scale when needed |
| **Files** | S3-compatible (MinIO/dev, AWS S3/prod) | Standard object storage |
| **Monitoring** | Laravel Pulse + Sentry | Production observability |
| **CI/CD** | GitHub Actions | Existing repository |
| **Container** | Docker + Kubernetes (scaled) | Portability, auto-scaling |
| **Testing** | Pest (PHP) + Playwright (E2E) | Modern, expressive, fast |

## Appendix B: Code Quality Standards

```php
// Every method must:
// 1. Have a single responsibility
// 2. Be <30 lines (with exceptions documented)
// 3. Throw typed exceptions (not generic \Exception)
// 4. Be covered by a test

// Every class must:
// 1. Have a single reason to change (SRP)
// 2. Depend on interfaces, not concretions
// 3. Be at PHPStan level 8

// Every domain must:
// 1. Have Entities, ValueObjects, Services, Events
// 2. Never depend on another domain's internal classes
// 3. Communicate via Events (async) or Interfaces (sync)

// Naming:
// Actions: {Verb}{Noun}Action — PlaceOrderAction
// Services: {Noun}Service — OrderPricingService
// Repositories: {Noun}Repository — OrderRepository
// Events: {Noun}{PastTenseVerb} — OrderCreated
// Listeners: {Verb}{Noun}On{Event} — ReserveInventoryOnOrderConfirmed
// Exceptions: {Noun}{Problem}Exception — InsufficientInventoryException
```

## Appendix C: Glossary

| Term | Definition |
|------|-----------|
| **Business Type** | Industry classification (Commerce, Healthcare, Agriculture, etc.) that defines available modules and modes |
| **Business Mode** | Operational mode within a Business Type (Retail, Wholesale, Clinic, Hospital, Farm) |
| **Sales Channel** | How an order enters the system (POS, QR Storefront, Customer Portal, Sales Agent, API) |
| **Tenant** | A Business — the unit of isolation in the multi-tenant system |
| **Aggregate** | DDD concept — a cluster of domain objects treated as a single unit with an invariant boundary |
| **Domain Event** | Something meaningful that happened in the domain, published for other contexts to react to |
| **Auto-posting** | Automatic creation of journal entries in the General Ledger from operational transactions |
| **Strangler Fig** | Migration pattern where old and new systems run in parallel, with features gradually moved to the new system |
| **Modular Monolith** | A single deployable application where code is organized into strongly-separated modules (not services) |
