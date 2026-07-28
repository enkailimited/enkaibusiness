"use client";

import { useActionState } from "react";
import { createFuelTransactionAction } from "../actions";

export function MiningFuelClient({ businessId, transactions, stats }: any) {
  const [createState, createAction, createPending] = useActionState(createFuelTransactionAction.bind(null, businessId), null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fuel Management</h1>
        <p className="text-muted-foreground">Track fuel consumption and costs</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Used (30d)</p><p className="text-2xl font-bold">{stats.totalLiters.toLocaleString()} L</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Cost (30d)</p><p className="text-2xl font-bold">{stats.totalCost.toLocaleString()} TZS</p></div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Avg Unit Cost</p><p className="text-2xl font-bold">{stats.totalLiters > 0 ? (stats.totalCost / stats.totalLiters).toFixed(0) : 0} TZS/L</p></div>
      </div>

      <form action={createAction} className="rounded-lg border p-4 space-y-3">
        <h3 className="font-semibold">Record Fuel Transaction</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <input name="fuelType" placeholder="Fuel type (DIESEL, PETROL, LUBRICANT, GREASE)" className="border rounded px-3 py-2 text-sm" />
          <input name="quantity" type="number" step="0.01" placeholder="Quantity (L) *" required className="border rounded px-3 py-2 text-sm" />
          <input name="unitCost" type="number" step="0.01" placeholder="Unit cost" className="border rounded px-3 py-2 text-sm" />
          <input name="totalCost" type="number" step="0.01" placeholder="Total cost" className="border rounded px-3 py-2 text-sm" />
          <input name="supplier" placeholder="Supplier" className="border rounded px-3 py-2 text-sm" />
          <input name="receiptRef" placeholder="Receipt ref" className="border rounded px-3 py-2 text-sm" />
          <input name="transactionDate" type="date" className="border rounded px-3 py-2 text-sm" />
        </div>
        <textarea name="notes" placeholder="Notes" className="border rounded px-3 py-2 text-sm w-full" rows={2} />
        <button type="submit" disabled={createPending} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm">
          {createPending ? "Saving..." : "Record Fuel"}
        </button>
      </form>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">Transactions ({transactions.length})</h3></div>
        {transactions.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No transactions yet.</p>
        ) : (
          transactions.map((txn: any) => (
            <div key={txn.id} className="p-4 border-b last:border-b-0 flex items-center justify-between">
              <div>
                <p className="font-medium">{txn.fuelType} · {Number(txn.quantity).toLocaleString()} L</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(txn.transactionDate).toLocaleDateString()}
                  {txn.totalCost ? ` · ${Number(txn.totalCost).toLocaleString()} TZS` : ""}
                  {txn.supplier ? ` · ${txn.supplier}` : ""}
                  {txn.equipment?.name ? ` · ${txn.equipment.name}` : ""}
                  {txn.site?.name ? ` · ${txn.site.name}` : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
