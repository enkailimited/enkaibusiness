"use server";

import { requireAuth } from "@/server/auth";
import { getSalesSummary } from "../services/sales-report";
import { getInventorySummary } from "../services/inventory-report";
import { getPurchaseSummary } from "../services/purchases-report";
import { getExpenseSummary } from "../services/expenses-report";
import { getCustomerSummary } from "../services/customers-report";
import { getSupplierSummary } from "../services/suppliers-report";
import { getSubscriptionSummary } from "../services/subscriptions-report";
import type { DateRange, SalesReport, InventoryReport, PurchasesReport, ExpensesReport, CustomersReport, SuppliersReport, SubscriptionsReport } from "../types";
import type { ActionResponse } from "@/types/relationships";

export async function getSalesReportAction(
  businessId: string,
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: SalesReport }> {
  await requireAuth();
  try {
    const data = await getSalesSummary(businessId, dateRange);
    return { success: true, message: "Sales report generated", data };
  } catch (error) {
    console.error("Sales report error:", error);
    return { success: false, message: "Failed to generate sales report" };
  }
}

export async function getInventoryReportAction(
  businessId: string,
): Promise<ActionResponse & { data?: InventoryReport }> {
  await requireAuth();
  try {
    const data = await getInventorySummary(businessId);
    return { success: true, message: "Inventory report generated", data };
  } catch (error) {
    console.error("Inventory report error:", error);
    return { success: false, message: "Failed to generate inventory report" };
  }
}

export async function getPurchasesReportAction(
  businessId: string,
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: PurchasesReport }> {
  await requireAuth();
  try {
    const data = await getPurchaseSummary(businessId, dateRange);
    return { success: true, message: "Purchases report generated", data };
  } catch (error) {
    console.error("Purchases report error:", error);
    return { success: false, message: "Failed to generate purchases report" };
  }
}

export async function getExpensesReportAction(
  businessId: string,
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: ExpensesReport }> {
  await requireAuth();
  try {
    const data = await getExpenseSummary(businessId, dateRange);
    return { success: true, message: "Expenses report generated", data };
  } catch (error) {
    console.error("Expenses report error:", error);
    return { success: false, message: "Failed to generate expenses report" };
  }
}

export async function getCustomersReportAction(
  businessId: string,
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: CustomersReport }> {
  await requireAuth();
  try {
    const data = await getCustomerSummary(businessId, dateRange);
    return { success: true, message: "Customers report generated", data };
  } catch (error) {
    console.error("Customers report error:", error);
    return { success: false, message: "Failed to generate customers report" };
  }
}

export async function getSuppliersReportAction(
  businessId: string,
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: SuppliersReport }> {
  await requireAuth();
  try {
    const data = await getSupplierSummary(businessId, dateRange);
    return { success: true, message: "Suppliers report generated", data };
  } catch (error) {
    console.error("Suppliers report error:", error);
    return { success: false, message: "Failed to generate suppliers report" };
  }
}

export async function getSubscriptionsReportAction(
  dateRange?: DateRange,
): Promise<ActionResponse & { data?: SubscriptionsReport }> {
  await requireAuth();
  try {
    const data = await getSubscriptionSummary(dateRange);
    return { success: true, message: "Subscriptions report generated", data };
  } catch (error) {
    console.error("Subscriptions report error:", error);
    return { success: false, message: "Failed to generate subscriptions report" };
  }
}
