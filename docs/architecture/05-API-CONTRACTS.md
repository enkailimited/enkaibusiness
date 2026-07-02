# 5. API CONTRACTS

## Architecture

```
┌─────────────────────────────────────────────┐
│              API Gateway                     │
│                                              │
│  /api/trpc/*      → ERP Internal (tRPC)     │
│  /api/public/*    → 3rd-party (REST + JSON)  │
│  /api/customer/*  → Customer App (tRPC)     │
│  /api/storefront/* → Storefront (REST/SSR)   │
└─────────────────────────────────────────────┘
```

## ERP Internal APIs (Existing — tRPC)

No changes needed. Existing tRPC routers continue to serve the ERP Workspace.

## Customer App APIs (New — tRPC)

### Authentication (`src/app/api/customer/trpc/router.ts`)

```
mutation customer.auth.register({ email, phone, password, firstName, lastName })
  → { token, customer }

mutation customer.auth.login({ email, password })
  → { token, customer }

mutation customer.auth.loginOtp({ phone })
  → { otpSent: true }

mutation customer.auth.verifyOtp({ phone, otp })
  → { token, customer }

mutation customer.auth.socialLogin({ provider, token })
  → { token, customer }

mutation customer.auth.logout()
  → { success: true }
```

### Catalog (Industry-Resolved)

```
query customer.catalog.list({ businessId, category?, search?, page?, limit? })
  → { items: CatalogItem[], total, page }

query customer.catalog.get({ businessId, slug })
  → { item: CatalogItem, variants, reviews }

query customer.catalog.categories({ businessId })
  → { categories: Category[] }

query customer.catalog.search({ businessId, query })
  → { results: SearchResult[] }
```

### Orders

```
mutation customer.order.create({ businessId, items, deliveryAddress, paymentMethod })
  → { orderId, status, total }

query customer.order.list({ status?, page?, limit? })
  → { orders: Order[] }

query customer.order.get({ orderId })
  → { order: OrderDetail }

mutation customer.order.cancel({ orderId, reason })
  → { success: true }
```

### Bookings

```
mutation customer.booking.create({ businessId, catalogItemId?, startTime, endTime?, guests?, notes? })
  → { bookingId, status }

query customer.booking.list({ status?, page? })
  → { bookings: Booking[] }

mutation customer.booking.cancel({ bookingId })
  → { success: true }
```

### Wallet & Payments

```
query customer.wallet.balance()
  → { balance, currency }

mutation customer.wallet.deposit({ amount, paymentMethod })
  → { transactionId, redirectUrl? }

mutation customer.payment.pay({ orderId?, bookingId?, amount, paymentMethod })
  → { transactionId, status, redirectUrl? }

query customer.wallet.transactions({ page?, limit? })
  → { transactions: WalletTransaction[] }
```

### Profile

```
query customer.profile.get()
  → { profile }

mutation customer.profile.update({ firstName, lastName, avatar, ... })
  → { profile }

query customer.addresses.list()
  → { addresses: Address[] }

mutation customer.addresses.create({ ... })
  → { address }

mutation customer.addresses.update({ id, ... })
  → { address }

mutation customer.addresses.delete({ id })
  → { success: true }
```

### Favorites & Reviews

```
mutation customer.favorites.toggle({ catalogItemId })
  → { isFavorited: true }

query customer.favorites.list()
  → { items: CatalogItem[] }

mutation customer.reviews.create({ catalogItemId, rating, title?, body? })
  → { review }

query customer.reviews.list({ catalogItemId })
  → { reviews: Review[] }
```

## Public REST APIs (New)

### Authentication

```
POST /api/public/v1/auth/register
  Body: { email, phone, password, firstName, lastName, businessId }
  → 201 { customerId, token }

POST /api/public/v1/auth/login
  Body: { email, password }
  → 200 { token, customer }

POST /api/public/v1/auth/refresh
  Headers: Authorization: Bearer <token>
  → 200 { token }
```

### Catalog

```
GET /api/public/v1/{businessSlug}/catalog
  Query: ?category=&search=&page=&limit=
  → 200 { data: CatalogItem[], meta: { total, page, limit } }

GET /api/public/v1/{businessSlug}/catalog/{slug}
  → 200 { data: CatalogItem }

GET /api/public/v1/{businessSlug}/categories
  → 200 { data: Category[] }
```

### Orders

```
POST /api/public/v1/orders
  Headers: Authorization: Bearer <token>
  Body: { businessId, items: [{ catalogItemId, quantity }], addressId }
  → 201 { orderId, status, total }

GET /api/public/v1/orders/{orderId}
  → 200 { order }

GET /api/public/v1/orders
  Query: ?status=&page=
  → 200 { data: Order[], meta }
```

### Webhooks (Outgoing)

```
POST /api/public/v1/webhooks
  Headers: X-Api-Key: <apiKey>
  Body: { url, events: string[], secret }
  → 201 { webhookId }

DELETE /api/public/v1/webhooks/{webhookId}
  → 204
```

## Storefront SSR Routes

These are Next.js server-rendered pages, not APIs:

```
/[businessSlug]              → Storefront homepage
/[businessSlug]/catalog      → Catalog listing
/[businessSlug]/catalog/[slug] → Item detail
/[businessSlug]/cart         → Cart
/[businessSlug]/checkout     → Checkout
/[businessSlug]/booking      → Booking form
/[businessSlug]/menu         → Restaurant menu
/[businessSlug]/track        → Order tracking
```

## Rate Limiting

| API | Rate Limit | Scope |
|-----|-----------|-------|
| Public REST | 100 req/min | Per API Key |
| Customer App | 60 req/min | Per customer |
| Auth (login) | 5 req/min | Per IP |
| OTP send | 3 req/min | Per phone |
| Storefront | 200 req/min | Per business |

## Security

| Requirement | Implementation |
|-------------|---------------|
| Customer App | JWT (short-lived) + Refresh Token |
| Public API | API Key (header `X-Api-Key`) + JWT |
| Storefront | Session cookie (Next.js) |
| Rate Limiting | In-memory + Redis (production) |
| CORS | Whitelist per business |
| CSRF | Double-submit cookie pattern |
| Headers | Helmet.js (CSP, HSTS, X-Frame, etc.) |
