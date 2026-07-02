# 4. EVENT FLOW

## Design

All events flow through the existing **DB-backed Event Bus**
(`src/modules/ai/events/event-bus.ts`). The Event Bus supports:
- Persistence (DB-backed, survives restarts)
- Retry (3x with exponential backoff)
- Poison queue (events that exceed max retries)
- Startup recovery (`processPendingEvents()`)

## New Event Types

Add to the existing 33 event types:

### Business Lifecycle
```
Business.Created         ← existing
Business.Configured      ← NEW — initial setup complete
Business.Activated       ← NEW — QR experiences live
Business.Suspended       ← existing
Business.Deactivated     ← existing
```

### Installation
```
Installation.TicketCreated     ← NEW
Installation.DistributorAssigned ← NEW
Installation.VisitScheduled    ← NEW
Installation.VisitCompleted    ← NEW
Installation.TaskCompleted     ← NEW
Installation.TicketCompleted   ← NEW
Installation.ActivationRequested ← NEW
Installation.ActivationApproved  ← NEW
```

### Customer
```
Customer.Registered      ← NEW
Customer.LoggedIn        ← NEW
Customer.ProfileUpdated  ← NEW
Customer.AddressAdded    ← NEW
Customer.OrderPlaced     ← NEW
Customer.BookingCreated  ← NEW
Customer.PaymentCompleted ← NEW
Customer.ReviewSubmitted ← NEW
Customer.ReferralUsed    ← NEW
Customer.WalletFunded    ← NEW
```

### QR Experience
```
QR.Scanned               ← NEW
QR.ExperienceActivated   ← NEW
QR.ExperienceDeactivated ← NEW
QR.CodePrinted           ← NEW
QR.CodeInstalled         ← NEW
QR.CodeReplaced          ← NEW
```

### Storefront
```
Storefront.Published     ← NEW
Storefront.ThemeUpdated  ← NEW
Storefront.PageAdded     ← NEW
```

### Realtime
```
Order.StatusChanged      ← NEW (triggers WebSocket push)
Booking.Confirmed        ← NEW (triggers WebSocket push)
Notification.Pushed      ← NEW (triggers WebSocket push)
```

## Event Flow Diagram

```
┌─────────────┐     emitEvent()     ┌──────────────┐
│  Service     │ ──────────────────▶│  Event Bus    │
│  (create     │                    │               │
│   sale,      │                    │  Store in DB  │
│   book,      │                    │               │
│   register)  │                    │  Retry 3x     │
└─────────────┘                    └──────┬───────┘
                                         │
                          ┌──────────────┼──────────────┐
                          ▼              ▼              ▼
                   ┌────────────┐ ┌──────────┐ ┌────────────┐
                   │ Job Queue  │ │WebSocket │ │  Poison    │
                   │ (pg-boss)  │ │ Push     │ │  Queue     │
                   │            │ │          │ │            │
                   │ Email Wkr  │ │ Live     │ │ Manual     │
                   │ Notif Wkr  │ │ Orders   │ │ Retry      │
                   │ Analytics   │ │ Queue    │ │            │
                   │ Report Wkr  │ │ Notifs   │ │            │
                   └────────────┘ └──────────┘ └────────────┘
```

## Event Handler Registration

```typescript
// src/modules/ai/events/event-bus.ts (extends existing)
export const EventTypes = {
  // ... existing 33 types ...

  // NEW — Customer events
  CUSTOMER_REGISTERED: "customer.registered",
  CUSTOMER_ORDER_PLACED: "customer.order_placed",
  CUSTOMER_BOOKING_CREATED: "customer.booking_created",
  CUSTOMER_PAYMENT_COMPLETED: "customer.payment_completed",

  // NEW — Installation events
  INSTALLATION_TICKET_CREATED: "installation.ticket_created",
  INSTALLATION_TASK_COMPLETED: "installation.task_completed",
  INSTALLATION_ACTIVATED: "installation.activated",

  // NEW — QR events
  QR_SCANNED: "qr.scanned",
  QR_EXPERIENCE_ACTIVATED: "qr.experience_activated",

  // NEW — Storefront events
  STOREFRONT_PUBLISHED: "storefront.published",
} as const;
```

## WebSocket Integration (New)

```typescript
// src/server/websocket/index.ts
class WebSocketManager {
  private connections: Map<string, Set<WebSocket>>;

  // Business-scoped rooms
  joinBusiness(businessId: string, ws: WebSocket): void;
  leaveBusiness(businessId: string, ws: WebSocket): void;

  // Customer-scoped rooms
  joinCustomer(customerId: string, ws: WebSocket): void;

  // Broadcast to business
  broadcast(businessId: string, event: string, data: unknown): void;

  // Send to specific customer
  sendToCustomer(customerId: string, event: string, data: unknown): void;
}

// Event → WebSocket bridge
class EventWebSocketBridge {
  // Listens to Event Bus, pushes to WebSocket
  async handleEvent(event: EventRecord): Promise<void> {
    switch (event.type) {
      case "sale.created":
        wsManager.broadcast(event.businessId, "order.new", event.data);
        break;
      case "customer.booking_created":
        wsManager.sendToCustomer(event.data.customerId, "booking.confirmed", event.data);
        break;
    }
  }
}
```
