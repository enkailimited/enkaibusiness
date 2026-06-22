"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProductList } from "@/features/catalog/products/components/product-list";
import { ProductForm } from "@/features/catalog/products/components/product-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { listProductsAction } from "@/features/catalog/products/actions";
import type { ProductWithVariants } from "@/features/catalog/products/types";

export default function ProductsPage() {
  const params = useParams<{ businessId: string }>();
  const businessId = params.businessId;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listProductsAction(businessId);
      setProducts(result.data ?? []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6 pb-10">
      <PageHeader title="Products" description="Manage your product catalog">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription className="sr-only">Add a new product to the catalog</DialogDescription>
            </DialogHeader>
            <ProductForm
              businessId={businessId}
              onSuccess={() => {
                setDialogOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ProductList products={products} />
      )}
    </div>
  );
}
