# 11. RISK ANALYSIS

## Risk Matrix

| # | Risk | Probability | Impact | Mitigation |
|---|------|-------------|--------|------------|
| 1 | Breaking existing ERP features | Low | Critical | All changes additive; zero ALTER on existing tables; feature flags |
| 2 | Customer App accessing ERP data | Low | Critical | Separate entry point; customer-scoped services only; JWT isolation |
| 3 | Data leakage between businesses (multi-tenant) | Low | Critical | All queries scoped by businessId; RBAC enforced; audit logging |
| 4 | Neon DB connection pool exhaustion | Medium | High | Connection pooling via pgBouncer; retry middleware (existing) |
| 5 | Performance regression from event bus | Low | Medium | Async processing; events are fire-and-forget |
| 6 | Storefront SEO regression | Low | Medium | SSR by default; structured data; sitemap generation |
| 7 | QR code security (spoofing, tampering) | Medium | High | Signed QR codes; server-side validation; rate limiting |
| 8 | Customer OTP/SMS spam | High | Medium | Rate limit OTP: 3/min per phone; CAPTCHA after 3 attempts |
| 9 | WebSocket connection scaling | Medium | Medium | Horizontal scaling via Redis pub/sub; connection limits per business |
| 10 | Public API abuse | Medium | High | Rate limiting (100 req/min per key); IP blocking; usage quotas |
| 11 | Installation process abandonment | Medium | Medium | Automated reminders; escalation after 7 days inactivity |
| 12 | Payment gateway integration failures | Medium | High | Retry logic; fallback gateways; manual reconciliation |
| 13 | Firdaus AI hallucination in customer-facing mode | High | High | Confidence thresholds; human-in-loop for critical actions |
| 14 | Customer disputes (orders, payments) | Medium | Medium | Audit trail; refund workflow; support chat |
| 15 | Mobile app (future) — App Store rejection | Low | Medium | PWA first; native wrapper via Capacitor |
| 16 | Custom domain SSL provisioning | Medium | Medium | Auto-provision via Let's Encrypt; CNAME verification |

## Security Analysis

### Threat Model

| Threat | Vector | Impact | Mitigation |
|--------|--------|--------|------------|
| Unauthorized order access | Stolen JWT | Medium | Short-lived tokens; refresh rotation; device fingerprinting |
| Business data scraping | Public API | Medium | Rate limiting; pagination; API key revocation |
| Fake QR codes | Physical QR replacement | High | Signed QR payloads; installation photos; tamper-evident QR |
| Account takeover | Weak password | High | OTP enforcement; rate limiting; suspicious login detection |
| Payment fraud | Stolen card | High | 3DS; fraud scoring; manual review for high-value orders |
| XSS in storefront | Customer reviews | Medium | Sanitized HTML; CSP headers; content review |

### Compliance

| Requirement | Status |
|-------------|--------|
| Password hashing | ✅ bcrypt via Better Auth |
| HTTPS | ✅ Vercel/Neon default |
| CSP Headers | ⬜ To implement |
| Rate Limiting | ⬜ To implement |
| Audit Logs | ⬜ Existing events + new |
| GDPR Readiness | ⬜ Data export, deletion |
| PCI DSS | ⬜ Via payment gateway (not storing cards) |
| Tanzania NIDA | ⬜ For KYC (future) |

## Dependency Risks

| Dependency | Risk | Fallback |
|-----------|------|----------|
| Neon DB (free tier) | Connection limits, sleep | Warm function, connection pooling |
| Vercel | Cold starts, edge limits | Docker deployment, self-hosted |
| pg-boss | Job scheduling | BullMQ, Redis-based |
| Next.js | App Router maturity | Pages Router for critical paths |
| Better Auth | Auth provider risk | Custom auth migration path |

## Capacity Planning

| Component | Current | Growth (12mo) | Required |
|-----------|---------|---------------|----------|
| Database connections | 10 (free) | 50 | Connection pooling |
| API requests/min | 100 | 10,000 | Auto-scaling |
| WebSocket connections | 0 | 5,000 | Horizontal scaling |
| QR codes per business | 0 | 50 avg | No limit |
| Customer accounts | 0 | 100,000 | Indexed queries |
| Storefront traffic | 0 | 1M/mo | CDN + SSR caching |
