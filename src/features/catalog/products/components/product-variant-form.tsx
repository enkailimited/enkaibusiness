"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProductVariantFormProps {
  index: number;
  onRemove: (index: number) => void;
}

export function ProductVariantForm({ index, onRemove }: ProductVariantFormProps) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Variant {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
          Remove
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`variants.${index}.name`}>Name</Label>
        <Input
          id={`variants.${index}.name`}
          name={`variants.${index}.name`}
          placeholder="e.g. Large, Red, 500ml"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`variants.${index}.sku`}>SKU</Label>
          <Input
            id={`variants.${index}.sku`}
            name={`variants.${index}.sku`}
            placeholder="VAR-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`variants.${index}.barcode`}>Barcode</Label>
          <Input
            id={`variants.${index}.barcode`}
            name={`variants.${index}.barcode`}
            placeholder="Barcode"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={`variants.${index}.price`}>Price</Label>
          <Input
            id={`variants.${index}.price`}
            name={`variants.${index}.price`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`variants.${index}.costPrice`}>Cost Price</Label>
          <Input
            id={`variants.${index}.costPrice`}
            name={`variants.${index}.costPrice`}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );
}
