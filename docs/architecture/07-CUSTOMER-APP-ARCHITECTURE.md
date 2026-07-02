# 7. CUSTOMER APP ARCHITECTURE

## Strategy

The Customer App is a **separate entry point** in the same Next.js monorepo.
It shares:
- Industry Engine (resolves experiences dynamically)
- Catalog Engine (reads catalog items)
- Event Bus (publishes customer events)
- Notification Engine (sends customer notifications)
- Payment Engine (processes customer payments)
- Database (customer-scoped tables only)

It does NOT share:
- ERP internals (sales, purchases, inventory CRUD)
- ERP server actions
- ERP UI components

## Route Structure

```
/customer/
├── page.tsx                ← Redirect to login or dashboard
├── layout.tsx              ← Customer layout (header, nav, footer)
│
├── auth/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── otp/page.tsx
│   └── forgot-password/page.tsx
│
├── (dashboard)/
│   ├── page.tsx            ← Customer dashboard (industry-adaptive)
│   ├── catalog/page.tsx    ← Browse catalog (industry-adaptive)
│   ├── catalog/[slug]/page.tsx ← Item detail
│   ├── cart/page.tsx       ← Shopping cart
│   ├── checkout/page.tsx   ← Checkout
│   ├── orders/page.tsx     ← Order history
│   ├── orders/[id]/page.tsx   ← Order detail
│   ├── bookings/page.tsx   ← Booking history
│   ├── bookings/[id]/page.tsx ← Booking detail
│   ├── wallet/page.tsx     ← Wallet & transactions
│   ├── favorites/page.tsx  ← Favorites
│   ├── reviews/page.tsx    ← My reviews
│   ├── referrals/page.tsx  ← Referral program
│   ├── addresses/page.tsx  ← Saved addresses
│   └── profile/page.tsx    ← Profile settings
│
├── qr/[code]/page.tsx      ← QR experience handler
│
└── api/                    ← Customer App APIs (server-only)
    └── trpc/
        └── [trpc]/route.ts
```

## Industry-Adaptive Dashboard

```typescript
// src/app/customer/(dashboard)/page.tsx
export default async function CustomerDashboardPage() {
  const { businessId } = await getCurrentBusiness();
  const industry = await industryEngine.getIndustry(businessId);

  // Industry Engine returns dashboard sections
  const sections = await industryEngine.resolveCustomerDashboard(industry);

  return (
    <div>
      {sections.map(section => (
        <DashboardSection key={section.id} section={section} />
      ))}
    </div>
  );
}
```

Each industry defines its own dashboard:

```typescript
// Industry Registry — customer dashboard section
industries: {
  commerce: {
    customerDashboard: [
      { id: "featured-products", component: "FeaturedProducts", icon: "Package" },
      { id: "recent-orders", component: "RecentOrders", icon: "ShoppingBag" },
      { id: "categories", component: "CategoryGrid", icon: "Grid" },
    ],
  },
  restaurant: {
    customerDashboard: [
      { id: "menu-categories", component: "MenuCategories", icon: "Utensils" },
      { id: "current-order", component: "ActiveOrder", icon: "Clock" },
      { id: "reservations", component: "UpcomingReservations", icon: "Calendar" },
    ],
  },
  healthcare: {
    customerDashboard: [
      { id: "upcoming-appointments", component: "UpcomingAppointments", icon: "CalendarClock" },
      { id: "medical-services", component: "MedicalServices", icon: "Stethoscope" },
      { id: "queue-status", component: "QueueStatus", icon: "Timer" },
    ],
  },
  education: {
    customerDashboard: [
      { id: "student-info", component: "StudentInfo", icon: "GraduationCap" },
      { id: "attendance", component: "RecentAttendance", icon: "CheckCheck" },
      { id: "fee-status", component: "FeeStatus", icon: "CreditCard" },
      { id: "daily-reports", component: "DailyReports", icon: "FileText" },
    ],
  },
}
```

## Auth Flow

```
Guest
  │
  ├── Browse catalog (public)
  ├── Add to cart (device-stored)
  │
  ├── Checkout
  │     │
  │     ├── Already registered? → Login
  │     │     ├── Email + Password
  │     │     └── OTP (phone)
  │     │
  │     └── New user? → Register
  │           ├── Email + Password
  │           ├── Phone + OTP
  │           └── Social (Google, Apple)
  │
  └── After auth → Complete order
```

## Customer JWT Structure

```json
{
  "sub": "customer-uuid",
  "businessId": "business-uuid",
  "type": "customer",
  "iat": 1234567890,
  "exp": 1234567890 + 3600
}
```

## Data Isolation

```
Customer App NEVER accesses:
  - ERP sales/purchases/inventory tables directly
  - ERP server actions
  - ERP auth sessions

Customer App ONLY accesses:
  - customer_accounts
  - customer_addresses
  - customer_wallets
  - catalog_items (read-only via Catalog Engine)
  - bookings (customer-scoped)
  - orders (via Order Service wrapper)
  - reviews
  - favorites
  - referrals
```

## Notification Channels

| Channel | Customer Use |
|---------|-------------|
| In-App | Bell notification in Customer App |
| Email | Order confirmation, booking reminder |
| SMS | OTP, delivery update |
| WhatsApp | Promotions, receipts |
| Push | Mobile app push (future) |
