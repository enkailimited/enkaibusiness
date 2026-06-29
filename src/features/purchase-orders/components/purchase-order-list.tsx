import { requireAuth } from "@/server/auth";
import { getBusinessPurchaseOrders } from "../services/purchase-order-service";
import { PurchaseOrderTableClient } from "./purchase-order-table-client";

interface PurchaseOrderListProps {
  businessId: string;
}

export async function PurchaseOrderList({ businessId }: PurchaseOrderListProps) {
  await requireAuth();
  const orders = await getBusinessPurchaseOrders(businessId);

  return (
    <PurchaseOrderTableClient orders={orders} />
  );
}
