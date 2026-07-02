# 1. SYSTEM ARCHITECTURE — ENKAI Universal Customer Experience Platform

## Overview

ENKAI evolves from a Commerce ERP into a **4-application platform** serving all
industries through a shared core. Every industry resolves dynamically via the
Industry Engine — no hardcoded business logic.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SHARED CORE (Monorepo)                        │
│  Industry Engine │ Event Bus │ Job Queue │ Notification Engine       │
│  RBAC │ Workflow │ Firdaus AI │ Subscription │ Payment Engine        │
│  Catalog Engine │ Search │ UoM │ Pricing │ Inventory │ Tax │ Promo   │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────────┐
        ▼              ▼              ▼                  ▼
┌───────────────┐ ┌────────┐ ┌──────────────┐ ┌──────────────────┐
│  ERP Workspace│ │Customer│ │   Storefront  │ │   Public APIs    │
│  (Next.js)    │ │  App   │ │  (Next.js)    │ │   (tRPC/REST)    │
│               │ │(Mobile │ │              │ │                  │
│  Owners       │ │ / Web) │ │ per-business │ │  3rd-party       │
│  Managers     │ │        │ │              │ │  integrations    │
│  Staff        │ │ Guest  │ │ branded      │ │                  │
│  Cashiers     │ │ Auth   │ │ domain or    │ │  Webhooks        │
│  Teachers     │ │ Browse │ │ subdomain    │ │  API Keys        │
│  Doctors      │ │ Order  │ │              │ │  Rate Limited    │
│  Waiters      │ │ Book   │ │ shop.        │ │                  │
│  Distributors │ │ Pay    │ │ clinic.      │ │                  │
└───────────────┘ └────────┘ └──────────────┘ └──────────────────┘
```

## Application Boundaries

### 1. ERP Workspace
- **Path:** `src/app/workspaces/` (existing)
- **Users:** Business owners, managers, employees, distributors
- **Auth:** Better Auth (email + password)
- **Scope:** Full CRUD on business data
- **UI:** Dashboard, forms, tables, reports

### 2. Customer App (NEW)
- **Path:** `src/app/customer/` or separate Next.js instance
- **Users:** End customers (guests, registered)
- **Auth:** OTP, social login, email + password
- **Scope:** Customer-facing only — browse, order, book, pay, track
- **UI:** Mobile-first, industry-adaptive, no ERP internals

### 3. Public Storefront (NEW)
- **Path:** `src/app/storefront/` or per-business subdomain
- **Users:** Public (no auth required for browsing)
- **Scope:** Business catalog, services, booking, ordering
- **Domains:** `[business].enkai.app` or custom domain

### 4. Public APIs (NEW)
- **Path:** `src/app/api/public/`
- **Users:** Third-party integrators
- **Auth:** API Key + JWT
- **Scope:** Limited, rate-limited, documented

## Communication Layer

```
┌──────────┐     Events     ┌──────────┐
│  Service │ ──────────────▶│Event Bus │──▶ Poison Queue
│  Layer   │                │(DB-bkd)  │──▶ Retry (3x)
└──────────┘                └────┬─────┘
                                 │
                          ┌──────▼──────┐
                          │  Job Queue  │
                          │  (pg-boss)  │
                          │             │
                          │ Email Wkr   │
                          │ Notif Wkr   │
                          │ Analytics   │
                          │ Report Wkr  │
                          └─────────────┘
```

## Industry Resolution Chain

Every request resolves through this chain:

```
Business ID
    │
    ▼
Industry Engine.getIndustry(businessId)
    │
    ├── Industry (COMMERCE | HEALTHCARE | EDUCATION | ...)
    ├── Business Mode (retail | clinic | school | ...)
    ├── Enabled Modules [catalog, inventory, sales, ...]
    ├── Catalog Type [product, service, medicine, admission, ...]
    ├── Customer Experience [browse, order, book, ...]
    ├── Storefront Config [theme, pages, sections]
    ├── QR Experiences [menu, booking, queue, ...]
    ├── AI Behaviour [recommender, assistant, ...]
    ├── Reports [sales, clinical, academic, ...]
    ├── Permissions [RBAC resolved per industry]
    └── Workflows [approvals, checklists, ...]
```

## Clean Architecture Layers

```
┌──────────────────────────────────────────────────┐
│                 PRESENTATION                       │
│  Pages │ Components │ Forms │ API Routes           │
├──────────────────────────────────────────────────┤
│                 APPLICATION                        │
│  Server Actions │ Use Cases │ Validators           │
├──────────────────────────────────────────────────┤
│                   DOMAIN                           │
│  Services │ Engines │ Resolvers │ Types            │
├──────────────────────────────────────────────────┤
│                 INFRASTRUCTURE                     │
│  Prisma │ Event Bus │ Job Queue │ Cache │ Email    │
└──────────────────────────────────────────────────┘
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | Turborepo + pnpm workspaces | Shared types, engines, configs |
| Customer App | Next.js (same repo, separate entry) | Code sharing with ERP |
| Storefront | Next.js (multi-tenant, per-domain) | SSR for SEO, same infra |
| APIs | tRPC for internal, REST for public | Type-safe internal, universal external |
| Events | DB-backed (existing EventBus) | No Redis dependency |
| Jobs | pg-boss (existing) | PostgreSQL-native |
| Realtime | WebSocket (new) via Socket.io or Server-Sent Events | Live orders, queue, notifications |
| Payments | Abstracted engine (new) | Multi-gateway pluggable |
| Loyalty | Engine (new) | Points, rewards, tiers, referrals |
| QR | Universal QR Experience Engine (new) | Per-industry QR experiences |

## Technology Stack (Additions)

| Technology | Purpose |
|------------|---------|
| Socket.io / SSE | Realtime orders, queue, notifications |
| Meilisearch / Typesense | Full-text search for Customer App |
| Redis (optional) | Cache, session, rate limiting |
| Twilio / Infobip | SMS, WhatsApp for Customer App |
| Midtrans / Selcom / NMB | Tanzania payment gateways |
| Cloudinary / S3 | Customer images, QR codes |
| Vercel / Docker | Deployment |
