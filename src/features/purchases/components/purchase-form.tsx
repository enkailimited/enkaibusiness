"use client";

import { cn } from "@/lib/utils";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FormStepper } from "@/components/ui/form-stepper";
import { createPurchaseAction } from "../actions";
import { PURCHASE_STATUSES } from "../constants";
import { ChevronLeft, ChevronRight, ShoppingBag, Package, CreditCard } from "lucide-react";

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

const STEPS = [
  { title: "Taarifa za Msingi", description: "Msambazaji, tarehe na rejea" },
  { title: "Bidhaa", description: "Bidhaa kwenye ununuzi" },
  { title: "Malipo", description: "Maelezo na jumla" },
];

let nextKey = 1;
function newLineItem(): LineItem {
  return { key: String(nextKey++), catalogItemId: "", quantity: 1, unitCost: 0, subtotal: 0 };
}

export function PurchaseForm({ businessId, workspaceId, suppliers, catalogItems }: PurchaseFormProps) {
  const [step, setStep] = useState(0);
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
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <FormStepper steps={STEPS} currentStep={step} />
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="itemCount" value={items.length} />

          <div className={cn(step !== 0 && "hidden")}>
            <div className="space-y-5">
              <div className="flex items-center gap-3 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Taarifa za Msingi</h3>
                  <p className="text-sm text-gray-500">Msambazaji, tarehe na rejea</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplierId" className="text-sm font-medium">
                      Msambazaji <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="supplierId"
                      name="supplierId"
                      required
                      className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Chagua msambazaji</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate" className="text-sm font-medium">
                      Tarehe ya Ununuzi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      defaultValue={new Date().toISOString().split("T")[0]}
                      className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reference" className="text-sm font-medium">
                    Rejea <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="reference"
                    name="reference"
                    placeholder="Mf. PO-001"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Hali <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <select
                    id="status"
                    name="status"
                    className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    {PURCHASE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
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
                  <h3 className="font-semibold text-gray-900">Bidhaa</h3>
                  <p className="text-sm text-gray-500">Bidhaa kwenye ununuzi</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Bidhaa</span>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    Ongeza Bidhaa
                  </Button>
                </div>
                {items.map((item, idx) => (
                  <div key={item.key} className="grid grid-cols-12 gap-2 items-end rounded-xl border border-gray-200 p-3">
                    <input type="hidden" name={`items.${idx}.catalogItemId`} value={item.catalogItemId} />
                    <input type="hidden" name={`items.${idx}.quantity`} value={item.quantity} />
                    <input type="hidden" name={`items.${idx}.unitCost`} value={item.unitCost} />
                    <input type="hidden" name={`items.${idx}.subtotal`} value={item.subtotal} />
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs text-gray-500">Bidhaa</Label>
                      <select
                        value={item.catalogItemId}
                        onChange={(e) => updateItem(item.key, "catalogItemId", e.target.value)}
                        className="flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Chagua bidhaa</option>
                        {catalogItems.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}{c.sku ? ` (${c.sku})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">Idadi</Label>
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
                      <Label className="text-xs text-gray-500">Gharama</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitCost}
                        onChange={(e) => updateItem(item.key, "unitCost", parseFloat(e.target.value) || 0)}
                        className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-gray-500">Jumla</Label>
                      <div className="h-11 flex items-center text-sm font-medium">
                        {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-11 w-9 p-0"
                        onClick={() => removeItem(item.key)}
                        disabled={items.length === 1}
                      >
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
                  <h3 className="font-semibold text-gray-900">Malipo</h3>
                  <p className="text-sm text-gray-500">Maelezo na jumla ya ununuzi</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tax" className="text-sm font-medium">
                    Kodi <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <Input
                    id="tax"
                    name="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue="0"
                    className="h-11 rounded-xl border-gray-200 bg-white transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Maelezo <span className="text-gray-400">(Hiari)</span>
                  </Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Maelezo ya ziada..."
                  />
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Jumla</span>
                    <span className="text-emerald-600">{subtotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {state?.errors && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              <p className="font-medium">Kuna hitilafu</p>
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
              Nyuma
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="h-11 rounded-xl bg-blue-600 px-8 text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700"
              >
                Endelea
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={pending}
                className="h-11 rounded-xl bg-emerald-600 px-8 text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700"
              >
                {pending ? "Inahifadhi..." : "Hifadhi Ununuzi"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
