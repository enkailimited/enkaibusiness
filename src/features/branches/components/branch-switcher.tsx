"use client";

import { useState } from "react";
import { useActiveBranch } from "../context/active-branch-context";
import { GitBranch, ChevronDown, Check } from "lucide-react";

interface BranchSwitcherProps {
  branches: Array<{ id: string; name: string; isHeadOffice: boolean }>;
}

export function BranchSwitcher({ branches }: BranchSwitcherProps) {
  const { activeBranch, setActiveBranch } = useActiveBranch();
  const [open, setOpen] = useState(false);

  if (branches.length <= 1) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        <GitBranch className="h-3.5 w-3.5 text-gray-400" />
        <span className="max-w-[100px] truncate">
          {activeBranch?.name || "Select Branch"}
        </span>
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-xl border bg-white shadow-xl">
            <div className="border-b bg-gray-50 px-3 py-2">
              <p className="text-xs font-semibold text-gray-500">Switch Branch</p>
            </div>
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  setActiveBranch(branch);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    activeBranch?.id === branch.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <GitBranch className="h-3 w-3" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{branch.name}</span>
                  {branch.isHeadOffice && (
                    <span className="ml-1.5 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      HQ
                    </span>
                  )}
                </div>
                {activeBranch?.id === branch.id && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
