"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InventorySummary } from "../types";

interface StockSummaryProps {
  summary: InventorySummary;
  isLoading?: boolean;
}

export function StockSummary({ summary, isLoading }: StockSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{summary.totalItems}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Stock Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "TZS" }).format(summary.totalStockValue)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Low Stock Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${summary.lowStockItems > 0 ? "text-amber-600" : "text-green-600"}`}>
            {summary.lowStockItems}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Out of Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${summary.outOfStockItems > 0 ? "text-red-600" : "text-green-600"}`}>
            {summary.outOfStockItems}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
