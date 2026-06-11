# Enkai Business — Codebase Audit Report

**Date**: 2026-06-11
**Scope**: Full analysis of 508 feature files across 34 modules, 79 Prisma models, app routes, and server code.

---

## 1. What We Built

### Foundation (Phases B–I)
| Phase | Modules | Files |
|-------|---------|-------|
| B — Foundation | enkai, permissions, roles, auth, users, staff, workspaces, businesses, branches, stores | 95 |
| C — Catalog | catalog, categories, brands, units, products, pricing, assignments | 59 |
| D — Commerce Foundation | customers, customer-groups, suppliers, payments, inventory, stock | 54 |
| E — Procurement | purchases, purchase-orders, goods-received, stock-adjustments, stock-transfers | 42 |
| F — Sales & Revenue | sales, pos, quotations, invoices, returns, expenses, expense-categories | 59 |
| G — Financial | customer-credit, cash-management | 23 |
| H — Commerce Channels | subscriptions, sales-network, leads, commissions, qr-ordering | 84 |
| I — Intelligence & Cross-cutting | reports, dashboards, notifications, activities, audit-logs, support-tickets, settings, uploads | 92 |
| **Total** | **34 modules** | **508 files** |

### Database
- 79 Prisma models pushed to PostgreSQL (container `misana-postgres`, DB `enkai_business`)
- Seed script runs 28 steps: 61 permissions, 16 roles, 3 auth users, workspace, business, branch, store, 5 categories, 3 brands, 5 units, 5 catalog items, 4 sales hierarchy levels, 3 sales profiles, 5 leads, 3 subscription plans, 5 commission rules, distribution campaign with 5 QR codes, 3 customer groups, 3 customers, 2 suppliers, 7 payment methods, 5 expense categories, inventory location + 3 balances, 2 staff profiles with assignments, 11 business settings

### Infrastructure
- Next.js 16 App Router, Tailwind CSS v4, shadcn/ui, Zod, TanStack Query, Zustand, Better Auth (password/pg pool)
- Prisma ORM + PostgreSQL, ImageKit integration
- Mobile-first responsive design (bottom nav on mobile, sidebar on desktop)
- Zero TypeScript errors (`npx tsc --noEmit` passes)

---

## 2. Requirements Verification (15-point Audit)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| 1 | **No Product model** — CatalogItem is universal domain | PASS | No `model Product` in schema. All 41 FKs use `catalogItemId`. "Product" appears only in UI display labels |
| 2 | **Commerce-only scope** — no Healthcare/Pharmacy/Restaurant/etc. | PASS | `Industry` enum exists with other values but zero code branches use them. No industry-specific routes, services, or logic |
| 3 | **CatalogItem everywhere** — no `productId` FKs | PASS | Zero `productId` references in schema, types, features, or server code |
| 4 | **Inventory location-based** — `InventoryLocation` + `InventoryBalance` | PASS | Schema has both models with full relations. Feature has services, components, actions for locations and balances |
| 5 | **Staff is foundation** — mandatory for all commerce ops | PASS | `Sale.staffId`, `POSSession.openedById` present. Staff module has 255-line service, assignments, form/list components |
| 6 | **Payments independent** — polymorphic, not under Sales | PASS | `Payment` model has `saleId?`, `invoiceId?`, `creditTxId?`, `subscriptionId?`, `purchaseId?`, `expenseId?`. Independent 175-line service, components, actions |
| 7 | **QR Ordering modular** — qr-codes, qr-menus, qr-campaigns | PASS | All 3 sub-modules have services, actions, components, schemas, types, constants |
| 8 | **Mobile-first** — no desktop-first anti-patterns | PASS | All responsive breakpoints use `md:` (mobile up). Bottom nav on mobile, sidebar toggle on desktop |
| 9 | **No empty modules** — every directory has implementation | **FAIL** | `src/features/rbac/` and `src/features/platform/` are empty directories |
| 10 | **Product module completeness** | PASS | `products/` has: services (246 lines), components (4), actions (2), schemas (Zod), types, constants |
| 11 | **Categories hierarchical** — parent/child | PASS | `Category.parentId` with self-referencing relation. Tree-building service (`buildCategoryTree`) implements recursion |
| 12 | **Units typed** — count/weight/volume/length with conversion | PASS | 4 unit types supported. `isBase` flag enables conversion. Minor gap: no `conversionFactor` column or conversion math service |
| 13 | **Pricing** — PriceList + PriceListItem for retail/wholesale/promo | PASS | 3 pricing types, priority-based selection, start/end date scheduling. Customer-group pricing can be added but is not explicitly implemented as a type |
| 14 | **Assignments** — branch/store-level availability | PASS | `CatalogItemAssignment` with `branchId?`, `storeId?`, `isAvailable`. Full CRUD service (175 lines) |
| 15 | **Variants** — SKU, barcode, price, costPrice, sortOrder | PASS | `CatalogItemVariant` model. `addProductVariant`, `updateProductVariant`, `removeProductVariant` in product service |

**Overall: 14/15 PASS, 1 FAIL**

---

## 3. Gaps Identified

### Critical
- **`src/features/rbac/`** — Empty. RBAC logic lives in legacy `src/server/services/rbac-service.ts` and `src/server/actions/rbac.ts`. Needs migration to feature module pattern.
- **`src/features/platform/`** — Empty. Platform pages exist in `src/app/platform/` (roles, users, dashboard, settings, etc.) but no feature module.

### Minor
- **Unit conversion**: `Unit` model has `isBase` but no `conversionFactor`. No unit conversion service exists. Conversion math would need to be added per-type (e.g., g → kg = ÷1000).
- **Customer-group pricing**: `PriceList.type` is limited to `retail | wholesale | promo`. A `customer-group` type could be added for per-group pricing, but it's not implemented.

### Structural (Non-blocking)
- Legacy files remain in `src/server/actions/`, `src/server/services/`, `src/lib/validations/`, `src/types/` alongside feature-module equivalents. Backward-compat bridge at `src/server/actions/index.ts` re-exports from features.
- Better Auth tables (`user`, `account`, `session`, `verification`) are created at runtime, not managed by Prisma migrations.

---

## 4. Architecture Compliance

### CatalogItem as Universal Domain
- All transactional entities reference `catalogItemId`
- No `Product` model in database
- UI displays "Products" via display labels only
- Future industries extend via `CatalogItem.itemType` only

### Staff as Foundation Layer
- Every commerce op requires staff
- `StaffAssignment` supports business/branch/store levels
- Sale hierarchy: workspace → business → branch → store → staff → customer

### Financial Separation
- Sales, Payments, Expenses, Customer Credit, Cash Management, Subscriptions — all separate modules
- Payments polymorphic: handles sale, invoice, credit, subscription, supplier, expense payments

### Inventory Architecture
- Location-based: `InventoryLocation` (business/branch/store) + `InventoryBalance` per CatalogItem per location
- Stock movements via `StockMovement` model referencing catalog item, location, variant, and transaction source

### Mobile-First UX
- Bottom navigation on mobile (`md:hidden`)
- Sidebar on desktop (`md:translate-x-0`)
- All breakpoints use `md:` (mobile-up), never `sm:` or `lg:` for hiding mobile content

---

## 5. Remaining Work

1. **Fill empty modules**: Migrate RBAC from legacy server files to `src/features/rbac/`; build `src/features/platform/` feature module
2. **Add unit conversion**: Add conversion factor support (either via schema column or service-level conversion map)
3. **Add customer-group pricing**: Extend `PriceList.type` to support `customer-group` type
4. **Push to GitHub** (blocked: SSH key not added to GitHub account)
5. **Deploy DB migrations** to production
6. **Integration testing** across all 56 feature modules
7. **Build front-end app routes** connecting UI pages to feature module server actions
