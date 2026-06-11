"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPurchaseAction } from "../actions";
import { PURCHASE_STATUSES } from "../constants";

interface PurchaseFormProps {
  businessId: string;
  workspaceId: string;
  suppliers: Array<{ id: string; name: string }>;
  catalogItems: Array<{ id: string; name: string; sku: string | null; price: number }>;
}

interface LineItem {
  key: string;
  catalogItemId: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

let nextKey = 1;
function newLineItem(): LineItem {
  return { key: String(nextKey++), catalogItemId: "", quantity: 1, unitCost: 0, subtotal: 0 };
}

export function PurchaseForm({ businessId, workspaceId, suppliers, catalogItems }: PurchaseFormProps) {
  const [state, formAction, pending] = useActionState(
    createPurchaseAction.bind(null, businessId, workspaceId),
    null,
  );
  const [items, setItems] = useState<LineItem[]>([newLineItem()]);

  const catalogItemMap = new Map(catalogItems.map((c) => [c.id, c]));

  function updateItem(key: string, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.key !== key) return item;
        const updated = { ...item, [field]: value };
        if (field === "catalogItemId") {
          const catalog = catalogItemMap.get(value as string);
          if (catalog) {
            updated.unitCost = catalog.price;
          }
        }
        updated.subtotal = updated.quantity * updated.unitCost;
        return updated;
      }),
    );
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function addItem() {
    setItems((prev) => [...prev, newLineItem()]);
  }

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Purchase</CardTitle>
        <CardDescription>Record a new purchase from a supplier</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="itemCount" value={items.length} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <select
                id="supplierId"
                name="supplierId"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" name="purchaseDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference</Label>
            <Input id="reference" name="reference" placeholder="PO-001" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {PURCHASE_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={item.key} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-3">
                <input type="hidden" name={`items.${idx}.catalogItemId`} value={item.catalogItemId} />
                <input type="hidden" name={`items.${idx}.quantity`} value={item.quantity} />
                <input type="hidden" name={`items.${idx}.unitCost`} value={item.unitCost} />
                <input type="hidden" name={`items.${idx}.subtotal`} value={item.subtotal} />
                <div className="col-span-5 space-y-1">
                  <Label className="text-xs">Item</Label>
                  <select
                    value={item.catalogItemId}
                    onChange={(e) => updateItem(item.key, "catalogItemId", e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Select item</option>
                    {catalogItems.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.sku ? ` (${c.sku})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, "quantity", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Unit Cost</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitCost}
                    onChange={(e) => updateItem(item.key, "unitCost", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Subtotal</Label>
                  <div className="h-9 flex items-center text-sm font-medium">
                    {item.subtotal.toFixed(2)}
                  </div>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive h-9 w-9 p-0"
                    onClick={() => removeItem(item.key)}
                    disabled={items.length === 1}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tax">Tax</Label>
            <Input id="tax" name="tax" type="number" step="0.01" min="0" defaultValue="0" />
          </div>

          <div className="text-right text-lg font-semibold">
            Total: {subtotal.toFixed(2)}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          {state?.errors && (
            <div className="text-sm text-destructive space-y-1">
              {Object.entries(state.errors).map(([field, msgs]) => (
                <p key={field}>{field}: {msgs.join(", ")}</p>
              ))}
            </div>
          )}

          {state?.message && !state.errors && (
            <p className={state.success ? "text-sm text-green-600" : "text-sm text-destructive"}>
              {state.message}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create Purchase"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
