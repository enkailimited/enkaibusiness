# 9. INSTALLATION WORKFLOW

## Overview

Installation is a **mandatory gating process**. No business goes live until
installation is complete and activated by the Distributor Team.

```
CRM Lead
   │
   ▼
Business Registration (PENDING_SETUP)
   │
   ▼
Subscription Activation (PENDING)
   │
   ▼
Installation Ticket Created (OPEN)
   │
   ▼
Distributor Assigned (ASSIGNED)
   │
   ▼
Site Visit (IN_PROGRESS)
   │
   ├── 1. Business Verification
   ├── 2. Branch Configuration
   ├── 3. Catalog Publishing
   ├── 4. Payment Configuration
   ├── 5. Delivery Configuration
   │
   ▼
QR Generation & Printing
   │
   ▼
QR Installation
   │
   ▼
Staff Training
   │
   ▼
Testing
   │
   ├── Internal Test
   └── Customer Test
   │
   ▼
Owner Approval
   │
   ▼
ACTIVATION → Customer Experience Live
```

## State Machine

```typescript
enum InstallationStatus {
  OPEN = "open",
  ASSIGNED = "assigned",
  SITE_VISIT_SCHEDULED = "site_visit_scheduled",
  SITE_VISIT_COMPLETED = "site_visit_completed",
  CONFIGURATION = "configuration",
  QR_READY = "qr_ready",
  QR_INSTALLED = "qr_installed",
  TRAINING = "training",
  TESTING = "testing",
  AWAITING_APPROVAL = "awaiting_approval",
  ACTIVATED = "activated",
  BLOCKED = "blocked",
  CANCELLED = "cancelled",
}

// Allowed transitions
const TRANSITIONS: Record<InstallationStatus, InstallationStatus[]> = {
  open: ["assigned", "cancelled"],
  assigned: ["site_visit_scheduled", "blocked"],
  site_visit_scheduled: ["site_visit_completed", "site_visit_scheduled"],
  site_visit_completed: ["configuration", "blocked"],
  configuration: ["qr_ready", "blocked"],
  qr_ready: ["qr_installed"],
  qr_installed: ["training"],
  training: ["testing"],
  testing: ["awaiting_approval", "blocked"],
  awaiting_approval: ["activated", "testing", "blocked"],
  activated: [],
  blocked: ["open", "cancelled"],
  cancelled: [],
};
```

## Task Checklist (Per Installation)

```
□ Business Documents Verified
□ Physical Location Verified
□ Branch Profile Created
□ Catalog Published (at least 10 items)
□ Payment Method Configured
□ Delivery Zones Configured (if applicable)
□ QR Experiences Selected
□ QR Codes Generated
□ QR Codes Printed
□ QR Codes Installed (physical)
□ Staff Trained (ERP usage)
□ Staff Trained (QR system)
□ Internal Test Passed (test order)
□ Customer Test Passed
□ Owner Approved
□ Activation Confirmed
```

## Automatic Events

Each task completion publishes an event:

```
task.completed("site_verification")
  → Event: installation.task_completed
  → If all tasks done → status = "awaiting_approval"

task.completed("activation")
  → Event: installation.activated
  → Business status → "ACTIVE"
  → QR experiences → "LIVE"
  → Customer App goes live
```

## Activation Gate

```typescript
async function activateBusiness(businessId: string, activatedBy: string) {
  const ticket = await getInstallationTicket(businessId);
  
  // Validate all tasks completed
  const incompleteTasks = ticket.tasks.filter(t => !t.isCompleted);
  if (incompleteTasks.length > 0) {
    throw new Error("Cannot activate: incomplete tasks remain");
  }

  // Validate owner approval
  const approvalTask = ticket.tasks.find(t => t.taskType === "owner_approval");
  if (!approvalTask?.isCompleted) {
    throw new Error("Cannot activate: owner approval required");
  }

  // Activate
  await prisma.$transaction([
    prisma.business.update({ where: { id: businessId }, data: { status: "ACTIVE", isActive: true } }),
    prisma.installationTicket.update({ where: { id: ticket.id }, data: { status: "activated", completedAt: new Date() } }),
    prisma.qrExperienceInstallation.updateMany({ where: { businessId }, data: { status: "ACTIVE" } }),
  ]);

  await emitEvent("installation.activated", { businessId, activatedBy });
  await emitEvent("business.activated", { businessId });
}
```

## Distributor Dashboard

```typescript
// Platform-level distributor view
async function getDistributorTickets(distributorId: string) {
  return prisma.installationTicket.findMany({
    where: { distributorId },
    include: {
      business: { select: { name: true, status: true } },
      tasks: { where: { isCompleted: false } },
      visits: { orderBy: { visitDate: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });
}
```

## Installation Reports

| Report | Purpose |
|--------|---------|
| Avg Installation Time | Performance metric |
| Task Completion Rate | Bottleneck detection |
| Distributor Performance | Individual metrics |
| Installations by Region | Geographic distribution |
| Installations by Industry | Industry adoption |
| QR Deployment Stats | QR code metrics |
| Activation Rate | Conversion tracking |
