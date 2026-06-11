"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { createPriceListAction, updatePriceListAction } from "../actions";
import { PRICE_LIST_TYPES, PRICE_LIST_TYPE_LABELS, PRICE_LIST_PRIORITIES } from "../constants";
import type { PriceListWithItems } from "../types";

interface PriceListFormProps {
  businessId: string;
  priceList?: PriceListWithItems;
  onSuccess?: () => void;
}

export function PriceListForm({ businessId, priceList, onSuccess }: PriceListFormProps) {
  const [itemCount, setItemCount] = useState(priceList?.items?.length ?? 0);
  const action = priceList ? updatePriceListAction.bind(null, priceList.id) : createPriceListAction;
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success && onSuccess) {
    onSuccess();
  }

  const addItem = () => setItemCount((c) => c + 1);
  const removeItem = (index: number) => setItemCount((c) => Math.max(0, c - 1));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{priceList ? "Edit Price List" : "Create Price List"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="businessId" value={businessId} />

          <div className="space-y-2">
            <Label htmlFor="name">Price List Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={priceList?.name ?? ""}
              placeholder="e.g. Summer Sale 2024"
              required
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              name="type"
              defaultValue={priceList?.type ?? "retail"}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              required
            >
              {PRICE_LIST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PRICE_LIST_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {state?.errors?.type && (
              <p className="text-sm text-destructive">{state.errors.type[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              name="priority"
              defaultValue={priceList?.priority ?? 0}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {PRICE_LIST_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label} ({p.value})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={
                  priceList?.startDate
                    ? new Date(priceList.startDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={
                  priceList?.endDate
                    ? new Date(priceList.endDate).toISOString().split("T")[0]
                    : ""
                }
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              name="isActive"
              defaultChecked={priceList?.isActive ?? true}
              value="true"
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          {state?.message && !state?.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {!priceList && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Price List Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    Add Item
                  </Button>
                </div>
                {Array.from({ length: itemCount }).map((_, i) => (
                  <div key={i} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Item {i + 1}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(i)}>
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`items.${i}.catalogItemId`}>Catalog Item ID</Label>
                      <Input
                        id={`items.${i}.catalogItemId`}
                        name={`items.${i}.catalogItemId`}
                        placeholder="Catalog item UUID"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`items.${i}.unitPrice`}>Unit Price</Label>
                        <Input
                          id={`items.${i}.unitPrice`}
                          name={`items.${i}.unitPrice`}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`items.${i}.minQuantity`}>Min Quantity</Label>
                        <Input
                          id={`items.${i}.minQuantity`}
                          name={`items.${i}.minQuantity`}
                          type="number"
                          step="1"
                          min="1"
                          defaultValue="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Saving..." : priceList ? "Update Price List" : "Create Price List"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
