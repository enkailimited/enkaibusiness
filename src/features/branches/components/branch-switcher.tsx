"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Drawer } from "vaul";
import { useActiveBranch } from "../context/active-branch-context";
import { GitBranch, ChevronDown, Check, Search, Building2 } from "lucide-react";

interface BranchInfo {
  id: string;
  name: string;
  isHeadOffice: boolean;
}

interface BranchSwitcherProps {
  branches: BranchInfo[];
}

export function BranchSwitcher({ branches }: BranchSwitcherProps) {
  const { activeBranch, setActiveBranch } = useActiveBranch();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = branches.filter((b) =>
    b.name.toLowerCase().includes(query.toLowerCase()),
  );

  const sorted = [...filtered].sort((a, b) => {
    if (a.isHeadOffice && !b.isHeadOffice) return -1;
    if (!a.isHeadOffice && b.isHeadOffice) return 1;
    return a.name.localeCompare(b.name);
  });

  const safeHighlightedIndex = Math.min(highlightedIndex, Math.max(0, sorted.length - 1));

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const selectBranch = useCallback(
    (branch: BranchInfo) => {
      setActiveBranch(branch);
      setOpen(false);
      setQuery("");
    },
    [setActiveBranch],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, sorted.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (sorted[safeHighlightedIndex]) {
          selectBranch(sorted[safeHighlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  }

  useEffect(() => {
    if (listRef.current && sorted.length > 0) {
      const item = listRef.current.children[safeHighlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [safeHighlightedIndex, sorted.length]);

  if (branches.length <= 1) return null;

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} repositionInputs>
      <Drawer.Trigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted transition-colors"
        >
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
          <span className="max-w-[100px] truncate">
            {activeBranch?.name || "Select Branch"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground/70 shrink-0" />
        </button>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] flex-col rounded-t-2xl border bg-background outline-none md:left-auto md:right-4 md:top-1/2 md:bottom-auto md:w-80 md:-translate-y-1/2 md:rounded-2xl md:shadow-xl"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Switch Branch</span>
            </div>
            <Drawer.Close className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors">
              <ChevronDown className="h-4 w-4 rotate-90 md:rotate-0" />
            </Drawer.Close>
          </div>

          <div className="border-b px-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search branches..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div
            ref={listRef}
            className="flex-1 overflow-y-auto overscroll-contain py-1"
          >
            {sorted.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No branches found
              </div>
            ) : (
              sorted.map((branch, index) => {
                const isActive = activeBranch?.id === branch.id;
                const isHighlighted = index === safeHighlightedIndex;
                return (
                  <button
                    key={branch.id}
                    onClick={() => selectBranch(branch)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                      isHighlighted
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    } ${isActive ? "font-medium" : ""}`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate block">{branch.name}</span>
                    </div>
                    {branch.isHeadOffice && (
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        HQ
                      </span>
                    )}
                    {isActive && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t px-4 py-2.5 text-center text-[11px] text-muted-foreground">
            {branches.length} branch{branches.length !== 1 ? "es" : ""}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
