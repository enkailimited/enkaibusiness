# 6. UI ARCHITECTURE — ERP Workspace (Existing)

## Current Stack
- **Framework:** Next.js 15 (App Router)
- **UI Library:** shadcn/ui (Radix primitives)
- **Styling:** Tailwind CSS
- **State:** Zustand (client), tRPC (server)
- **Forms:** React Hook Form + Zod

## Industry-Adaptive UI

The ERP already adapts via the Industry Engine's UI Adapter
(`src/server/industry/ui-adapter.ts`). The pattern continues:

```typescript
// Existing pattern — no change needed
const navigation = await uiAdapter.getNavigation(businessId, userRole);
// Returns: [{ label: "Sales", href: "/sales", icon, module: "sales" }]
```

## Navigation Filtering

The ERP sidebar/filtered navigation is already dynamic per industry + role:

```
Business (COMMERCE, retail)
  ├── Dashboard
  ├── Sales
  ├── Products (catalog)
  ├── Purchases
  ├── Inventory
  ├── Customers
  └── Reports

Business (HEALTHCARE, clinic)
  ├── Dashboard
  ├── Appointments (sales)
  ├── Services (catalog)
  ├── Patients (customers)
  ├── Queue
  └── Reports

Business (EDUCATION, school)
  ├── Dashboard
  ├── Admissions (sales)
  ├── Fees (catalog)
  ├── Students (customers)
  ├── Attendance
  └── Reports
```

## New ERP UI Components

### Installation Tab (per business)
```
Business Settings
├── General
├── Subscription
├── Branches
├── Installation ← NEW
│   ├── Ticket Status
│   ├── Task Checklist
│   ├── Distributor Info
│   └── Activation
└── ...
```

### QR Management Tab
```
Business Settings
├── ...
├── QR Experiences ← NEW
│   ├── Available Experiences
│   ├── Generate QR
│   ├── Print QR
│   ├── Installation Status
│   └── Analytics
└── ...
```

### Distributor Dashboard (platform role)
```
Platform (distributor)
├── Installation Tickets ← NEW
│   ├── Open / Assigned / Completed
│   ├── Schedule Visit
│   ├── Complete Task
│   └── Activate Business
├── My Visits
├── Inventory (QR supplies)
└── Reports
```
