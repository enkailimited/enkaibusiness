import "server-only";

import type { IndustryPermission } from "./types";

export interface ModulePermission {
  module: string;
  slug: string;
  name: string;
  description: string;
}

const ALL_PERMISSIONS: Record<string, ModulePermission[]> = {
  core: [
    { module: "core", slug: "dashboard.view", name: "View Dashboard", description: "View business dashboard" },
    { module: "core", slug: "settings.view", name: "View Settings", description: "View business settings" },
    { module: "core", slug: "settings.manage", name: "Manage Settings", description: "Manage business settings" },
  ],
  staff: [
    { module: "staff", slug: "staff.view", name: "View Staff", description: "View staff members" },
    { module: "staff", slug: "staff.create", name: "Create Staff", description: "Add new staff members" },
    { module: "staff", slug: "staff.update", name: "Update Staff", description: "Edit staff details" },
    { module: "staff", slug: "staff.delete", name: "Delete Staff", description: "Remove staff members" },
    { module: "staff", slug: "staff.assign", name: "Assign Staff", description: "Assign staff to roles and branches" },
  ],
  accounting: [
    { module: "accounting", slug: "accounting.view", name: "View Accounting", description: "View financial reports" },
    { module: "accounting", slug: "accounting.manage", name: "Manage Accounting", description: "Manage accounts and transactions" },
    { module: "accounting", slug: "accounting.reports", name: "Accounting Reports", description: "Generate financial reports" },
  ],
  pos: [
    { module: "pos", slug: "pos.open", name: "Open POS", description: "Open POS terminal" },
    { module: "pos", slug: "pos.process-sale", name: "Process Sale", description: "Process sales at POS" },
    { module: "pos", slug: "pos.void", name: "Void Sale", description: "Void POS transactions" },
    { module: "pos", slug: "pos.discount", name: "Apply Discount", description: "Apply discounts at POS" },
    { module: "pos", slug: "pos.refund", name: "Process Refund", description: "Process refunds at POS" },
  ],
  inventory: [
    { module: "inventory", slug: "inventory.view", name: "View Inventory", description: "View inventory levels" },
    { module: "inventory", slug: "inventory.create", name: "Add Inventory", description: "Add new inventory items" },
    { module: "inventory", slug: "inventory.update", name: "Update Inventory", description: "Edit inventory items" },
    { module: "inventory", slug: "inventory.delete", name: "Delete Inventory", description: "Remove inventory items" },
    { module: "inventory", slug: "inventory.adjust", name: "Adjust Stock", description: "Adjust stock levels" },
    { module: "inventory", slug: "inventory.transfer", name: "Transfer Stock", description: "Transfer stock between locations" },
    { module: "inventory", slug: "inventory.count", name: "Stock Count", description: "Perform stock counts" },
  ],
  sales: [
    { module: "sales", slug: "sales.view", name: "View Sales", description: "View sales records" },
    { module: "sales", slug: "sales.create", name: "Create Sale", description: "Create new sales" },
    { module: "sales", slug: "sales.update", name: "Update Sale", description: "Edit sales records" },
    { module: "sales", slug: "sales.delete", name: "Delete Sale", description: "Delete sales records" },
    { module: "sales", slug: "sales.reports", name: "Sales Reports", description: "Generate sales reports" },
  ],
  customers: [
    { module: "customers", slug: "customers.view", name: "View Customers", description: "View customer records" },
    { module: "customers", slug: "customers.create", name: "Create Customer", description: "Add new customers" },
    { module: "customers", slug: "customers.update", name: "Update Customer", description: "Edit customer details" },
    { module: "customers", slug: "customers.delete", name: "Delete Customer", description: "Remove customer records" },
    { module: "customers", slug: "customers.credit", name: "Manage Credit", description: "Manage customer credit" },
  ],
  purchasing: [
    { module: "purchasing", slug: "purchases.view", name: "View Purchases", description: "View purchase records" },
    { module: "purchasing", slug: "purchases.create", name: "Create Purchase", description: "Create purchase orders" },
    { module: "purchasing", slug: "purchases.update", name: "Update Purchase", description: "Edit purchase records" },
    { module: "purchasing", slug: "purchases.delete", name: "Delete Purchase", description: "Delete purchase records" },
    { module: "purchasing", slug: "purchases.approve", name: "Approve Purchase", description: "Approve purchase orders" },
  ],
  suppliers: [
    { module: "suppliers", slug: "suppliers.view", name: "View Suppliers", description: "View supplier records" },
    { module: "suppliers", slug: "suppliers.create", name: "Create Supplier", description: "Add new suppliers" },
    { module: "suppliers", slug: "suppliers.update", name: "Update Supplier", description: "Edit supplier details" },
    { module: "suppliers", slug: "suppliers.delete", name: "Delete Supplier", description: "Remove supplier records" },
  ],
  pricing: [
    { module: "pricing", slug: "pricing.view", name: "View Pricing", description: "View price lists" },
    { module: "pricing", slug: "pricing.create", name: "Create Price List", description: "Create price lists" },
    { module: "pricing", slug: "pricing.update", name: "Update Pricing", description: "Edit price lists" },
  ],
  promotions: [
    { module: "promotions", slug: "promotions.view", name: "View Promotions", description: "View promotions" },
    { module: "promotions", slug: "promotions.create", name: "Create Promotion", description: "Create promotions" },
    { module: "promotions", slug: "promotions.update", name: "Update Promotion", description: "Edit promotions" },
  ],
  returns: [
    { module: "returns", slug: "returns.view", name: "View Returns", description: "View return records" },
    { module: "returns", slug: "returns.process", name: "Process Return", description: "Process returns and refunds" },
  ],
  payments: [
    { module: "payments", slug: "payments.view", name: "View Payments", description: "View payment records" },
    { module: "payments", slug: "payments.process", name: "Process Payment", description: "Process payments" },
    { module: "payments", slug: "payments.refund", name: "Refund Payment", description: "Process payment refunds" },
  ],
  deliveries: [
    { module: "deliveries", slug: "deliveries.view", name: "View Deliveries", description: "View delivery records" },
    { module: "deliveries", slug: "deliveries.create", name: "Create Delivery", description: "Create delivery records" },
    { module: "deliveries", slug: "deliveries.update", name: "Update Delivery", description: "Update delivery status" },
  ],
  menu: [
    { module: "menu", slug: "menu.view", name: "View Menu", description: "View menu items" },
    { module: "menu", slug: "menu.create", name: "Create Menu Item", description: "Add menu items" },
    { module: "menu", slug: "menu.update", name: "Update Menu", description: "Edit menu items" },
    { module: "menu", slug: "menu.delete", name: "Delete Menu", description: "Remove menu items" },
  ],
  kitchen: [
    { module: "kitchen", slug: "kitchen.view", name: "View Orders", description: "View kitchen orders" },
    { module: "kitchen", slug: "kitchen.update", name: "Update Order Status", description: "Update order preparation status" },
  ],
  tables: [
    { module: "tables", slug: "tables.view", name: "View Tables", description: "View table layout" },
    { module: "tables", slug: "tables.assign", name: "Assign Table", description: "Assign customers to tables" },
  ],
  reservations: [
    { module: "reservations", slug: "reservations.view", name: "View Reservations", description: "View reservations" },
    { module: "reservations", slug: "reservations.create", name: "Create Reservation", description: "Create reservations" },
    { module: "reservations", slug: "reservations.update", name: "Update Reservation", description: "Edit reservations" },
  ],
  students: [
    { module: "students", slug: "students.view", name: "View Students", description: "View student records" },
    { module: "students", slug: "students.create", name: "Create Student", description: "Add new students" },
    { module: "students", slug: "students.update", name: "Update Student", description: "Edit student details" },
    { module: "students", slug: "students.delete", name: "Delete Student", description: "Remove student records" },
    { module: "students", slug: "students.grade", name: "Grade Student", description: "Record student grades" },
  ],
  teachers: [
    { module: "teachers", slug: "teachers.view", name: "View Teachers", description: "View teacher records" },
    { module: "teachers", slug: "teachers.assign", name: "Assign Teacher", description: "Assign teachers to classes" },
  ],
  attendance: [
    { module: "attendance", slug: "attendance.view", name: "View Attendance", description: "View attendance records" },
    { module: "attendance", slug: "attendance.record", name: "Record Attendance", description: "Record student attendance" },
  ],
  examinations: [
    { module: "examinations", slug: "exams.view", name: "View Exams", description: "View examination records" },
    { module: "examinations", slug: "exams.create", name: "Create Exam", description: "Create examinations" },
    { module: "examinations", slug: "exams.grade", name: "Grade Exam", description: "Record exam grades" },
    { module: "examinations", slug: "exams.reports", name: "Exam Reports", description: "Generate exam reports" },
  ],
  patients: [
    { module: "patients", slug: "patients.view", name: "View Patients", description: "View patient records" },
    { module: "patients", slug: "patients.create", name: "Create Patient", description: "Register new patients" },
    { module: "patients", slug: "patients.update", name: "Update Patient", description: "Edit patient details" },
  ],
  appointments: [
    { module: "appointments", slug: "appointments.view", name: "View Appointments", description: "View appointments" },
    { module: "appointments", slug: "appointments.create", name: "Create Appointment", description: "Schedule appointments" },
    { module: "appointments", slug: "appointments.update", name: "Update Appointment", description: "Reschedule appointments" },
  ],
  doctors: [
    { module: "doctors", slug: "doctors.view", name: "View Doctors", description: "View doctor records" },
    { module: "doctors", slug: "doctors.assign", name: "Assign Doctor", description: "Assign doctors to departments" },
  ],
  pharmacy: [
    { module: "pharmacy", slug: "pharmacy.view", name: "View Pharmacy", description: "View pharmacy inventory" },
    { module: "pharmacy", slug: "pharmacy.dispense", name: "Dispense Medication", description: "Dispense medications" },
    { module: "pharmacy", slug: "pharmacy.manage", name: "Manage Pharmacy", description: "Manage pharmacy inventory" },
  ],
  billing: [
    { module: "billing", slug: "billing.view", name: "View Bills", description: "View billing records" },
    { module: "billing", slug: "billing.create", name: "Create Bill", description: "Create bills and invoices" },
    { module: "billing", slug: "billing.process", name: "Process Payment", description: "Process bill payments" },
    { module: "billing", slug: "billing.insurance", name: "Manage Insurance", description: "Manage insurance claims" },
  ],
  "medical-records": [
    { module: "medical-records", slug: "records.view", name: "View Records", description: "View medical records" },
    { module: "medical-records", slug: "records.create", name: "Create Record", description: "Create medical records" },
    { module: "medical-records", slug: "records.update", name: "Update Record", description: "Update medical records" },
  ],
  production: [
    { module: "production", slug: "production.view", name: "View Production", description: "View production plans" },
    { module: "production", slug: "production.create", name: "Create Plan", description: "Create production plans" },
    { module: "production", slug: "production.update", name: "Update Plan", description: "Update production plans" },
    { module: "production", slug: "production.track", name: "Track Production", description: "Track production progress" },
  ],
  "work-orders": [
    { module: "work-orders", slug: "work-orders.view", name: "View Work Orders", description: "View work orders" },
    { module: "work-orders", slug: "work-orders.create", name: "Create Work Order", description: "Create work orders" },
    { module: "work-orders", slug: "work-orders.update", name: "Update Work Order", description: "Update work order status" },
  ],
  "quality-control": [
    { module: "quality-control", slug: "quality.view", name: "View Inspections", description: "View quality inspections" },
    { module: "quality-control", slug: "quality.create", name: "Create Inspection", description: "Create inspection records" },
  ],
  properties: [
    { module: "properties", slug: "properties.view", name: "View Properties", description: "View property listings" },
    { module: "properties", slug: "properties.create", name: "Create Property", description: "Add new properties" },
    { module: "properties", slug: "properties.update", name: "Update Property", description: "Edit property details" },
  ],
  tenants: [
    { module: "tenants", slug: "tenants.view", name: "View Tenants", description: "View tenant records" },
    { module: "tenants", slug: "tenants.create", name: "Create Tenant", description: "Register new tenants" },
    { module: "tenants", slug: "tenants.update", name: "Update Tenant", description: "Edit tenant details" },
  ],
  rent: [
    { module: "rent", slug: "rent.view", name: "View Rent", description: "View rent records" },
    { module: "rent", slug: "rent.collect", name: "Collect Rent", description: "Record rent payments" },
    { module: "rent", slug: "rent.reports", name: "Rent Reports", description: "Generate rent reports" },
  ],
  fleet: [
    { module: "fleet", slug: "fleet.view", name: "View Fleet", description: "View vehicle fleet" },
    { module: "fleet", slug: "fleet.create", name: "Add Vehicle", description: "Add vehicles to fleet" },
    { module: "fleet", slug: "fleet.update", name: "Update Vehicle", description: "Edit vehicle details" },
    { module: "fleet", slug: "fleet.maintenance", name: "Schedule Maintenance", description: "Schedule vehicle maintenance" },
  ],
  drivers: [
    { module: "drivers", slug: "drivers.view", name: "View Drivers", description: "View driver records" },
    { module: "drivers", slug: "drivers.assign", name: "Assign Driver", description: "Assign drivers to vehicles" },
  ],
  deliveries: [
    { module: "deliveries", slug: "deliveries.view", name: "View Deliveries", description: "View delivery records" },
    { module: "deliveries", slug: "deliveries.create", name: "Create Delivery", description: "Create delivery orders" },
    { module: "deliveries", slug: "deliveries.update", name: "Update Delivery", description: "Update delivery status" },
    { module: "deliveries", slug: "deliveries.track", name: "Track Delivery", description: "Track delivery progress" },
  ],
  donations: [
    { module: "donations", slug: "donations.view", name: "View Donations", description: "View donation records" },
    { module: "donations", slug: "donations.create", name: "Record Donation", description: "Record new donations" },
    { module: "donations", slug: "donations.reports", name: "Donation Reports", description: "Generate donation reports" },
  ],
  members: [
    { module: "members", slug: "members.view", name: "View Members", description: "View member records" },
    { module: "members", slug: "members.create", name: "Create Member", description: "Register new members" },
    { module: "members", slug: "members.update", name: "Update Member", description: "Edit member details" },
  ],
};

export class PermissionResolver {
  getPermissionsForModule(module: string): ModulePermission[] {
    return ALL_PERMISSIONS[module] ?? [];
  }

  getPermissionsForModules(modules: string[]): ModulePermission[] {
    const perms: ModulePermission[] = [];
    for (const module of modules) {
      const modulePerms = this.getPermissionsForModule(module);
      perms.push(...modulePerms);
    }
    return perms;
  }

  async getAvailablePermissions(businessId: string): Promise<ModulePermission[]> {
    const { moduleResolver } = await import("./module-resolver");
    const enabledModules = await moduleResolver.getEnabledModules(businessId);
    return this.getPermissionsForModules(enabledModules);
  }
}

export const permissionResolver = new PermissionResolver();
