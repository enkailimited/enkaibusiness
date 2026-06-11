"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSaleAction } from "../actions";
import { SALE_STATUSES } from "../constants";
import type { Sale } from "../types";

interface SaleFormProps {
  businessId: string;
  workspaceId: string;
  customers: Array<{ id: string; firstName: string; lastName: string | null }>;
  catalogItems: Array<{ id: string; name: string; sku: string | null; price: number }>;
  sale?: Sale;
}

interface LineItem {
  key: string;
  catalogItemId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

let nextKey = 1;
function newLineItem(): LineItem {
  return { key: String(nextKey++), catalogItemId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 };
}

export function SaleForm({ businessId, workspaceId, customers, catalogItems }: SaleFormProps) {
  const [state, formAction, pending] = useActionState(
    createSaleAction.bind(null, businessId, workspaceId),
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
          if (catalog) updated.unitPrice = catalog.price;
        }
        updated.subtotal = updated.quantity * updated.unitPrice - updated.discount;
        if (updated.subtotal < 0) updated.subtotal = 0;
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

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountTotal = items.reduce((sum, i) => sum + i.discount, 0);
  const grandTotal = subtotal - discountTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Sale</CardTitle>
        <CardDescription>Record a new sale transaction</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="itemCount" value={items.length} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer</Label>
              <select
                id="customerId"
                name="customerId"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">Walk-in</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName}{c.lastName ? ` ${c.lastName}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="saleDate">Sale Date</Label>
              <Input id="saleDate" name="saleDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" name="reference" placeholder="Auto-generated if empty" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {SALE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                Add Item
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={item.key} className="grid grid-cols-12 gap-2 items-end rounded-lg border p-3">
                <input type="hidden" name={`items.${idx}.catalogItemId`} value={item.catalogItemId} />
                <input type="hidden" name={`items.${idx}.quantity`} value={item.quantity} />
                <input type="hidden" name={`items.${idx}.unitPrice`} value={item.unitPrice} />
                <input type="hidden" name={`items.${idx}.discount`} value={item.discount} />
                <input type="hidden" name={`items.${idx}.subtotal`} value={item.subtotal} />
                <div className="col-span-4 space-y-1">
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
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, "unitPrice", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Disc</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.discount}
                    onChange={(e) => updateItem(item.key, "discount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Sub</Label>
                  <span className="flex h-9 items-center text-sm font-medium">{item.subtotal.toFixed(2)}</span>
                </div>
                <div className="col-span-1 flex items-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.key)}>
                    ✕
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/50 p-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount Total</span>
              <span>{discountTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Grand Total</span>
              <span>{grandTotal.toFixed(2)}</span>
            </div>
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
            {pending ? "Creating..." : "Create Sale"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
