"use client";

import { Contact, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenderSelectStepProps {
  value: string;
  onChange: (value: string) => void;
}

const genderOptions = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

export function GenderSelectStep({ value, onChange }: GenderSelectStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        <Contact className="h-4 w-4" />
        Select Gender
      </div>
      <div className="grid grid-cols-2 gap-3">
        {genderOptions.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted bg-card hover:border-muted-foreground/30",
              )}
            >
              {isSelected && (
                <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                  <Check className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                  isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Contact className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold",
                  isSelected ? "text-primary" : "text-foreground",
                )}
              >
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
