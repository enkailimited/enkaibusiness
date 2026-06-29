# Phase 1: Business Type Layer, Shared Catalog, Shared CRM

## Overview

Phase 1 establishes three foundational layers that enable Enkai Commerce to
support multiple industries without future refactoring:

1. **Business Type Layer** — replaces static `Industry` enums with
   database-driven business types that control available modes, modules, and
   catalog types.
2. **Shared Catalog Domain** — introduces catalog attributes and item-level
   attribute values, and links catalog items to catalog types.
3. **Shared CRM Domain** — adds a generic contact/organization/address/
   communication layer that the existing `Customer` model can consume.

All changes are **backward compatible**. Existing fields and enums remain
in place. New columns are nullable.

---

## 1. Business Type Layer

### New Models

| Model | Table | Purpose |
|---|---|---|
| `BusinessType` | `business_types` | Replaces the static `Industry` enum. Defines a type of business (Commerce, Healthcare, etc.). |
| `BusinessTypeMode` | `business_type_modes` | Operating modes available for a business type (e.g. retail, wholesale). |
| `BusinessTypeModule` | `business_type_modules` | Feature modules available/required for a business type (e.g. catalog, inventory, sales). |
| `CatalogType` | `catalog_types` | Catalog item kinds for a business type (Commerce: Product, Service). |

### Relations

```
BusinessType
  → BusinessTypeMode[]
  → BusinessTypeModule[]
  → CatalogType[]
  → Business[](via businessTypeId)
```

### Existing Business Model Changes

Added nullable `businessTypeId` column to `Business`. The `Industry` enum
and `BusinessMode` model are preserved for backward compatibility.

### Seed Data

A single Commerce business type is seeded with:

- **Modes**: retail, wholesale, both
- **Modules**: catalog (req), inventory (req), sales (req), pos, purchases,
  expenses, customers (req), suppliers, invoices, quotations, payments (req),
  subscriptions (req), reports (req), qr_ordering, delivery, returns
- **Catalog Types**: product, service

---

## 2. Shared Catalog Domain

### New Models

| Model | Table | Purpose |
|---|---|---|
| `CatalogAttribute` | `catalog_attributes` | Reusable attribute definitions per business (e.g. "Color", "Size", "Material"). Supports text, number, boolean, select, and date types. |
| `CatalogItemAttribute` | `catalog_item_attributes` | Attribute values assigned to specific catalog items. |

### Existing CatalogItem Changes

Added nullable `catalogTypeId` column to `CatalogItem`, linking it to the
`CatalogType` model.

### Relations

```
CatalogType
  → CatalogItem[]
  → CatalogAttribute[]

CatalogItem
  → CatalogItemAttribute[]
  → CatalogType?(foreign key)

CatalogAttribute
  → CatalogItemAttribute[]
  → CatalogType?(foreign key)
```

### Constants

`src/features/catalog/constants/index.ts` now exports:
- `COMMERCE_CATALOG_TYPES` — `{ PRODUCT: "product", SERVICE: "service" }`
- `CATALOG_TYPE_LABELS` — display labels for catalog type slugs

### Zod Schema

`createCatalogItemSchema` now accepts optional `catalogTypeId` (UUID).

---

## 3. Shared CRM Domain

### New Feature Module: `src/features/crm/`

Complete standalone feature module with:

```
src/features/crm/
├── index.ts              # Barrel exports
├── constants/
│   └── index.ts           # Contact types, address types, communication types
├── types/
│   └── index.ts           # ContactWithRelations, CreateContactInput, etc.
├── schemas/
│   └── index.ts           # Zod validation schemas
└── services/
    └── contact-service.ts # createContact, updateContact, getContact, listContacts, deleteContact
```

### New Models

| Model | Table | Purpose |
|---|---|---|
| `Contact` | `contacts` | Generic person record — first name, last name, email, phone, title, linked to organization. |
| `Organization` | `organizations` | Company or entity record — name, email, phone, tax ID, website. |
| `Address` | `addresses` | Multi-type address (billing, shipping, physical, postal) linked to a contact. |
| `CommunicationLog` | `communication_logs` | Log of email, SMS, call, note, or meeting interactions with a contact. |

### Relations

```
Business
  → Contact[]
  → Organization[]

Organization
  → Contact[]

Contact
  → Organization?(foreign key)
  → Address[]
  → CommunicationLog[]
  → Customer?(optional one-to-one)

Customer
  → Contact?(optional one-to-one — new contactId column)
```

### Existing Customer Changes

Added nullable `contactId` column (unique) to `Customer`, linking it to
`Contact`. This enables the CRM and Customer domains to share data while
keeping the existing `Customer` interface intact.

### New Constants

| Export | Values |
|---|---|
| `CONTACT_TYPES` | `["individual", "organization"]` |
| `ADDRESS_TYPES` | `["billing", "shipping", "physical", "postal"]` |
| `COMMUNICATION_TYPES` | `["email", "sms", "call", "note", "meeting"]` |
| `COMMUNICATION_DIRECTIONS` | `["inbound", "outbound"]` |
| `DEFAULT_COUNTRY` | `"Tanzania"` |

---

## Database Migration

**Migration name**: `20260623000000_phase1_business_type_catalog_crm`

Creates tables:
- `business_types`
- `business_type_modes`
- `business_type_modules`
- `catalog_types`
- `catalog_attributes`
- `catalog_item_attributes`
- `contacts`
- `organizations`
- `addresses`
- `communication_logs`

Adds columns:
- `businesses.business_type_id` (nullable, FK → business_types)
- `catalog_items.catalog_type_id` (nullable, FK → catalog_types)
- `customers.contact_id` (nullable, unique, FK → contacts)

---

## Files Changed

### Prisma / Database
| File | Change |
|---|---|
| `prisma/schema.prisma` | New models + nullable FK columns on existing models |
| `prisma/seed.ts` | Commerce business type with modes, modules, catalog types |
| `prisma/migrations/20260623000000_phase1_business_type_catalog_crm/` | Migration SQL + lock file |

### Types
| File | Change |
|---|---|
| `src/types/models.ts` | `BusinessType`, `BusinessTypeMode`, `BusinessTypeModule`, `CatalogType`, `CatalogAttribute`, `CatalogItemAttribute`, `Contact`, `Organization`, `Address`, `CommunicationLog` interfaces; added `businessTypeId` to `Business`, `catalogTypeId` to `CatalogItem` |
| `src/types/index.ts` | Export new types |

### Businesses Module
| File | Change |
|---|---|
| `src/features/businesses/schemas/index.ts` | Added optional `businessTypeId` to `createBusinessSchema` |
| `src/features/businesses/services/business-service.ts` | Pass `businessTypeId` to Prisma create |
| `src/features/businesses/types/index.ts` | No change needed (inherits from updated `Business`) |

### Catalog Module
| File | Change |
|---|---|
| `src/features/catalog/constants/index.ts` | Added `COMMERCE_CATALOG_TYPES`, `CATALOG_TYPE_LABELS` |
| `src/features/catalog/schemas/index.ts` | Added optional `catalogTypeId` |
| `src/features/catalog/types/index.ts` | Added `catalogTypeId` to input types |
| `src/features/catalog/services/catalog-service.ts` | Pass `catalogTypeId` to Prisma create |

### Customers Module
| File | Change |
|---|---|
| `src/features/customers/schemas/index.ts` | Added optional `contactId` |
| `src/features/customers/types/index.ts` | Added `contactId` to `Customer` and `CreateCustomerInput` |
| `src/features/customers/services/customer-service.ts` | Pass `contactId` to Prisma create |

### New: CRM Module
| File | Purpose |
|---|---|
| `src/features/crm/index.ts` | Barrel exports |
| `src/features/crm/constants/index.ts` | CRM constants |
| `src/features/crm/types/index.ts` | CRM interfaces |
| `src/features/crm/schemas/index.ts` | Zod validation |
| `src/features/crm/services/contact-service.ts` | Contact CRUD service |

---

## Backward Compatibility

| Concern | Strategy |
|---|---|
| `Industry` enum still in use | Kept in schema. Existing `BusinessMode.industry` continues to work. |
| Existing `businesses` have no `businessTypeId` | Column is nullable. Queries that don't need business type are unaffected. |
| Existing `catalog_items` have no `catalogTypeId` | Column is nullable. `itemType` enum still drives behavior. |
| Existing `customers` have no `contactId` | Column is nullable. Customer CRUD works without contacts. |
| `createBusinessSchema` still requires `industry` | `businessTypeId` is optional. Both fields can coexist. |
| Existing server actions that call `requireAuth()` only | Unchanged. No new permission gates added. |

---

## Seed Data

The Commerce business type is upserted by slug (`"commerce"`):

```
BusinessType: Commerce
├── Modes: retail, wholesale, both
├── Modules (16):
│   ├── Required: catalog, inventory, sales, customers, payments,
│   │             subscriptions, reports
│   └── Optional: pos, purchases, expenses, suppliers, invoices,
│                 quotations, qr_ordering, delivery, returns
└── CatalogTypes: product, service
```

Run with: `npx tsx prisma/seed.ts`

---

## Future Industry Extension

To add a new business type (e.g. Healthcare):

1. Insert a row into `business_types`
2. Insert rows into `business_type_modes` (e.g. clinic, pharmacy, hospital)
3. Insert rows into `business_type_modules` (which features are available)
4. Insert rows into `catalog_types` (e.g. medicine, procedure, consultation)
5. Set `businesses.business_type_id` when creating healthcare businesses
6. Set `catalog_items.catalog_type_id` when creating healthcare catalog items

No schema changes required. No enum migrations. No code changes beyond adding
industry-specific UI and validations.
