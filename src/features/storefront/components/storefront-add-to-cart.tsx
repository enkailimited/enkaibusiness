"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Loader2 } from "lucide-react";
import { addToCartAction } from "@/features/customer/catalog/actions";

export function StorefrontAddToCart({
  item, businessSlug, primaryColor,
}: {
  item: { id: string; name: string; slug: string; price: number };
  businessSlug: string;
  primaryColor: string;
}) {
  const [state, action, pending] = useActionState(addToCartAction, null);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="catalogItemId" value={item.id} />
      <input type="hidden" name="name" value={item.name} />
      <input type="hidden" name="slug" value={item.slug} />
      <input type="hidden" name="price" value={item.price} />
      <input type="hidden" name="businessSlug" value={businessSlug} />

      <div className="flex items-center gap-2">
        <label className="text-sm">Quantity:</label>
        <Input type="number" name="quantity" min={1} defaultValue={1} className="w-20" />
      </div>

      <Button type="submit" disabled={pending} style={{ backgroundColor: primaryColor }} className="text-white hover:opacity-90">
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
        Add to Cart
      </Button>

      {state?.message && (
        <p className={`text-sm ${state.success ? "text-green-600" : "text-destructive"}`}>{state.message}</p>
      )}
    </form>
  );
}
