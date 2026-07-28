"use client";

export function MiningInventoryClient({ businessId, items, catalogItems }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mining Inventory</h1>
        <p className="text-muted-foreground">Track ore, fuel, spare parts, and consumables</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{catalogItems.length}</p></div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-muted-foreground">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-500">{items.filter((i: any) => i.stockOnHand <= i.reorderPoint).length}</p>
        </div>
        <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">Ore & Mineral Items</p><p className="text-2xl font-bold">{items.filter((i: any) => i.itemType === "MINERAL" || i.itemType === "ORE").length}</p></div>
      </div>

      <div className="rounded-lg border">
        <div className="p-4 border-b bg-muted/30"><h3 className="font-semibold">Catalog Items ({catalogItems.length})</h3></div>
        <div className="divide-y">
          {catalogItems.map((item: any) => (
            <div key={item.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.itemType} · {Number(item.price).toLocaleString()} TZS</p>
              </div>
            </div>
          ))}
          {catalogItems.length === 0 && <p className="p-4 text-sm text-muted-foreground">No catalog items yet.</p>}
        </div>
      </div>
    </div>
  );
}
