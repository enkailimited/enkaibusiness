import "server-only";

import { prisma } from "@/server/db";

export interface WorkflowDefinition {
  slug: string;
  name: string;
  description: string;
  module: string;
  triggers: string[];
  actions: string[];
  isDefault: boolean;
}

const WORKFLOWS: Record<string, WorkflowDefinition[]> = {
  commerce: [
    { slug: "low-stock-notify", name: "Low Stock Notification", description: "Alert when stock falls below minimum", module: "inventory", triggers: ["inventory.below-minimum"], actions: ["notify.staff", "create.purchase-order"], isDefault: true },
    { slug: "new-sale-receipt", name: "New Sale Receipt", description: "Generate receipt on sale completion", module: "sales", triggers: ["sale.completed"], actions: ["notify.customer", "generate.receipt"], isDefault: true },
    { slug: "customer-credit-check", name: "Customer Credit Check", description: "Check credit before processing sale", module: "customers", triggers: ["sale.before-create"], actions: ["check.credit-limit", "block.if-exceeded"], isDefault: true },
    { slug: "return-approval", name: "Return Approval", description: "Require approval for high-value returns", module: "returns", triggers: ["return.initiated"], actions: ["notify.manager", "require.approval"], isDefault: false },
    { slug: "daily-sales-report", name: "Daily Sales Report", description: "Send end-of-day sales summary", module: "sales", triggers: ["schedule.daily"], actions: ["generate.report", "email.staff"], isDefault: false },
    { slug: "purchase-approval", name: "Purchase Order Approval", description: "Require approval for large purchases", module: "purchasing", triggers: ["purchase.created"], actions: ["notify.manager", "require.approval"], isDefault: false },
  ],
  restaurant: [
    { slug: "new-order-kitchen", name: "New Order to Kitchen", description: "Send new orders to kitchen display", module: "kitchen", triggers: ["order.placed"], actions: ["notify.kitchen", "update.kds"], isDefault: true },
    { slug: "table-ready-notify", name: "Table Ready Notification", description: "Notify when table is ready", module: "tables", triggers: ["table.ready"], actions: ["notify.host", "update.status"], isDefault: true },
    { slug: "reservation-reminder", name: "Reservation Reminder", description: "Send reminder before reservation", module: "reservations", triggers: ["schedule.before-reservation"], actions: ["notify.customer", "update.status"], isDefault: false },
    { slug: "low-ingredient-alert", name: "Low Ingredient Alert", description: "Alert when ingredients run low", module: "ingredients", triggers: ["inventory.below-minimum"], actions: ["notify.staff", "create.purchase-order"], isDefault: true },
  ],
  education: [
    { slug: "new-student-onboard", name: "New Student Onboarding", description: "Onboard new students", module: "students", triggers: ["student.created"], actions: ["assign.class", "notify.parents", "create.records"], isDefault: true },
    { slug: "fee-reminder", name: "Fee Payment Reminder", description: "Remind about pending fees", module: "finance", triggers: ["schedule.weekly", "fee.overdue"], actions: ["notify.parents", "update.status"], isDefault: true },
    { slug: "exam-results-publish", name: "Exam Results Published", description: "Publish and notify exam results", module: "examinations", triggers: ["exam.graded"], actions: ["notify.parents", "publish.results"], isDefault: false },
    { slug: "attendance-alert", name: "Attendance Alert", description: "Alert on prolonged absence", module: "attendance", triggers: ["attendance.missed-3-days"], actions: ["notify.parents", "notify.teacher"], isDefault: true },
  ],
  healthcare: [
    { slug: "new-patient-register", name: "New Patient Registration", description: "Register and create records", module: "patients", triggers: ["patient.created"], actions: ["create.records", "notify.staff"], isDefault: true },
    { slug: "appointment-reminder", name: "Appointment Reminder", description: "Send appointment reminder", module: "appointments", triggers: ["schedule.before-appointment"], actions: ["notify.patient", "update.status"], isDefault: true },
    { slug: "lab-results-ready", name: "Lab Results Ready", description: "Notify when lab results available", module: "laboratory", triggers: ["lab.completed"], actions: ["notify.doctor", "update.record"], isDefault: true },
    { slug: "prescription-refill", name: "Prescription Refill Alert", description: "Alert for prescription refills", module: "pharmacy", triggers: ["prescription.due"], actions: ["notify.patient", "notify.pharmacist"], isDefault: false },
  ],
  manufacturing: [
    { slug: "work-order-release", name: "Work Order Release", description: "Release work orders to production", module: "work-orders", triggers: ["work-order.approved"], actions: ["notify.production", "allocate.materials"], isDefault: true },
    { slug: "quality-fail-alert", name: "Quality Failure Alert", description: "Alert on quality check failure", module: "quality-control", triggers: ["quality.failed"], actions: ["notify.manager", "hold.production"], isDefault: true },
    { slug: "material-reorder", name: "Material Reorder", description: "Auto-reorder raw materials", module: "inventory", triggers: ["inventory.below-minimum"], actions: ["create.purchase-order", "notify.procurement"], isDefault: true },
  ],
  agriculture: [
    { slug: "livestock-health-check", name: "Livestock Health Check", description: "Schedule regular health checks", module: "livestock", triggers: ["schedule.weekly"], actions: ["notify.vet", "update.records"], isDefault: true },
    { slug: "harvest-ready", name: "Harvest Ready Notification", description: "Notify when crops ready for harvest", module: "harvest", triggers: ["crop.mature"], actions: ["notify.farmers", "schedule.harvest"], isDefault: true },
    { slug: "feed-low-alert", name: "Feed Low Alert", description: "Alert when feed is low", module: "feeds", triggers: ["inventory.below-minimum"], actions: ["notify.staff", "create.purchase-order"], isDefault: true },
  ],
  services: [
    { slug: "new-appointment", name: "New Appointment", description: "Schedule and confirm appointments", module: "appointments", triggers: ["appointment.created"], actions: ["notify.staff", "confirm.customer"], isDefault: true },
    { slug: "project-milestone", name: "Project Milestone", description: "Track project progress", module: "projects", triggers: ["milestone.reached"], actions: ["notify.team", "update.status"], isDefault: true },
    { slug: "invoice-reminder", name: "Invoice Reminder", description: "Send invoice payment reminder", module: "invoices", triggers: ["schedule.weekly", "invoice.overdue"], actions: ["notify.customer", "update.status"], isDefault: false },
  ],
  logistics: [
    { slug: "new-delivery-assign", name: "New Delivery Assignment", description: "Assign driver to new delivery", module: "deliveries", triggers: ["delivery.created"], actions: ["assign.driver", "notify.customer"], isDefault: true },
    { slug: "delivery-delayed", name: "Delivery Delayed", description: "Notify on delivery delay", module: "tracking", triggers: ["delivery.delayed"], actions: ["notify.customer", "re-route.if-possible"], isDefault: true },
    { slug: "maintenance-due", name: "Maintenance Due", description: "Schedule vehicle maintenance", module: "fleet", triggers: ["schedule.monthly", "vehicle.mileage-reached"], actions: ["schedule.maintenance", "notify.fleet-manager"], isDefault: true },
  ],
  "real-estate": [
    { slug: "lease-expiring", name: "Lease Expiring", description: "Notify on lease expiration", module: "contracts", triggers: ["schedule.before-expiry"], actions: ["notify.tenant", "notify.owner", "offer.renewal"], isDefault: true },
    { slug: "rent-overdue", name: "Rent Overdue", description: "Follow up on overdue rent", module: "rent", triggers: ["schedule.weekly", "rent.overdue"], actions: ["notify.tenant", "update.status"], isDefault: true },
    { slug: "maintenance-request", name: "Maintenance Request", description: "Handle maintenance requests", module: "maintenance", triggers: ["maintenance.requested"], actions: ["assign.contractor", "notify.tenant"], isDefault: true },
  ],
  "non-profit": [
    { slug: "donation-received", name: "Donation Received", description: "Acknowledge and track donations", module: "donations", triggers: ["donation.received"], actions: ["send.thank-you", "update.records", "generate.receipt"], isDefault: true },
    { slug: "new-member", name: "New Member Onboarding", description: "Welcome and onboard new members", module: "members", triggers: ["member.created"], actions: ["send.welcome", "assign.mentor", "add.directory"], isDefault: true },
    { slug: "project-funding", name: "Project Funding Alert", description: "Alert on project funding status", module: "projects", triggers: ["project.under-funded"], actions: ["notify.manager", "launch.fundraiser"], isDefault: false },
  ],
};

export class WorkflowResolver {
  async getAvailableWorkflows(businessId: string): Promise<WorkflowDefinition[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    return WORKFLOWS[slug] ?? WORKFLOWS.commerce;
  }

  async getDefaultWorkflows(businessId: string): Promise<WorkflowDefinition[]> {
    const workflows = await this.getAvailableWorkflows(businessId);
    return workflows.filter((w) => w.isDefault);
  }
}

export const workflowResolver = new WorkflowResolver();
