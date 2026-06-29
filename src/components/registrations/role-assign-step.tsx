"use client";

import { Loader2, Check, Hash, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
}

interface RoleAssignStepProps {
  roles: RoleOption[];
  loading: boolean;
  value: string;
  onChange: (value: string) => void;
  allowNoRole?: boolean;
  icon?: React.ReactNode;
  title?: string;
}

export function RoleAssignStep({
  roles,
  loading,
  value,
  onChange,
  allowNoRole = true,
  icon,
  title = "Assign Role",
}: RoleAssignStepProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-4">
        {icon || <ShieldCheck className="h-4 w-4" />}
        {title}
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {allowNoRole && (
            <button
              type="button"
              onClick={() => onChange("")}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200",
                !value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted bg-card hover:border-muted-foreground/30",
              )}
            >
              {!value && (
                <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                  <Check className="h-2 w-2 text-primary-foreground" />
                </div>
              )}
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  !value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                <Hash className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold text-center leading-tight",
                  !value ? "text-primary" : "text-foreground",
                )}
              >
                No role
              </span>
            </button>
          )}
          {roles.map((role) => {
            const isSelected = value === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => onChange(role.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted bg-card hover:border-muted-foreground/30",
                )}
              >
                {isSelected && (
                  <div className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-2 w-2 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold text-center leading-tight",
                    isSelected ? "text-primary" : "text-foreground",
                  )}
                >
                  {role.name}
                </span>
                <span className="text-[9px] text-muted-foreground leading-tight">{role.slug}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
