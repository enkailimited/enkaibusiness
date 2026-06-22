"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createSaleAction } from "../actions";
import { SALE_STATUSES } from "../constants";
import type { Sale } from "../types";
import { ChevronLeft, ChevronRight, ShoppingCart, Package, CreditCard } from "lucide-react";

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

const STEPS = [
  { title: "Basic Info", description: "Customer, date and sale status" },
  { title: "Products", description: "Products in this sale" },
  { title: "Payment", description: "Notes and totals" },
];

let nextKey = 1;
function newLineItem(): LineItem {
  return { key: String(nextKey++), catalogItemId: "", quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 };
}

export function SaleForm({ businessId, workspaceId, customers, catalogItems }: SaleFormProps) {
  const [step, setStep] = useState(0);
  const createAction = useMemo(() => createSaleAction.bind(null, businessId, workspaceId), [businessId, workspaceId]);
  const [state, formAction, pending] = useActionState(createAction, null);
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
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
          <input type="hidden" name="itemCount" value={items.length} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Basic Info</h3>
                  <p className="text-sm text-gray-500">Customer, date and sale status</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId" className="text-sm font-medium">
                      Customer <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <select
                      id="customerId"
                      name="customerId"
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
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
                    <Label htmlFor="saleDate" className="text-sm font-medium">
                      Sale Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="saleDate"
                      name="saleDate"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reference" className="text-sm font-medium">
                      Reference <span className="text-gray-400">(Optional)</span>
                    </Label>
                    <Input
                      id="reference"
                      name="reference"
                      placeholder="Auto-generated"
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-sm font-medium">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="status"
                      name="status"
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      {SALE_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cn(step !== 1 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Products</h3>
                  <p className="text-sm text-gray-500">Products in this sale</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Products</span>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    Add Product
                  </Button>
                </div>
                {items.map((item, idx) => (
                  <div key={item.key} className="grid grid-cols-12 gap-2 items-end rounded-xl border border-gray-200 p-3">
                    <input type="hidden" name={`items.${idx}.catalogItemId`} value={item.catalogItemId} />
                    <input type="hidden" name={`items.${idx}.quantity`} value={item.quantity} />
                    <input type="hidden" name={`items.${idx}.unitPrice`} value={item.unitPrice} />
                    <input type="hidden" name={`items.${idx}.discount`} value={item.discount} />
                    <input type="hidden" name={`items.${idx}.subtotal`} value={item.subtotal} />
                    <div className="col-span-4 space-y-1">
                      <Label className="text-xs text-gray-500">Product</Label>
                      <select
                        value={item.catalogItemId}
                        onChange={(e) => updateItem(item.key, "catalogItemId", e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Select a product</option>
                        {catalogItems.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.sku ? ` (${c.sku})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">Qty</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.key, "quantity", parseFloat(e.target.value) || 0)}
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.key, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">Discount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.discount}
                        onChange={(e) => updateItem(item.key, "discount", parseFloat(e.target.value) || 0)}
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label className="text-xs text-gray-500">Total</Label>
                      <span className="flex h-11 items-center text-sm font-medium">{item.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="col-span-1 flex items-end">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.key)} className="h-11 w-9 p-0">
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={cn(step !== 2 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Payment</h3>
                  <p className="text-sm text-gray-500">Notes and sale totals</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Additional notes..."
                  />
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="font-medium text-red-600">-{discountTotal.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-lg font-bold">
                    <span>Grand Total</span>
                    <span className="text-emerald-600">{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {state?.errors && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              <p className="font-medium">There was an error</p>
              <ul className="mt-2 list-inside list-disc text-xs">
                {Object.entries(state.errors).map(([field, msgs]) => (
                  Array.isArray(msgs) ? msgs.map((msg, i) => <li key={`${field}-${i}`}>{field}: {msg}</li>) : null
                ))}
              </ul>
            </div>
          )}

          {state?.message && !state.errors && (
            <div className={`rounded-xl p-4 text-sm ${
              state.success
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              <p className="font-medium">{state.message}</p>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="h-11 rounded-xl border-gray-200 px-6"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Saving..." : "Save Sale"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
