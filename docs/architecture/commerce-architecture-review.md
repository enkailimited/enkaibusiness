# Commerce Architecture Review

**Date**: 2026-06-12  
**Author**: Lead Architect  
**Context**: V6.0 analysis of whether the current platform supports a unified Retail + Wholesale commerce model (not separated into modes).

---

## Business Model Requirements

1. Commerce is NOT separated into Retail Mode and Wholesale Mode.
2. A single business can operate: Retail only, Wholesale only, or both simultaneously.
3. Products, inventory, customers, payments, sales and QR ordering are shared.
4. Pricing determines behavior — retail customers see retail prices, wholesale customers see wholesale prices, same catalog, same inventory.
5. QR Ordering supports: retail delivery, wholesale B2B, restaurant, general commerce.
6. Business owners are never forced to choose one mode.

---

## Verdict

**The architecture is approximately 60% toward this goal.** Foundational data models exist but are disconnected. The pricing engine is defined but completely unused. QR ordering has services but zero UI routes.

---

## 1. What Already Works

### Customer Typing — Complete
- `Customer.customerType` field: `"retail" | "wholesale" | "walk_in"`
- Full UI support: form dropdown, list badge, filter, Zod schema, constants

### Price Lists — Complete
- `PriceList.type` field: `"retail" | "wholesale" | "promo"`
- Priority-based resolution, date ranges, active flags
- Per-item `minQuantity` for wholesale tiers

### Multiple Business Modes — Complete
- `BusinessMode` model allows `(COMMERCE, "retail")` + `(COMMERCE, "wholesale")` simultaneously
- Unique constraint: `[businessId, industry, mode]`
- 6 industries supported: COMMERCE, HEALTHCARE, RESTAURANT, MANUFACTURING, AGRICULTURE, SERVICES

### Shared Catalog & Inventory — Complete
- Single `CatalogItem` model (no retail/wholesale product split)
- Single `InventoryBalance` per location (shared stock pool)
- `CatalogItemAssignment` controls branch/store availability

### QR Ordering Data Models — Complete
- `QRCode`, `QRMenuItem`, `DistributionCampaign` with full lifecycle
- Full CRUD services for QR codes, menus, campaigns
- Assignment, installation, and activation workflow

### Payments — Complete
- Single polymorphic `Payment` model handles all transaction types (sale, invoice, credit, subscription, purchase, expense)

---

## 2. What's Missing or Broken

### 2.1 Sale Model Has No Transaction Type — HIGH IMPACT

The `Sale` model has **no field** indicating retail vs wholesale. Currently the only way to distinguish is joining through `Customer.customerType`.

**Problems:**
- No direct query on sale type — every report requires a join through Customer
- No mixed-transaction tracking (e.g., a retail customer buying at wholesale prices)
- No per-line pricing tier tracking

**Fix needed:** Add `pricingTier` field to `Sale` and/or `SaleItem`.

### 2.2 Pricing Engine Is Completely Disconnected — HIGH IMPACT

`resolvePrice()` in `src/features/customer-groups/services/pricing-service.ts` implements tier priority:
```
customer_group > promo > wholesale > retail (base price fallback)
```

**This function is imported by zero files across the entire codebase.** The actual sale creation flow does not use it.

**Problems:**
- Pricing engine doesn't verify `Customer.customerType` matches `PriceList.type`
- A retail customer can get wholesale prices simply by meeting `minQuantity`
- `calculateCartTotal()` exists but is never called during sale creation

**Fix needed:** Wire `resolvePrice()` into sale creation with customer-type validation.

### 2.3 QR Ordering Has No UI Routes — MEDIUM IMPACT

The QR ordering feature module has **28 files** with fully implemented services, types, constants, and React components — but **zero app routes**. No pages exist under `workspaces/businesses/[businessId]/qr-ordering/`.

Additionally:
- No integration with the pricing engine
- No customer-type scoping for QR menus
- No way to specify "this QR menu is for retail" vs "for wholesale"

**Fix needed:** Create route pages and add customer-type awareness.

### 2.4 BusinessMode Is Not Used at Runtime — MEDIUM IMPACT

`BusinessMode` is set during business creation but never checked during:
- Customer creation (can a "retail-only" business create wholesale customers?)
- Sale creation (is this commerce mode active?)
- Price list creation (is wholesale pricing allowed?)
- QR ordering (which modes are available?)

**Fix needed:** Add runtime validation service that references `BusinessMode`.

### 2.5 No Unified Commerce Module — MEDIUM IMPACT

Retail/wholesale logic is scattered across:
- `src/features/customers/` — customer types
- `src/features/catalog/pricing/` — price list types
- `src/features/customer-groups/` — pricing engine (imported by zero files)
- `src/features/sales/` — sale creation (no type awareness)
- `src/features/qr-ordering/` — QR menus (no type awareness)
- `src/features/businesses/` — BusinessMode config

**Fix needed:** Create `src/features/commerce/` as a coordinator facade.

### 2.6 Contradictory Mode Definitions — LOW IMPACT

- `src/types/enums.ts`: `INDUSTRY_MODES.COMMERCE = ["RETAIL", "WHOLESALE"]` (UPPERCASE)
- `src/features/businesses/constants/index.ts`: `BUSINESS_MODES.COMMERCE = ["retail", "wholesale", "both"]` (lowercase + extra "both")

**Fix needed:** Unify to lowercase `"retail"` / `"wholesale"` across both constants.

---

## 3. Database Changes Required

| # | Change | Reason |
|---|---|---|
| 1 | Add `pricingTier` field to `Sale` | `String?` — values: `"retail"`, `"wholesale"`, `"promo"`, `"customer_group"`, `null`. Records which pricing tier was used |
| 2 | Add `pricingTier` field to `SaleItem` | Same values, allows per-line-item tier tracking for mixed transactions |
| 3 | Add optional `customerType` to `PriceList` | `String?` — optionally restrict a price list to a specific customer type. Backward compatible (null = applies to all) |
| 4 | Add optional `mode` field to `QRCode` | `String?` — scope a QR code to `"retail"` or `"wholesale"` ordering |
| 5 | Change `Customer.customerType` to Prisma enum | Currently String. Use `CustomerType` enum for type safety |
| 6 | Normalize mode constant case | Pick lowercase across `INDUSTRY_MODES` and `BUSINESS_MODES` |

**No changes needed to:** `CatalogItem`, `InventoryBalance`, `InventoryLocation`, `Category`, `Brand`, `Unit`, `Payment`, `PaymentMethod` — these are already mode-agnostic.

---

## 4. Service Changes Required

| # | Change | Priority |
|---|---|---|
| 1 | Wire `resolvePrice()` into sale creation | **Critical** — `sale-service.ts` must call pricing engine, resolve per-item prices, store `pricingTier` on `Sale` + `SaleItem` |
| 2 | Add customer-type validation to pricing engine | **High** — `resolvePrice()` should accept `customerType` param. If `PriceList` has `customerType` restriction, only return matching prices |
| 3 | Create `CommerceService` facade | **High** — unified orchestrator: customer lookup → price resolution → sale creation → inventory deduction → payment → audit. Firdaus workflows should call this |
| 4 | Add mode validation service | **Medium** — `validateBusinessMode(businessId, industry, mode): boolean` before creating wholesale customers/price lists |
| 5 | Add QR ordering customer-type support | **Medium** — filter `QRMenuItem` visibility by customer type. QR landing page shows appropriate prices |
| 6 | Add pricing-tier-based reporting | **Low** — `RevenueEngine` splits reports by `pricingTier` on Sale |

---

## 5. UI Changes Required

| # | Change | Priority |
|---|---|---|
| 1 | Create QR ordering route pages | **High** — routes under `workspaces/businesses/[businessId]/qr-ordering/` |
| 2 | Add pricing tier to sale form | **Medium** — show applied tier per line item. Call `calculateCartTotal()` before confirming |
| 3 | Add customer type to price list form | **Medium** — optional dropdown to restrict price list to `"retail"` or `"wholesale"` |
| 4 | Add mode filter to reports | **Low** — tabs to switch between retail / wholesale / all in reports |
| 5 | Build QR ordering landing page | **Medium** — detect customer type (query param or config) and show appropriate prices |

---

## 6. Risks and Design Issues

### Risk 1: Pricing Engine Is Unused
`resolvePrice()` with its tier priority is tested but never called. **Any sale created today bypasses the pricing engine entirely.** Wiring this in is the highest-priority fix.

### Risk 2: No Transaction-Type Audit Trail
Without a `pricingTier` field on `Sale`, the V6 Revenue Intelligence Engine and Business Health Score cannot distinguish retail from wholesale performance.

### Risk 3: QR Ordering Scope Creep
28 files, 0 routes. The intended model (retail delivery, wholesale B2B, restaurant, general commerce) significantly expands scope. Current `QRMenuItem` only links QR code → catalog item with `isAvailable`. No concept of:
- Customer-type-restricted menus
- Time-of-day availability (restaurants)
- Delivery zones/fees
- Order workflow (cart → checkout → payment → fulfillment)

### Risk 4: BusinessMode Is a Config Artifact
Populated at business creation, never referenced at runtime. A "retail-only" business could still create wholesale customers and price lists.

### Risk 5: Contradictory Mode Definitions
`INDUSTRY_MODES` uses UPPERCASE, `BUSINESS_MODES` uses lowercase + includes `"both"`. Likely to cause validation bugs.

### Risk 6: No Per-Line Pricing Tier
A single sale can contain items at different tiers (e.g., 10 cases wholesale + 2 bottles retail). Without `pricingTier` on `SaleItem`, this cannot be audited or reported.

---

## 7. Recommended Implementation Order

| Phase | Work | Depends On |
|---|---|---|
| **Phase 1** (DB) | Add `pricingTier` to `Sale` + `SaleItem`, add `customerType` to `PriceList`, normalize mode constants | Nothing |
| **Phase 2** (Services) | Wire `resolvePrice()` into sale creation, add customer-type validation, create `CommerceService` facade | Phase 1 |
| **Phase 3** (UI) | QR ordering routes, pricing tier display on sale form, customer type on price list form | Phase 2 |
| **Phase 4** (Reporting) | Mode filter in RevenueEngine, pricing-tier reports in HealthScore | Phase 1 |
| **Phase 5** (QR expansion) | Customer-type scoping for QR codes, QR landing page with price resolution | Phase 3 |

---

## 8. Status by Requirement

| Requirement | Status |
|---|---|
| Commerce NOT separated into modes | ✅ Already unified — single catalog, single inventory |
| Simultaneous retail + wholesale | ✅ `BusinessMode` supports both |
| Shared products, inventory, customers | ✅ Already shared |
| Pricing determines behavior | ⚠️ Engine exists but **unused** |
| QR supports retail/wholesale/restaurant/general | ⚠️ Models exist, services exist, **zero routes/UI** |
| Never forced to choose one mode | ✅ `BusinessMode` allows multiple |

**Minimum critical path:** Phase 1 + Phase 2 (schema changes + wire pricing engine). Everything else improves the experience but does not block the core model.
