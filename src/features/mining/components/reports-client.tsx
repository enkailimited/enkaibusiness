"use client";

export function MiningReportsClient({ production, fuel, equipment, inventory, expenses, sales }: any) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mining Reports</h1>
        <p className="text-muted-foreground">Monthly overview of all mining operations</p>
      </div>

      {/* Production Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Production</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div><p className="text-xs text-muted-foreground">Total Quantity</p><p className="text-xl font-bold">{production.totalQuantity.toLocaleString()} t</p></div>
          <div><p className="text-xs text-muted-foreground">Total Logs</p><p className="text-xl font-bold">{production.totalLogs}</p></div>
        </div>
        {production.bySite.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">By Site</p>
            {production.bySite.map((s: any) => (
              <div key={s.name} className="flex justify-between text-sm py-1">
                <span>{s.name}</span>
                <span className="font-medium">{s.quantity.toLocaleString()} t</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Fuel Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Fuel</h3>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div><p className="text-xs text-muted-foreground">Total Liters</p><p className="text-xl font-bold">{fuel.totalLiters.toLocaleString()} L</p></div>
          <div><p className="text-xs text-muted-foreground">Total Cost</p><p className="text-xl font-bold">{fuel.totalCost.toLocaleString()} TZS</p></div>
          <div><p className="text-xs text-muted-foreground">Avg Unit Cost</p><p className="text-xl font-bold">{fuel.avgUnitCost.toFixed(0)} TZS/L</p></div>
        </div>
        {fuel.byType.map((t: any) => (
          <div key={t.fuelType} className="flex justify-between text-sm py-1">
            <span>{t.fuelType}</span>
            <span className="font-medium">{t.liters.toLocaleString()} L · {t.cost.toLocaleString()} TZS</span>
          </div>
        ))}
      </section>

      {/* Equipment Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Equipment</h3>
        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{equipment.totalEquipment}</p></div>
          <div><p className="text-xs text-muted-foreground">Operational</p><p className="text-xl font-bold text-green-600">{equipment.operational}</p></div>
          <div><p className="text-xs text-muted-foreground">Maintenance</p><p className="text-xl font-bold text-amber-500">{equipment.maintenance}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Service Cost</p><p className="text-xl font-bold">{equipment.totalServiceCost.toLocaleString()} TZS</p></div>
        </div>
      </section>

      {/* Inventory Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Inventory</h3>
        {inventory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No inventory items tracked.</p>
        ) : (
          <div className="space-y-1">
            {inventory.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm py-1">
                <span>{item.name} <span className="text-xs text-muted-foreground">({item.itemType})</span></span>
                <span className={item.stockOnHand <= item.reorderPoint ? "font-medium text-amber-600" : ""}>
                  {item.stockOnHand} units
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Expenses Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Expenses</h3>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold">{expenses.totalExpenses}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Amount</p><p className="text-xl font-bold">{expenses.totalAmount.toLocaleString()} TZS</p></div>
        </div>
        {expenses.byCategory.map((c: any) => (
          <div key={c.name} className="flex justify-between text-sm py-1">
            <span>{c.name} ({c.count})</span>
            <span className="font-medium">{c.amount.toLocaleString()} TZS</span>
          </div>
        ))}
      </section>

      {/* Sales Report */}
      <section className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Sales</h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted-foreground">Total Sales</p><p className="text-xl font-bold">{sales.totalSales}</p></div>
          <div><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">{sales.totalRevenue.toLocaleString()} TZS</p></div>
        </div>
      </section>
    </div>
  );
}
