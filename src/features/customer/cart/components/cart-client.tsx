"use client";

import { useOptimistic, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import type { CartItem } from "../cart-service";

interface CartClientProps {
  items: CartItem[];
  businessSlug: string;
}

export function CartClient({ items: initialItems, businessSlug }: CartClientProps) {
  const [items, setItems] = useOptimistic(initialItems);

  const updateQty = useCallback(async (catalogItemId: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.catalogItemId !== catalogItemId)
        : prev.map((i) => (i.catalogItemId === catalogItemId ? { ...i, quantity: qty } : i)),
    );
    const formData = new FormData();
    formData.set("catalogItemId", catalogItemId);
    formData.set("quantity", String(qty));
    formData.set("businessSlug", businessSlug);
    await fetch("/customer/api/cart/update", { method: "POST", body: formData });
  }, [businessSlug, setItems]);

  const remove = useCallback(async (catalogItemId: string) => {
    setItems((prev) => prev.filter((i) => i.catalogItemId !== catalogItemId));
    const formData = new FormData();
    formData.set("catalogItemId", catalogItemId);
    formData.set("businessSlug", businessSlug);
    await fetch("/customer/api/cart/remove", { method: "POST", body: formData });
  }, [businessSlug, setItems]);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.catalogItemId} className="flex items-center gap-4 border rounded-lg p-4">
          <div className="flex-1 min-w-0">
            <Link
              href={`/customer/catalog/${item.slug}?business=${businessSlug}`}
              className="font-medium hover:text-primary truncate block"
            >
              {item.name}
            </Link>
            <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} TZS each</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              defaultValue={item.quantity}
              className="w-16"
              onBlur={(e) => updateQty(item.catalogItemId, Number(e.target.value))}
            />
            <p className="font-medium w-24 text-right">{(item.price * item.quantity).toLocaleString()} TZS</p>
            <Button variant="ghost" size="icon" onClick={() => remove(item.catalogItemId)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
