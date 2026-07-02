# 12. PERFORMANCE CONSIDERATIONS

## Database

### Current Bottlenecks
| Issue | Impact | Mitigation |
|-------|--------|------------|
| Neon free-tier connection limit (10) | Connection pool exhaustion | pgBouncer (pooler URL); retry middleware (existing) |
| No indexing on new customer tables | Slow customer queries | Add indexes on businessId, customerId, status |
| JSON metadata on catalog items | Query overhead | Avoid JSON filters in hot paths; dedicated columns for frequent filters |

### New Indexes Required

```sql
CREATE INDEX idx_reviews_business_item ON reviews(business_id, catalog_item_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);
CREATE INDEX idx_favorites_customer ON favorites(customer_id);
CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
CREATE INDEX idx_referrals_code ON referrals(code);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_reservations_business_time ON reservations(business_id, start_time);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_installation_tickets_business ON installation_tickets(business_id);
CREATE INDEX idx_installation_tickets_distributor ON installation_tickets(distributor_id);
CREATE INDEX idx_installation_tickets_status ON installation_tickets(status);
CREATE INDEX idx_installation_tasks_ticket ON installation_tasks(ticket_id);
CREATE INDEX idx_qr_codes_business ON qr_codes(business_id);
CREATE INDEX idx_qr_codes_experience ON qr_codes(experience_id);
```

## API Performance

### Caching Strategy

| Layer | Cache | TTL | Invalidation |
|-------|-------|-----|-------------|
| Storefront pages | CDN (Vercel Edge) | 60s | On-demand revalidation |
| Catalog listing | In-memory (Next.js) | 30s | On catalog update |
| Catalog item | In-memory (Next.js) | 60s | On item update |
| Industry config | In-memory (Node) | 300s | On config change |
| Customer session | JWT (stateless) | 1hr | On logout |
| Public API responses | CDN (optional) | Per-endpoint | Cache key by params |

### Query Optimization

```typescript
// BAD: N+1 queries
const orders = await prisma.order.findMany(...);
for (const order of orders) {
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}

// GOOD: Batched includes
const orders = await prisma.order.findMany({
  include: { items: true },
  where: { customerId },
  orderBy: { createdAt: "desc" },
  take: 20,
});
```

## Real-time Performance

### WebSocket Scaling

```
Single Node (dev)     → Direct WebSocket connections
Multiple Nodes (prod) → Redis pub/sub for cross-node message relay
```

### Connection Limits

| Tier | Connections/Business | Global |
|------|---------------------|--------|
| Free | 50 | 500 |
| Pro | 500 | 5,000 |
| Enterprise | Unlimited | Unlimited |

## Storefront Performance

### SSR + ISR Strategy

```typescript
// Catalog pages: ISR with 60s revalidation
export const revalidate = 60;

// Product detail: ISR with 300s revalidation
export const revalidate = 300;

// Cart/Checkout: SSR only (dynamic)
export const dynamic = "force-dynamic";
```

### Bundle Size Budget

| Asset | Budget | Current |
|-------|--------|---------|
| Customer App JS | < 200KB | 0 (new) |
| Storefront JS | < 150KB | 0 (new) |
| Storefront CSS | < 50KB | 0 (new) |
| ERP Workspace JS | < 300KB | ~280KB |

### Image Optimization

```typescript
// Storefront product images
<Image
  src={item.imageUrl}
  alt={item.name}
  width={400}
  height={400}
  priority={index < 4}
  loading={index < 4 ? "eager" : "lazy"}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
/>
```

## Monitoring

### Metrics to Track

| Metric | Tool | Alert Threshold |
|--------|------|----------------|
| API Response Time (p95) | Vercel Analytics | > 500ms |
| DB Query Time (p95) | Neon Monitoring | > 200ms |
| WebSocket Latency | Custom | > 1000ms |
| Error Rate | Sentry | > 1% |
| Connection Pool Usage | Neon Monitoring | > 80% |
| Customer Registration Rate | Custom | Drop > 50% |
| Installation Completion Rate | Custom | Drop > 30% |
| Storefront Conversion Rate | Analytics | Drop > 20% |

## Load Testing

### Scenarios

| Scenario | Target | Notes |
|----------|--------|-------|
| Storefront homepage | 1,000 concurrent | CDN-cached, should handle |
| Catalog search | 500 concurrent | ISR, DB indexed |
| Checkout | 100 concurrent | Transactional, rate-limited |
| QR scan | 200 concurrent | Lightweight redirect |
| WebSocket connect | 1,000 concurrent | Requires horizontal scaling |
| Customer registration | 50 concurrent | OTP rate-limited |

### Performance Budget

| Operation | Budget |
|-----------|--------|
| Storefront page load | < 2s (3G) |
| Catalog search response | < 200ms |
| Checkout completion | < 3s |
| QR scan redirect | < 500ms |
| WebSocket message delivery | < 100ms |
| Customer login | < 1s |
| API response (p95) | < 500ms |
| API response (p99) | < 2s |
