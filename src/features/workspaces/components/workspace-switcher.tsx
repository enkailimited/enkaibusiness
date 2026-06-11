"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceWithCount } from "../types";

interface WorkspaceSwitcherProps {
  workspaces: WorkspaceWithCount[];
  currentWorkspaceId?: string;
  onSwitch: (workspaceId: string) => void;
}

export function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onSwitch,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);

  const current = workspaces.find((w) => w.id === currentWorkspaceId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{current?.name ?? "Select workspace"}</span>
        </div>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-1">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                className={cn(
                  "relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  workspace.id === currentWorkspaceId && "bg-accent text-accent-foreground",
                )}
                onClick={() => {
                  onSwitch(workspace.id);
                  setOpen(false);
                }}
              >
                <Building2 className="mr-2 h-4 w-4" />
                <span className="flex-1 text-left">{workspace.name}</span>
                {workspace.id === currentWorkspaceId && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
