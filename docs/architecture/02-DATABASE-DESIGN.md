# 2. DATABASE DESIGN — Universal Customer Experience Platform

## Principles

1. **Catalog is universal** — never create Product-specific tables
2. **Industry-agnostic** — all models support all industries via type discriminators
3. **Multi-tenant** — every row belongs to a business or branch
4. **Event-sourced** — state changes publish events
5. **Extension-ready** — JSON metadata fields on major entities

## Existing Models (Already in Schema)

The following models already exist in `prisma/schema.prisma` and require
**zero migration**. They are the foundation for the Customer Experience Platform.

### Customer Domain
| Model | Line | Purpose |
|-------|------|---------|
| `CustomerAccount` | 3517 | Customer identity, auth, preferences |
| `CustomerProfile` | — | Extends CustomerAccount with profile data |
| `CustomerAddress` | 3563 | Saved addresses |
| `CustomerWallet` | 3591 | Wallet balance, transactions |
| `CustomerWalletTransaction` | 3616 | Wallet ledger |

### Loyalty & Engagement Domain
| Model | Line | Purpose |
|-------|------|---------|
| `LoyaltyAccount` | 3639 | Points, tier, rewards |
| `Coupon` | 3032 | Discount codes |
| `CouponRedemption` | 3061 | Coupon usage tracking |
| `Promotion` | 2988 | Sales promotions |
| `PromotionItem` | 3016 | Promotion-line items |

### Storefront Domain
| Model | Line | Purpose |
|-------|------|---------|
| `Storefront` | 3870 | Per-business storefront config |
| `StorefrontTheme` | 3919 | Theming (colors, fonts, layout) |
| `StorefrontPage` | — | Custom pages |
| `StorefrontSection` | — | Page sections |

### QR Domain
| Model | Line | Purpose |
|-------|------|---------|
| `QRExperience` | 3946 | QR experience definition |
| `QRExperienceInstallation` | 3975 | QR deployment tracking |

### Booking Domain
| Model | Line | Purpose |
|-------|------|---------|
| `Booking` | 4203 | Appointments, reservations, admissions |
| `BookingItem` | 4256 | Booking line items |
| `DeliveryZone` | 4282 | Delivery areas per branch |

## New Models Required

### Customer Engagement (5 models)

```
model Review {
  id          String   @id @default(uuid())
  businessId  String
  customerId  String
  catalogItemId String?  // product, service, room, etc.
  bookingId   String?
  rating      Int      // 1-5
  title       String?
  body        String?
  isApproved  Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([businessId, catalogItemId])
  @@index([businessId, rating])
  @@map("reviews")
}

model Favorite {
  id           String   @id @default(uuid())
  customerId   String
  catalogItemId String
  createdAt    DateTime @default(now())

  @@unique([customerId, catalogItemId])
  @@map("favorites")
}

model Wishlist {
  id          String   @id @default(uuid())
  customerId  String
  name        String   @default("Default")
  createdAt   DateTime @default(now())

  items       WishlistItem[]

  @@map("wishlists")
}

model WishlistItem {
  id           String   @id @default(uuid())
  wishlistId   String
  catalogItemId String
  addedAt      DateTime @default(now())

  @@unique([wishlistId, catalogItemId])
  @@map("wishlist_items")
}

model Referral {
  id           String   @id @default(uuid())
  referrerId   String
  refereeId    String?
  refereeEmail String?
  code         String   @unique
  status       String   @default("pending") // pending, joined, rewarded
  rewardAmount Decimal? @db.Decimal(15, 2)
  createdAt    DateTime @default(now())
  completedAt  DateTime?

  @@map("referrals")
}

model Reservation {
  id          String   @id @default(uuid())
  businessId  String
  branchId    String?
  customerId  String
  catalogItemId String?  // room, table, service
  startTime   DateTime
  endTime     DateTime?
  guests      Int?
  status      String   @default("pending") // pending, confirmed, checked_in, cancelled, completed
  notes       String?
  createdAt   DateTime @default(now())

  @@index([businessId, startTime])
  @@index([customerId])
  @@map("reservations")
}
```

### Installation Domain (5 models)

```
model InstallationTicket {
  id            String   @id @default(uuid())
  businessId    String
  branchId      String?
  distributorId String?
  ticketNumber  String   @unique
  status        String   @default("open")
  // open, assigned, in_progress, completed, blocked, cancelled
  priority      String   @default("normal")
  scheduledDate DateTime?
  completedAt   DateTime?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tasks         InstallationTask[]
  visits        InstallationVisit[]

  @@index([businessId])
  @@index([distributorId])
  @@index([status])
  @@map("installation_tickets")
}

model InstallationVisit {
  id              String   @id @default(uuid())
  ticketId        String
  distributorId   String
  visitDate       DateTime
  status          String   @default("scheduled")
  // scheduled, checked_in, in_progress, completed, rescheduled
  notes           String?
  photoUrls       String[] // array of photo URLs
  locationLat     Decimal? @db.Decimal(10, 7)
  locationLng     Decimal? @db.Decimal(10, 7)
  durationMinutes Int?
  createdAt       DateTime @default(now())

  @@index([ticketId])
  @@map("installation_visits")
}

model InstallationTask {
  id          String   @id @default(uuid())
  ticketId    String
  taskType    String
  // site_verification, branch_config, catalog_publish,
  // payment_config, delivery_config, qr_generate,
  // qr_print, qr_install, staff_training, testing,
  // customer_test, owner_approval, activation
  label       String
  isCompleted Boolean  @default(false)
  completedAt DateTime?
  completedBy String?
  notes       String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([ticketId])
  @@map("installation_tasks")
}

model InstallationChecklist {
  id          String   @id @default(uuid())
  businessId  String
  branchId    String?
  item        String
  isRequired  Boolean  @default(true)
  category    String   // hardware, software, training, documentation
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([businessId])
  @@map("installation_checklists")
}

model QRCode {
  id            String   @id @default(uuid())
  businessId    String
  branchId      String?
  experienceId  String?  // FK -> QRExperience
  tableId       String?
  label         String   // "Table 1", "Main Entrance", "Check-in"
  url           String   // The redirect URL
  imageUrl      String?  // Printed QR image
  status        String   @default("pending")
  // pending, printed, installed, active, replaced, retired
  installedAt   DateTime?
  installedBy   String?
  location      String?  // Physical location description
  metadata      Json?    @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([businessId])
  @@index([experienceId])
  @@map("qr_codes")
}
```

## Entity Relationship Diagram (Text)

```
Business 1────N Branch
  │               │
  │               1────N QRCode
  │               │
  │               1────N DeliveryZone
  │               │
  │               1────N InstallationTicket 1────N InstallationTask
  │               │         │
  │               1────N InstallationVisit
  │
  1────N CustomerAccount 1────1 CustomerProfile
  │         │                    │
  │         1────N CustomerAddress
  │         │
  │         1────1 CustomerWallet 1────N CustomerWalletTransaction
  │         │
  │         1────1 LoyaltyAccount
  │         │
  │         1────N Booking 1────N BookingItem
  │         │
  │         1────N Review
  │         │
  │         1────N Favorite
  │         │
  │         1────N Wishlist 1────N WishlistItem
  │         │
  │         1────N Referral
  │         │
  │         1────N Reservation
  │
  1────1 Storefront 1────1 StorefrontTheme
  │         │
  │         1────N StorefrontPage 1────N StorefrontSection
  │
  1────N QRExperience 1────N QRExperienceInstallation
```

## Migration Strategy

### Phase 1 — Add New Models (No existing table changes)
```sql
-- All INSERT statements for new tables only
-- Zero ALTER on existing tables
```

### Phase 2 — Add Foreign Keys (Non-blocking)
- Add FK constraints where missing
- Add indexes for new query patterns

### Phase 3 — Data Migration (If needed)
- Backfill any required relationships
- No data loss expected

### Rollback
- DROP new tables only
- Existing ERP tables untouched
