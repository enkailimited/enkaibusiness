# 10. MIGRATION STRATEGY

## Principles

1. **Zero existing table changes** — All new features use new tables
2. **No SQL migration required** — `prisma db push` for new models only
3. **Backward compatible** — Existing ERP continues working during migration
4. **Incremental rollout** — Each phase is independently deployable
5. **No data loss** — Existing data remains untouched

## Phase Plan

### Phase 0 — Foundation (Week 1)
```
Add missing models to Prisma schema:
  - Review, Favorite, Wishlist, WishlistItem
  - Referral, Reservation
  - InstallationTicket, InstallationVisit, InstallationTask
  - InstallationChecklist, QRCode

Migration command: npx prisma db push
Risk: None (new tables only)
```

### Phase 1 — Customer Auth & Profile (Week 2)
```
- Customer App entry point (/customer/*)
- Customer auth (register, login, OTP, social)
- Customer profile, addresses
- Customer JWT

Risk: Low (isolated from ERP)
```

### Phase 2 — Customer Catalog & Orders (Week 3)
```
- Customer catalog browsing (read-only, industry-adaptive)
- Customer cart
- Customer checkout (wraps existing Sale creation)
- Customer order history

Risk: Low (read-only catalog, wraps existing Sale service)
```

### Phase 3 — Bookings & Reservations (Week 4)
```
- Booking service
- Reservation service
- Customer booking/reservation UI
- Industry-adaptive booking forms

Risk: Medium (new transaction types)
```

### Phase 4 — Installation Module (Week 5)
```
- InstallationTicket CRUD
- InstallationTask checklist
- Visit scheduling
- Activation workflow
- Distributor dashboard

Risk: Low (new process, independent)
```

### Phase 5 — QR Experience Platform (Week 6)
```
- QRExperience resolver (Industry Engine integration)
- QR generation service
- QR deployment workflow
- QR scanning handler
- Per-industry QR templates

Risk: Low (extends existing QR code system)
```

### Phase 6 — Storefront (Week 7)
```
- Storefront configuration
- Storefront theme
- Storefront SSR pages
- Subdomain routing (middleware)
- Custom domain support

Risk: Low (new public pages, no ERP impact)
```

### Phase 7 — Loyalty Engine (Week 8)
```
- Loyalty points calculator
- Reward service
- Referral tracking
- Coupon integration
- Customer wallet integration

Risk: Low (additive)
```

### Phase 8 — Public APIs (Week 9)
```
- Public API gateway
- API key management
- Rate limiting
- Webhook delivery
- API documentation

Risk: Low (new endpoints)
```

### Phase 9 — Realtime (Week 10)
```
- WebSocket server
- Event → WebSocket bridge
- Live order tracking
- Live queue updates
- Live notifications

Risk: Medium (new infrastructure)
```

### Phase 10 — Firdaus AI for Customers (Week 11-12)
```
- Customer-facing AI assistant
- Industry-adaptive AI behavior
- Product recommendations
- FAQ chatbot
- Multilingual support

Risk: Low (extends existing AI)
```

## Rollback Strategy

| Phase | Rollback Action |
|-------|----------------|
| Phase 0 | `DROP TABLE` new models only |
| Phase 1 | Remove `/customer/*` routes |
| Phase 2 | No rollback needed (read-only) |
| Phase 3 | Cancel active bookings |
| Phase 4 | Mark tickets as cancelled |
| Phase 5 | Deactivate QR experiences |
| Phase 6 | Remove storefront routes |
| Phase 7 | Reset loyalty balances |
| Phase 8 | Revoke API keys |
| Phase 9 | Stop WebSocket server |
| Phase 10 | Disable customer AI |

## Zero-Downtime Deployment

```
1. Deploy schema (new tables only)     ← No downtime
2. Deploy new server code              ← Hot reload
3. Deploy new UI components            ← Client-side cache
4. Enable storefront routing           ← Config toggle
5. Activate customer app               ← Config toggle
```

Each phase is behind a feature flag:

```typescript
const features = {
  customerApp: process.env.FEATURE_CUSTOMER_APP === "true",
  storefront: process.env.FEATURE_STOREFRONT === "true",
  installation: process.env.FEATURE_INSTALLATION === "true",
  loyalty: process.env.FEATURE_LOYALTY === "true",
  realtime: process.env.FEATURE_REALTIME === "true",
  publicApi: process.env.FEATURE_PUBLIC_API === "true",
};
```
