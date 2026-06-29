import "server-only";

import { getIndustry } from "./registry";
import { prisma } from "@/server/db";

export interface ReportDefinition {
  slug: string;
  name: string;
  description: string;
  category: string;
}

const INDUSTRY_REPORTS: Record<string, ReportDefinition[]> = {
  commerce: [
    { slug: "sales-summary", name: "Sales Summary", description: "Daily, weekly, monthly sales totals", category: "sales" },
    { slug: "top-products", name: "Top Products", description: "Best-selling products", category: "sales" },
    { slug: "inventory-value", name: "Inventory Value", description: "Current inventory valuation", category: "inventory" },
    { slug: "stock-alerts", name: "Stock Alerts", description: "Low stock and out-of-stock items", category: "inventory" },
    { slug: "customer-analysis", name: "Customer Analysis", description: "Customer purchase patterns", category: "sales" },
    { slug: "profit-loss", name: "Profit & Loss", description: "Revenue, costs, and profit", category: "financial" },
    { slug: "cash-flow", name: "Cash Flow", description: "Cash inflow and outflow", category: "financial" },
    { slug: "supplier-performance", name: "Supplier Performance", description: "Supplier reliability and pricing", category: "operations" },
  ],
  restaurant: [
    { slug: "sales-summary", name: "Sales Summary", description: "Daily and shift sales", category: "sales" },
    { slug: "popular-items", name: "Popular Items", description: "Best-selling menu items", category: "sales" },
    { slug: "table-turnover", name: "Table Turnover", description: "Table utilization rates", category: "operations" },
    { slug: "inventory-usage", name: "Inventory Usage", description: "Ingredient consumption", category: "inventory" },
    { slug: "food-cost", name: "Food Cost", description: "Cost of goods sold for menu items", category: "financial" },
    { slug: "labor-cost", name: "Labor Cost", description: "Staff cost analysis", category: "financial" },
  ],
  education: [
    { slug: "enrollment", name: "Enrollment Report", description: "Student enrollment numbers", category: "operations" },
    { slug: "attendance", name: "Attendance Report", description: "Student attendance rates", category: "operations" },
    { slug: "exam-results", name: "Exam Results", description: "Student performance analysis", category: "operations" },
    { slug: "fee-collection", name: "Fee Collection", description: "School fee payment status", category: "financial" },
    { slug: "teacher-performance", name: "Teacher Performance", description: "Teacher evaluation metrics", category: "hr" },
    { slug: "library-usage", name: "Library Usage", description: "Book borrowing statistics", category: "operations" },
  ],
  healthcare: [
    { slug: "patient-visits", name: "Patient Visits", description: "Daily patient visit counts", category: "operations" },
    { slug: "appointment-summary", name: "Appointment Summary", description: "Appointment completion rates", category: "operations" },
    { slug: "revenue-by-service", name: "Revenue by Service", description: "Revenue from different services", category: "financial" },
    { slug: "pharmacy-stock", name: "Pharmacy Stock", description: "Medicine inventory levels", category: "inventory" },
    { slug: "lab-tests", name: "Lab Tests", description: "Lab test volume and results", category: "operations" },
  ],
  manufacturing: [
    { slug: "production-output", name: "Production Output", description: "Units produced over time", category: "operations" },
    { slug: "bom-cost", name: "BOM Cost", description: "Bill of materials cost analysis", category: "financial" },
    { slug: "quality-rate", name: "Quality Rate", description: "Defect and rejection rates", category: "operations" },
    { slug: "machine-utilization", name: "Machine Utilization", description: "Equipment usage rates", category: "operations" },
    { slug: "inventory-turnover", name: "Inventory Turnover", description: "Raw material turnover rates", category: "inventory" },
  ],
  agriculture: [
    { slug: "harvest-yield", name: "Harvest Yield", description: "Crop yield per season", category: "operations" },
    { slug: "livestock-health", name: "Livestock Health", description: "Animal health and mortality", category: "operations" },
    { slug: "feed-consumption", name: "Feed Consumption", description: "Feed usage and costs", category: "inventory" },
    { slug: "produce-sales", name: "Produce Sales", description: "Farm produce sales", category: "sales" },
  ],
  services: [
    { slug: "appointments", name: "Appointments", description: "Appointment volume and completion", category: "operations" },
    { slug: "revenue-by-service", name: "Revenue by Service", description: "Revenue from services", category: "financial" },
    { slug: "staff-productivity", name: "Staff Productivity", description: "Staff performance metrics", category: "hr" },
    { slug: "project-status", name: "Project Status", description: "Active project completion", category: "operations" },
  ],
  logistics: [
    { slug: "delivery-performance", name: "Delivery Performance", description: "On-time delivery rates", category: "operations" },
    { slug: "fuel-consumption", name: "Fuel Consumption", description: "Fuel usage and efficiency", category: "operations" },
    { slug: "fleet-utilization", name: "Fleet Utilization", description: "Vehicle usage rates", category: "operations" },
    { slug: "driver-performance", name: "Driver Performance", description: "Driver efficiency metrics", category: "hr" },
  ],
  "real-estate": [
    { slug: "occupancy-rate", name: "Occupancy Rate", description: "Property occupancy rates", category: "operations" },
    { slug: "rent-collection", name: "Rent Collection", description: "Rent payment status", category: "financial" },
    { slug: "maintenance-cost", name: "Maintenance Cost", description: "Property maintenance expenses", category: "financial" },
    { slug: "tenant-turnover", name: "Tenant Turnover", description: "Tenant movement analysis", category: "operations" },
  ],
  "non-profit": [
    { slug: "donation-summary", name: "Donation Summary", description: "Donation volume and trends", category: "financial" },
    { slug: "fund-utilization", name: "Fund Utilization", description: "How funds are being used", category: "financial" },
    { slug: "member-growth", name: "Member Growth", description: "Membership trends", category: "operations" },
    { slug: "project-impact", name: "Project Impact", description: "Project outcomes and metrics", category: "operations" },
  ],
};

export class ReportResolver {
  async getAvailableReports(businessId: string): Promise<ReportDefinition[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    return INDUSTRY_REPORTS[slug] ?? INDUSTRY_REPORTS.commerce;
  }
}

export const reportResolver = new ReportResolver();
