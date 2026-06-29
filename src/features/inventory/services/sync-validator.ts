import "server-only";

import { prisma } from "@/server/db";

export interface SyncValidationResult {
  valid: boolean;
  checks: Array<{ name: string; passed: boolean; details?: string }>;
}

export async function validatePurchaseSync(
  purchaseId: string,
): Promise<SyncValidationResult> {
  const checks: SyncValidationResult["checks"] = [];

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: { items: true },
  });

  if (!purchase) {
    return { valid: false, checks: [{ name: "purchase_exists", passed: false, details: "Purchase not found" }] };
  }

  checks.push({ name: "purchase_exists", passed: true });

  const hasItems = purchase.items.length > 0;
  checks.push({ name: "purchase_items_exist", passed: hasItems, details: hasItems ? undefined : "No purchase items found" });

  const itemsTotal = purchase.items.reduce((s, i) => s + Number(i.subtotal), 0);
  const totalMatch = Math.abs(itemsTotal - Number(purchase.total)) < 0.01;
  checks.push({ name: "purchase_items_total_matches", passed: totalMatch, details: totalMatch ? undefined : `Items total ${itemsTotal} !== purchase total ${purchase.total}` });

  if (!purchase.items.length) {
    return { valid: checks.every((c) => c.passed), checks };
  }

  const movements = await prisma.stockMovement.findMany({
    where: { reference: purchaseId, referenceType: "purchase" },
  });

  const hasMovement = movements.length > 0;
  checks.push({ name: "stock_movement_exists", passed: hasMovement, details: hasMovement ? undefined : "No StockMovement found for purchase" });

  if (movements.length > 0) {
    const movementSum = movements.reduce((s, m) => s + Number(m.quantityChange), 0);
    const purchaseQtySum = purchase.items.reduce((s, i) => s + Number(i.quantity), 0);
    const qtyMatch = Math.abs(movementSum - purchaseQtySum) < 0.01;
    checks.push({ name: "stock_movement_quantity_matches", passed: qtyMatch, details: qtyMatch ? undefined : `Movement sum ${movementSum} !== purchase quantity sum ${purchaseQtySum}` });

    const allBalancesExist = await Promise.all(
      movements.map(async (m) => {
        const balance = await prisma.inventoryBalance.findFirst({
          where: { locationId: m.locationId, catalogItemId: m.catalogItemId, variantId: m.variantId ?? null },
        });
        return !!balance;
      }),
    );
    const allHaveBalances = allBalancesExist.every(Boolean);
    checks.push({ name: "inventory_balance_updated", passed: allHaveBalances, details: allHaveBalances ? undefined : "Some InventoryBalance records missing" });
  }

  if (purchase.branchId) {
    const location = await prisma.inventoryLocation.findFirst({
      where: { businessId: purchase.businessId, branchId: purchase.branchId, isActive: true },
    });
    checks.push({ name: "branch_has_inventory_location", passed: !!location, details: location ? undefined : `No active inventory location for branch ${purchase.branchId}` });
  }

  if (purchase.items.length > 0 && movements.length > 0) {
    for (const movement of movements) {
      const movementLocation = await prisma.inventoryLocation.findUnique({
        where: { id: movement.locationId },
      });
      if (movementLocation && purchase.branchId) {
        const branchMatch = movementLocation.branchId === purchase.branchId;
        if (!branchMatch) {
          checks.push({ name: `branch_match_for_movement_${movement.id}`, passed: false, details: `Movement location ${movementLocation.id} branch ${movementLocation.branchId} !== purchase branch ${purchase.branchId}` });
        }
      }
    }
  }

  return { valid: checks.every((c) => c.passed), checks };
}

export async function validateGoodsReceivedSync(
  goodsReceivedId: string,
): Promise<SyncValidationResult> {
  const checks: SyncValidationResult["checks"] = [];

  const gr = await prisma.goodsReceived.findUnique({
    where: { id: goodsReceivedId },
    include: { items: true },
  });

  if (!gr) {
    return { valid: false, checks: [{ name: "goods_received_exists", passed: false, details: "GoodsReceived not found" }] };
  }

  checks.push({ name: "goods_received_exists", passed: true });

  const hasItems = gr.items.length > 0;
  checks.push({ name: "goods_received_items_exist", passed: hasItems, details: hasItems ? undefined : "No items found" });

  if (!gr.items.length) {
    return { valid: checks.every((c) => c.passed), checks };
  }

  const movements = await prisma.stockMovement.findMany({
    where: { reference: goodsReceivedId, referenceType: "purchase" },
  });

  const hasMovement = movements.length > 0;
  checks.push({ name: "stock_movement_exists", passed: hasMovement, details: hasMovement ? undefined : "No StockMovement found for goods received" });

  if (movements.length > 0) {
    const movementSum = movements.reduce((s, m) => s + Number(m.quantityChange), 0);
    const receivedSum = gr.items.reduce((s, i) => s + Number(i.receivedQuantity), 0);
    const qtyMatch = Math.abs(movementSum - receivedSum) < 0.01;
    checks.push({ name: "stock_movement_quantity_matches", passed: qtyMatch, details: qtyMatch ? undefined : `Movement sum ${movementSum} !== received quantity sum ${receivedSum}` });
  }

  return { valid: checks.every((c) => c.passed), checks };
}
