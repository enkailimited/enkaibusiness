# 3. MODULE ARCHITECTURE

## Module Map

```
src/
├── server/
│   ├── industry/          ← EXISTING — resolution engine
│   ├── engines/           ← EXISTING — UoM, Pricing, Inventory, Tax, Promo, Order, Procurement, Manufacturing, Analytics, AI Context
│   ├── search/            ← EXISTING — search abstraction
│   └── registrations/     ← EXISTING — business, user, staff registration
│
├── features/
│   ├── catalog/           ← EXISTING — universal catalog
│   ├── customers/         ← EXISTING — ERP customer management
│   ├── payments/          ← EXISTING — payment engine
│   ├── subscriptions/     ← EXISTING — subscription + wallet
│   ├── roles/             ← EXISTING — RBAC
│   ├── notifications/     ← EXISTING — notification engine
│   ├── sales/             ← EXISTING
│   ├── purchases/         ← EXISTING
│   ├── inventory/         ← EXISTING
│   ├── expenses/          ← EXISTING
│   ├── invoices/          ← EXISTING
│   ├── quotations/        ← EXISTING
│   ├── returns/           ← EXISTING
│   ├── reports/           ← EXISTING
│   ├── settings/          ← EXISTING
│   ├── users/             ← EXISTING
│   ├── branches/          ← EXISTING
│   ├── stores/            ← EXISTING
│   ├── sales-network/     ← EXISTING
│   ├── qr-ordering/       ← EXISTING — to be generalized
│   │
│   ├── customer/          ← NEW — Customer App feature
│   │   ├── account/
│   │   ├── auth/
│   │   ├── profile/
│   │   ├── addresses/
│   │   ├── wallet/
│   │   ├── orders/
│   │   ├── bookings/
│   │   ├── favorites/
│   │   ├── reviews/
│   │   └── referrals/
│   │
│   ├── storefront/        ← NEW
│   │   ├── config/
│   │   ├── theme/
│   │   ├── pages/
│   │   └── seo/
│   │
│   ├── qr-experience/     ← NEW — universal QR platform
│   │   ├── engine/
│   │   ├── templates/
│   │   ├── generation/
│   │   └── installation/
│   │
│   ├── installation/      ← NEW
│   │   ├── tickets/
│   │   ├── visits/
│   │   ├── tasks/
│   │   ├── checklist/
│   │   └── activation/
│   │
│   └── loyalty/           ← NEW
│       ├── engine/
│       ├── points/
│       ├── rewards/
│       ├── referrals/
│       └── coupons/
│
├── ai/                    ← EXISTING — Firdaus AI
│   ├── llm/
│   ├── rag/
│   ├── memory/
│   └── knowledge/
│
├── modules/ai/events/     ← EXISTING — Event Bus
│
├── app/
│   ├── workspaces/        ← EXISTING — ERP Workspace
│   ├── customer/          ← NEW — Customer App routes
│   ├── storefront/        ← NEW — Storefront routes
│   └── api/
│       ├── trpc/          ← EXISTING — ERP APIs
│       └── public/        ← NEW — Public REST APIs
│
└── components/
    └── customer/          ← NEW — Shared customer UI components
```

## New Modules Detail

### Customer Module (`src/features/customer/`)
```
customer/
├── account/
│   ├── services/account-service.ts
│   ├── schemas/index.ts
│   ├── actions/index.ts   → register, login, logout, deleteAccount
│   └── components/profile-form.tsx
│
├── auth/
│   ├── services/auth-service.ts   → OTP, social, magic link
│   ├── actions/index.ts
│   └── components/
│       ├── login-form.tsx
│       ├── register-form.tsx
│       └── otp-verification.tsx
│
├── profile/
│   ├── services/profile-service.ts
│   └── components/profile-view.tsx
│
├── addresses/
│   ├── services/address-service.ts
│   └── components/address-form.tsx
│
├── wallet/
│   ├── services/wallet-service.ts
│   └── components/wallet-view.tsx
│
├── orders/
│   ├── services/order-service.ts  → wraps sales + purchases + bookings
│   ├── components/order-list.tsx
│   └── components/order-detail.tsx
│
├── bookings/
│   ├── services/booking-service.ts
│   └── components/booking-form.tsx
│
├── favorites/
│   ├── services/favorite-service.ts
│   └── components/favorite-button.tsx
│
├── reviews/
│   ├── services/review-service.ts
│   └── components/review-form.tsx
│
└── referrals/
    ├── services/referral-service.ts
    └── components/referral-card.tsx
```

### QR Experience Module (`src/features/qr-experience/`)
```
qr-experience/
├── engine/
│   ├── qr-experience-resolver.ts  ← resolves via Industry Engine
│   └── qr-template-service.ts
│
├── templates/
│   ├── commerce/
│   │   ├── browse-catalog.tsx
│   │   └── place-order.tsx
│   ├── restaurant/
│   │   ├── table-menu.tsx
│   │   ├── food-ordering.tsx
│   │   └── bill-payment.tsx
│   ├── healthcare/
│   │   ├── appointment-booking.tsx
│   │   ├── queue-number.tsx
│   │   └── medical-services.tsx
│   ├── education/
│   │   ├── admissions.tsx
│   │   ├── parent-portal.tsx
│   │   ├── attendance.tsx
│   │   └── fee-payments.tsx
│   ├── hospitality/
│   │   ├── room-service.tsx
│   │   ├── check-in.tsx
│   │   └── housekeeping.tsx
│   └── generic/
│       ├── business-info.tsx
│       └── contact-us.tsx
│
├── generation/
│   └── qr-generator.ts   ← generates QR codes per experience
│
└── installation/
    ├── qr-deployment-service.ts
    └── qr-installation-checklist.ts
```

### Installation Module (`src/features/installation/`)
```
installation/
├── tickets/
│   ├── services/ticket-service.ts
│   ├── schemas/index.ts
│   ├── actions/index.ts
│   └── components/ticket-list.tsx
│
├── visits/
│   ├── services/visit-service.ts
│   └── components/visit-form.tsx
│
├── tasks/
│   ├── services/task-service.ts
│   └── components/task-checklist.tsx
│
├── checklist/
│   ├── services/checklist-service.ts
│   └── components/checklist-form.tsx
│
└── activation/
    ├── services/activation-service.ts
    └── components/activation-form.tsx
```

### Loyalty Module (`src/features/loyalty/`)
```
loyalty/
├── engine/
│   ├── loyalty-resolver.ts    ← resolves via Industry Engine
│   └── loyalty-calculator.ts
│
├── points/
│   ├── services/points-service.ts
│   └── components/points-display.tsx
│
├── rewards/
│   ├── services/reward-service.ts
│   └── components/reward-list.tsx
│
├── referrals/
│   ├── services/referral-service.ts
│   └── components/referral-program.tsx
│
└── coupons/
    ├── services/coupon-service.ts
    └── components/coupon-list.tsx
```

## Industry Resolution for Modules

Every new module resolves through the Industry Engine:

```typescript
// Example: QR Experience Resolution
class QRExperienceResolver {
  async getExperiences(businessId: string): Promise<QRExperience[]> {
    const industry = await industryEngine.getIndustry(businessId);
    const mode = await industryEngine.getMode(businessId);
    const modules = await industryEngine.getEnabledModules(businessId);

    // Industry Engine returns available QR experiences
    return industryEngine.resolveQRCapabilities(industry, mode, modules);
  }
}

// Example: Storefront Resolution
class StorefrontResolver {
  async getStorefront(businessId: string): Promise<StorefrontConfig> {
    const industry = await industryEngine.getIndustry(businessId);

    // Each industry defines default storefront sections, pages, theme
    return industryEngine.resolveStorefront(industry, businessId);
  }
}
```
