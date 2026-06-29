"use client";

import { cn } from "@/lib/utils";

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === current ? "w-6 bg-primary" : i < current ? "w-2 bg-primary/50" : "w-2 bg-muted",
          )}
        />
      ))}
    </div>
  );
}
