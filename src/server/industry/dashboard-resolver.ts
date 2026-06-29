import "server-only";

import { getIndustry } from "./registry";
import { prisma } from "@/server/db";

export interface WidgetDefinition {
  id: string;
  name: string;
  type: "kpi" | "chart" | "table" | "list";
  module: string;
  defaultSize: "small" | "medium" | "large";
}

export interface DashboardDefinition {
  slug: string;
  name: string;
  description: string;
  widgets: WidgetDefinition[];
  kpis: { key: string; label: string; format: "number" | "currency" | "percent" }[];
}

const DASHBOARDS: Record<string, DashboardDefinition> = {
  commerce: {
    slug: "commerce",
    name: "Commerce Dashboard",
    description: "Retail and commerce operations dashboard",
    widgets: [
      { id: "today-sales", name: "Today's Sales", type: "kpi", module: "sales", defaultSize: "small" },
      { id: "active-orders", name: "Active Orders", type: "kpi", module: "sales", defaultSize: "small" },
      { id: "low-stock", name: "Low Stock Items", type: "kpi", module: "inventory", defaultSize: "small" },
      { id: "sales-chart", name: "Sales Trend", type: "chart", module: "sales", defaultSize: "large" },
      { id: "top-products", name: "Top Products", type: "table", module: "inventory", defaultSize: "medium" },
      { id: "recent-transactions", name: "Recent Transactions", type: "table", module: "sales", defaultSize: "medium" },
      { id: "inventory-value", name: "Inventory Value", type: "kpi", module: "inventory", defaultSize: "small" },
      { id: "cash-flow", name: "Cash Flow", type: "chart", module: "accounting", defaultSize: "medium" },
    ],
    kpis: [
      { key: "todayRevenue", label: "Today's Revenue", format: "currency" },
      { key: "transactionCount", label: "Transactions", format: "number" },
      { key: "averageOrderValue", label: "Avg Order Value", format: "currency" },
      { key: "lowStockCount", label: "Low Stock Items", format: "number" },
      { key: "inventoryValue", label: "Inventory Value", format: "currency" },
    ],
  },
  restaurant: {
    slug: "restaurant",
    name: "Restaurant Dashboard",
    description: "Restaurant operations dashboard",
    widgets: [
      { id: "today-revenue", name: "Today's Revenue", type: "kpi", module: "sales", defaultSize: "small" },
      { id: "active-orders", name: "Active Orders", type: "kpi", module: "kitchen", defaultSize: "small" },
      { id: "table-occupancy", name: "Table Occupancy", type: "kpi", module: "tables", defaultSize: "small" },
      { id: "popular-items", name: "Popular Items", type: "table", module: "menu", defaultSize: "medium" },
      { id: "order-queue", name: "Order Queue", type: "list", module: "kitchen", defaultSize: "large" },
      { id: "reservations", name: "Today's Reservations", type: "table", module: "reservations", defaultSize: "medium" },
    ],
    kpis: [
      { key: "todayRevenue", label: "Today's Revenue", format: "currency" },
      { key: "ordersServed", label: "Orders Served", format: "number" },
      { key: "tableOccupancy", label: "Table Occupancy %", format: "percent" },
      { key: "averageTicket", label: "Avg Ticket Size", format: "currency" },
    ],
  },
  education: {
    slug: "education",
    name: "Education Dashboard",
    description: "School operations dashboard",
    widgets: [
      { id: "total-students", name: "Total Students", type: "kpi", module: "students", defaultSize: "small" },
      { id: "today-attendance", name: "Today's Attendance", type: "kpi", module: "attendance", defaultSize: "small" },
      { id: "fee-collection", name: "Fee Collection Rate", type: "kpi", module: "finance", defaultSize: "small" },
      { id: "recent-enrollments", name: "Recent Enrollments", type: "table", module: "admissions", defaultSize: "medium" },
      { id: "class-performance", name: "Class Performance", type: "table", module: "examinations", defaultSize: "large" },
      { id: "upcoming-exams", name: "Upcoming Exams", type: "list", module: "examinations", defaultSize: "medium" },
    ],
    kpis: [
      { key: "totalStudents", label: "Total Students", format: "number" },
      { key: "attendanceRate", label: "Attendance Rate", format: "percent" },
      { key: "feeCollectionRate", label: "Fee Collection", format: "percent" },
      { key: "teacherCount", label: "Teachers", format: "number" },
    ],
  },
  healthcare: {
    slug: "healthcare",
    name: "Healthcare Dashboard",
    description: "Healthcare facility dashboard",
    widgets: [
      { id: "today-patients", name: "Today's Patients", type: "kpi", module: "patients", defaultSize: "small" },
      { id: "pending-appointments", name: "Pending Appointments", type: "kpi", module: "appointments", defaultSize: "small" },
      { id: "pharmacy-alerts", name: "Pharmacy Alerts", type: "kpi", module: "pharmacy", defaultSize: "small" },
      { id: "doctor-schedule", name: "Doctor Schedule", type: "table", module: "doctors", defaultSize: "large" },
      { id: "revenue-by-department", name: "Revenue by Department", type: "chart", module: "billing", defaultSize: "medium" },
    ],
    kpis: [
      { key: "todayPatients", label: "Patients Today", format: "number" },
      { key: "appointmentRate", label: "Appointment Rate", format: "percent" },
      { key: "revenueToday", label: "Revenue Today", format: "currency" },
      { key: "bedOccupancy", label: "Bed Occupancy", format: "percent" },
    ],
  },
  manufacturing: {
    slug: "manufacturing",
    name: "Manufacturing Dashboard",
    description: "Production and manufacturing dashboard",
    widgets: [
      { id: "production-output", name: "Today's Output", type: "kpi", module: "production", defaultSize: "small" },
      { id: "active-work-orders", name: "Active Work Orders", type: "kpi", module: "work-orders", defaultSize: "small" },
      { id: "quality-rate", name: "Quality Pass Rate", type: "kpi", module: "quality-control", defaultSize: "small" },
      { id: "production-schedule", name: "Production Schedule", type: "table", module: "production", defaultSize: "large" },
      { id: "material-availability", name: "Material Availability", type: "table", module: "inventory", defaultSize: "medium" },
    ],
    kpis: [
      { key: "dailyOutput", label: "Daily Output", format: "number" },
      { key: "qualityRate", label: "Quality Rate", format: "percent" },
      { key: "machineUptime", label: "Machine Uptime", format: "percent" },
      { key: "orderBacklog", label: "Order Backlog", format: "number" },
    ],
  },
  agriculture: {
    slug: "agriculture",
    name: "Agriculture Dashboard",
    description: "Farm and agriculture dashboard",
    widgets: [
      { id: "livestock-count", name: "Livestock Count", type: "kpi", module: "livestock", defaultSize: "small" },
      { id: "crop-area", name: "Cultivated Area", type: "kpi", module: "crops", defaultSize: "small" },
      { id: "upcoming-harvest", name: "Upcoming Harvest", type: "kpi", module: "harvest", defaultSize: "small" },
      { id: "feed-inventory", name: "Feed Inventory", type: "table", module: "feeds", defaultSize: "medium" },
      { id: "sales-summary", name: "Sales Summary", type: "chart", module: "sales", defaultSize: "large" },
    ],
    kpis: [
      { key: "livestockCount", label: "Total Livestock", format: "number" },
      { key: "harvestYield", label: "Harvest Yield", format: "number" },
      { key: "revenueThisMonth", label: "Monthly Revenue", format: "currency" },
      { key: "feedStock", label: "Feed Stock", format: "number" },
    ],
  },
  services: {
    slug: "services",
    name: "Services Dashboard",
    description: "Service business dashboard",
    widgets: [
      { id: "today-appointments", name: "Today's Appointments", type: "kpi", module: "appointments", defaultSize: "small" },
      { id: "active-projects", name: "Active Projects", type: "kpi", module: "projects", defaultSize: "small" },
      { id: "revenue-today", name: "Revenue Today", type: "kpi", module: "payments", defaultSize: "small" },
      { id: "staff-schedule", name: "Staff Schedule", type: "table", module: "staff", defaultSize: "large" },
      { id: "recent-payments", name: "Recent Payments", type: "table", module: "payments", defaultSize: "medium" },
    ],
    kpis: [
      { key: "todayAppointments", label: "Appointments Today", format: "number" },
      { key: "activeProjects", label: "Active Projects", format: "number" },
      { key: "revenueToday", label: "Revenue Today", format: "currency" },
      { key: "completionRate", label: "Completion Rate", format: "percent" },
    ],
  },
  logistics: {
    slug: "logistics",
    name: "Logistics Dashboard",
    description: "Transport and logistics dashboard",
    widgets: [
      { id: "active-deliveries", name: "Active Deliveries", type: "kpi", module: "deliveries", defaultSize: "small" },
      { id: "fleet-status", name: "Fleet Status", type: "kpi", module: "fleet", defaultSize: "small" },
      { id: "on-time-rate", name: "On-Time Rate", type: "kpi", module: "tracking", defaultSize: "small" },
      { id: "delivery-queue", name: "Delivery Queue", type: "table", module: "deliveries", defaultSize: "large" },
      { id: "fuel-usage", name: "Fuel Usage", type: "chart", module: "fuel", defaultSize: "medium" },
    ],
    kpis: [
      { key: "activeDeliveries", label: "Active Deliveries", format: "number" },
      { key: "onTimeRate", label: "On-Time Rate", format: "percent" },
      { key: "fleetUtilization", label: "Fleet Utilization", format: "percent" },
      { key: "fuelEfficiency", label: "Fuel Efficiency", format: "number" },
    ],
  },
  "real-estate": {
    slug: "real-estate",
    name: "Real Estate Dashboard",
    description: "Property management dashboard",
    widgets: [
      { id: "occupancy-rate", name: "Occupancy Rate", type: "kpi", module: "properties", defaultSize: "small" },
      { id: "rent-collected", name: "Rent Collected", type: "kpi", module: "rent", defaultSize: "small" },
      { id: "pending-maintenance", name: "Pending Maintenance", type: "kpi", module: "maintenance", defaultSize: "small" },
      { id: "tenant-list", name: "Recent Tenants", type: "table", module: "tenants", defaultSize: "medium" },
      { id: "rent-trend", name: "Rent Collection Trend", type: "chart", module: "rent", defaultSize: "large" },
    ],
    kpis: [
      { key: "occupancyRate", label: "Occupancy Rate", format: "percent" },
      { key: "rentCollected", label: "Rent Collected", format: "currency" },
      { key: "outstandingRent", label: "Outstanding Rent", format: "currency" },
      { key: "propertyCount", label: "Properties Managed", format: "number" },
    ],
  },
  "non-profit": {
    slug: "non-profit",
    name: "Non-Profit Dashboard",
    description: "Organization impact dashboard",
    widgets: [
      { id: "donations-this-month", name: "Donations This Month", type: "kpi", module: "donations", defaultSize: "small" },
      { id: "active-projects", name: "Active Projects", type: "kpi", module: "projects", defaultSize: "small" },
      { id: "member-count", name: "Total Members", type: "kpi", module: "members", defaultSize: "small" },
      { id: "recent-donations", name: "Recent Donations", type: "table", module: "donations", defaultSize: "medium" },
      { id: "fund-allocation", name: "Fund Allocation", type: "chart", module: "accounting", defaultSize: "large" },
    ],
    kpis: [
      { key: "donationsThisMonth", label: "Donations This Month", format: "currency" },
      { key: "activeProjects", label: "Active Projects", format: "number" },
      { key: "totalMembers", label: "Total Members", format: "number" },
      { key: "fundUtilization", label: "Fund Utilization", format: "percent" },
    ],
  },
};

export class DashboardResolver {
  async getDashboard(businessId: string): Promise<DashboardDefinition> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    return DASHBOARDS[slug] ?? DASHBOARDS.commerce;
  }

  async getKpis(businessId: string): Promise<{ key: string; label: string; format: "number" | "currency" | "percent" }[]> {
    const dashboard = await this.getDashboard(businessId);
    return dashboard.kpis;
  }
}

export const dashboardResolver = new DashboardResolver();
