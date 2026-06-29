"use server";

import { requireAuth } from "@/server/auth";
import { getCustomerStatement, getSupplierStatement } from "../services/statement-service";

export async function getCustomerStatementAction(
  customerId: string,
  businessId: string,
  from: string,
  to: string,
) {
  await requireAuth();
  return getCustomerStatement(customerId, businessId, new Date(from), new Date(to));
}

export async function getSupplierStatementAction(
  supplierId: string,
  businessId: string,
  from: string,
  to: string,
) {
  await requireAuth();
  return getSupplierStatement(supplierId, businessId, new Date(from), new Date(to));
}
