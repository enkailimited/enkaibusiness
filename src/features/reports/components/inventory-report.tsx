"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { ReportCard } from "./report-card";
import type { InventoryReport } from "../types";

interface InventoryReportViewProps {
  data: InventoryReport;
}

export function InventoryReportView({ data }: InventoryReportViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <ReportCard label="Total Items" value={String(data.summary.totalItems)} />
        <ReportCard label="Stock Value" value={String(data.summary.totalStockValue)} />
        <ReportCard label="Low Stock Items" value={String(data.summary.lowStockCount)} />
        <ReportCard label="Expiring Soon" value={String(data.summary.expiringCount)} />
        <ReportCard label="Locations" value={String(data.summary.totalLocations)} />
        <ReportCard label="Turnover Rate" value={data.turnover.toFixed(2)} />
      </div>

      {data.lowStock.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Item", cell: (i) => i.itemName },
                { key: "sku", header: "SKU", cell: (i) => i.sku ?? "—" },
                {
                  key: "qty",
                  header: "On Hand",
                  cell: (i) => String(i.quantityOnHand),
                },
                {
                  key: "reorder",
                  header: "Reorder At",
                  cell: (i) => String(i.reorderPoint),
                },
                {
                  key: "location",
                  header: "Location",
                  cell: (i) => i.locationName,
                },
              ]}
              data={data.lowStock.map((i) => ({ ...i, id: i.id }))}
              emptyTitle="No low stock items"
            />
          </CardContent>
        </Card>
      )}

      {data.expiringItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expiring Items</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={[
                { key: "name", header: "Item", cell: (i) => i.itemName },
                { key: "sku", header: "SKU", cell: (i) => i.sku ?? "—" },
                { key: "batch", header: "Batch", cell: (i) => i.batchNo ?? "—" },
                {
                  key: "qty",
                  header: "Quantity",
                  cell: (i) => String(i.quantity),
                },
                {
                  key: "expiry",
                  header: "Expires",
                  cell: (i) =>
                    new Date(i.expiryDate).toLocaleDateString("en-US"),
                },
                {
                  key: "location",
                  header: "Location",
                  cell: (i) => i.locationName,
                },
              ]}
              data={data.expiringItems.map((i) => ({ ...i, id: i.id }))}
              emptyTitle="No expiring items"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
