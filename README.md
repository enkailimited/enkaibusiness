
<img src="./public/images/logo-blue.svg" alt="Enkai Business" width="160" />

# Enkai Business

**Intelligent Business Operating Platform for Africa and Emerging Markets**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

Enkai Business is a production-grade SaaS platform that enables organizations to manage their entire operations from a single unified workspace. Designed for **Africa and emerging markets**, it combines ERP, POS, CRM, AI, and operational intelligence into one accessible ecosystem.

### Key Differentiators

- **Mobile-First Architecture** — Built for the mobile-dominant African market with responsive layouts, bottom navigation, and offline-friendly workflows
- **AI-First Operations** — Foundation designed for AI-powered automation, predictive analytics, and intelligent decision support
- **Multi-Industry Support** — Single architecture supporting Commerce, Healthcare, Restaurant, Manufacturing, Agriculture, and Services
- **Multi-Tenant by Design** — Platform layer for internal operations, workspace layer for customer environments
- **Offline-Ready** — Architecture supports eventual-consistency patterns for areas with unreliable connectivity
- **Extensible** — Dynamic RBAC, flexible catalog system, and modular feature architecture

---

## Vision

To become the most accessible and intelligent business operating platform for Africa and emerging markets.

We aim to empower millions of businesses with modern digital tools, AI-powered automation, and scalable operations management — bridging the technology gap that holds back small and medium enterprises across the continent.

## Mission

To simplify business operations through a unified platform that combines ERP, POS, CRM, AI, and operational intelligence into one easy-to-use ecosystem.

We help businesses grow faster, operate smarter, and serve customers better by providing enterprise-grade tools that are accessible, affordable, and adapted to local needs.

---

## Core Architecture

### Two-Layer Platform Design

```
┌─────────────────────────────────────────────────────┐
│                    PLATFORM LAYER                    │
│  Internal operations for Enkai teams                 │
│  ┌─────────┬──────────┬────────┬────────────────┐   │
│  │ Sales   │ Marketing│ Support│  Subscriptions │   │
│  ├─────────┼──────────┼────────┼────────────────┤   │
│  │ Finance │ Commissions│ Dist.│  Users & Roles │   │
│  └─────────┴──────────┴────────┴────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   WORKSPACE LAYER                    │
│  Customer environments (multi-tenant)                │
│  ┌─────────────────────────────────────────────┐    │
│  │  Workspace                                   │    │
│  │  ├── Business 1 (Commerce / Retail)          │    │
│  │  │   ├── Branch (Main)                       │    │
│  │  │   │   ├── Store (Main Store)              │    │
│  │  │   │   └── Store (Online)                  │    │
│  │  │   └── Branch (Branch B)                   │    │
│  │  ├── Business 2 (Healthcare / Pharmacy)      │    │
│  │  └── Business 3 (Restaurant / Cafe)          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Domain Model

```
User ──── WorkspaceMember ──── Workspace
                                    │
                              Business ──── BusinessMode (industry + mode)
                                    │
                              Branch ──── Store
                                    │
                              CatalogItem (PRODUCT, SERVICE, MEDICINE, MENU_ITEM)
```

### RBAC Model

```
User ──── UserRole ──── Role ──── RolePermission ──── Permission
```

- **Platform Roles**: Super Admin, National Manager, Sales Manager, Support, Finance, etc.
- **Business Roles**: Owner, Manager, Cashier, Accountant, Doctor, Pharmacist, Chef
- Permissions are **database-driven** — no hardcoded permission checks

---

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | React framework with SSR, RSC, and Server Actions |
| **TypeScript 5.7** | Strict type safety across the entire codebase |
| **Tailwind CSS v4** | Utility-first CSS with `@theme` directives |
| **shadcn/ui** | Accessible, composable React components |
| **React Hook Form + Zod** | Type-safe form validation |
| **TanStack Query** | Server state management and caching |
| **Zustand** | Lightweight client state management |

### Backend

| Technology | Purpose |
|---|---|
| **Next.js Server Actions** | Type-safe API mutations |
| **Next.js Route Handlers** | REST API endpoints (upload, webhooks) |
| **Prisma ORM 6** | Type-safe database access |
| **PostgreSQL 16** | Primary data store |

### Storage

| Technology | Purpose |
|---|---|
| **ImageKit** | Image and file upload with optimization |

---

## Folder Structure

```
enkai-business/
├── app/                          # Next.js App Router routes
│   ├── (auth)/                   # Auth pages group
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── platform/                 # Platform layer (internal)
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── marketing/
│   │   ├── support/
│   │   ├── subscriptions/
│   │   ├── commissions/
│   │   ├── distribution/
│   │   ├── users/
│   │   ├── roles/
│   │   └── settings/
│   ├── workspaces/               # Workspace layer (customer)
│   ├── api/                      # API route handlers
│   │   ├── auth/
│   │   ├── upload/
│   │   └── webhooks/
│   ├── layout.tsx
│   └── globals.css
│
├── src/
│   ├── components/               # UI components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── upload/               # Upload components
│   │   │   └── image-uploader.tsx
│   │   ├── layout/               # Layout components
│   │   │   ├── sidebar.tsx
│   │   │   ├── bottom-nav.tsx
│   │   │   └── page-header.tsx
│   │   └── shared/               # Shared components
│   │       ├── data-table.tsx
│   │       ├── empty-state.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── features/                 # Feature-based modules
│   │   ├── auth/
│   │   ├── platform/
│   │   ├── workspaces/
│   │   ├── businesses/
│   │   ├── branches/
│   │   ├── stores/
│   │   ├── catalog/
│   │   ├── rbac/
│   │   └── upload/
│   │
│   ├── lib/                      # Core utilities
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validations/          # Zod schemas
│   │       ├── auth.ts
│   │       ├── workspace.ts
│   │       ├── business.ts
│   │       ├── branch.ts
│   │       ├── store.ts
│   │       ├── catalog.ts
│   │       └── rbac.ts
│   │
│   ├── server/                   # Server-only code
│   │   ├── db.ts                 # Prisma client
│   │   ├── auth.ts               # Session management
│   │   ├── actions/              # Server Actions
│   │   │   ├── auth.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── businesses.ts
│   │   │   ├── branches.ts
│   │   │   ├── stores.ts
│   │   │   ├── catalog.ts
│   │   │   └── rbac.ts
│   │   └── services/             # Business logic
│   │       ├── auth-service.ts
│   │       ├── workspace-service.ts
│   │       ├── business-service.ts
│   │       ├── branch-service.ts
│   │       ├── store-service.ts
│   │       ├── catalog-service.ts
│   │       └── rbac-service.ts
│   │
│   ├── stores/                   # Zustand stores
│   │   ├── auth-store.ts
│   │   ├── workspace-store.ts
│   │   └── ui-store.ts
│   │
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── models.ts
│   │   ├── enums.ts
│   │   ├── relationships.ts
│   │   ├── auth.ts
│   │   └── upload.ts
│   │
│   ├── prisma/                   # Database schema
│   │   └── schema.prisma
│   │
│   └── ai/                       # AI module (future)
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   ├── images/
│   └── icons/
│
├── next.config.ts
├── tsconfig.json
├── package.json
├── postcss.config.mjs
├── .env.example
└── README.md
```

---

## Prisma Schema

The database schema includes the following core models:

| Model | Description | Key Relationships |
|---|---|---|
| `User` | Platform users | WorkspaceMember, UserRole |
| `Workspace` | Customer environments | WorkspaceMember, Business |
| `WorkspaceMember` | User-workspace membership | User, Workspace |
| `Business` | Customer businesses | Workspace, BusinessMode, Branch, CatalogItem |
| `BusinessMode` | Industry + mode configuration | Business |
| `Branch` | Business branches | Business, Store |
| `Store` | Optional stores within branches | Branch |
| `CatalogItem` | Universal catalog items | Business |
| `Role` | RBAC roles | RolePermission, UserRole |
| `Permission` | RBAC permissions | RolePermission |
| `RolePermission` | Role-permission assignment | Role, Permission |
| `UserRole` | User-role assignment | User, Role |

All models use UUID primary keys and include `createdAt`/`updatedAt` timestamps.

---

## Development Setup

### Prerequisites

- **Node.js** 18+ (recommended: 22+)
- **PostgreSQL** 14+
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/enkai-business.git
cd enkai-business

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and ImageKit credentials

# Initialize database
npx prisma db push

# Seed with demo data
npm run db:seed

# Start development server
npm run dev
```

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Platform Admin | admin@enkai.com | Test123! |
| Business Owner | manager@demo.com | Test123! |
| Business Staff | cashier@demo.com | Test123! |

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:55432/enkai_business"
BETTER_AUTH_SECRET="your-secret-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your-public-key"
IMAGEKIT_PRIVATE_KEY="your-private-key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your-endpoint"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Enkai Business"
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run format       # Format code with Prettier
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create a new migration
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with demo data
```

---

## Coding Standards

### TypeScript

- **Strict mode** enabled — `strict: true`, `strictNullChecks: true`
- **No unchecked indexed access** — `noUncheckedIndexedAccess: true`
- **No unused locals/params** — `noUnusedLocals: true`, `noUnusedParameters: true`
- Path aliases: `@/*` → `./src/*`

### Architecture Principles

1. **Feature-based organization** — Group code by feature, not by type
2. **Server Actions for mutations** — Never expose database operations directly to the client
3. **Service layer separation** — Business logic lives in `server/services/`
4. **Validation at the boundary** — All inputs validated with Zod schemas
5. **Server-only by default** — Sensitive operations marked with `"server-only"`
6. **Mobile-first CSS** — Design for mobile, enhance for desktop

### Naming Conventions

- **Files**: `kebab-case.ts` for utilities, `kebab-case.tsx` for components
- **Components**: PascalCase
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Models**: PascalCase (matching Prisma model names)
- **Server Actions**: camelCase ending with `Action`
- **Validation Schemas**: camelCase ending with `Schema`

---

## Deployment Strategy

### Build

```bash
npm run build
```

### Deploy to Vercel (Recommended)

```bash
vercel --prod
```

### Docker Deployment

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
```

### Database Migrations in Production

```bash
npx prisma migrate deploy
```

---

## Future Roadmap

### Phase 2 — Core Business Operations
- [ ] Point of Sale (POS) system
- [ ] Inventory management
- [ ] Purchase orders
- [ ] Expense tracking
- [ ] Customer relationship management (CRM)
- [ ] Sales reports and analytics

### Phase 3 — AI Integration
- [ ] AI-powered sales assistant
- [ ] Predictive inventory management
- [ ] Intelligent reporting and insights
- [ ] Automated customer communication
- [ ] Fraud detection

### Phase 4 — Advanced Features
- [ ] Subscription billing and invoicing
- [ ] Multi-currency support
- [ ] Hardware integration (receipt printers, barcode scanners)
- [ ] Offline-first mode
- [ ] Mobile native apps (React Native)
- [ ] Third-party API marketplace

### Phase 5 — Industry Specialization
- [ ] Healthcare module (patient records, prescriptions)
- [ ] Restaurant module (table management, kitchen display)
- [ ] Manufacturing module (BOM, production planning)
- [ ] Agriculture module (crop tracking, supply chain)

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Support

- Documentation: [docs.enkai.com](https://docs.enkai.com)
- Email: support@enkai.com
- Issues: [GitHub Issues](https://github.com/your-org/enkai-business/issues)

---

<p align="center">
  Built with ❤️ for African businesses and emerging markets
</p>
# enkaibusiness
# enkaibusiness
