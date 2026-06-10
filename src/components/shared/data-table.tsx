"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "./empty-state";

interface Column<T> {
  key: string;
  header: string;
  cell: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  isLoading,
  emptyTitle = "No data found",
  emptyDescription,
  onRowClick,
  className,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-left text-sm font-medium text-muted-foreground",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              className={cn(
                "border-b transition-colors hover:bg-muted/50",
                onRowClick && "cursor-pointer",
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn("px-4 py-3 text-sm", col.className)}
                >
                  {col.cell(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
