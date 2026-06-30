"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

interface BranchInfo {
  id: string;
  name: string;
  isHeadOffice: boolean;
}

interface ActiveBranchContextType {
  activeBranch: BranchInfo | null;
  setActiveBranch: (branch: BranchInfo) => void;
  clearActiveBranch: () => void;
}

const ActiveBranchContext = createContext<ActiveBranchContextType>({
  activeBranch: null,
  setActiveBranch: () => {},
  clearActiveBranch: () => {},
});

export function useActiveBranch() {
  return useContext(ActiveBranchContext);
}

export function ActiveBranchProvider({
  children,
  businessId,
  branches,
  defaultBranchId,
}: {
  children: React.ReactNode;
  businessId: string;
  branches: BranchInfo[];
  defaultBranchId?: string;
}) {
  const [activeBranch, setActiveBranchState] = useState<BranchInfo | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`activeBranch_${businessId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const found = branches.find((b) => b.id === parsed.id);
        if (found) {
          setActiveBranchState(found);
          return;
        }
      } catch {}
    }
    if (defaultBranchId) {
      const assigned = branches.find((b) => b.id === defaultBranchId);
      if (assigned) {
        setActiveBranchState(assigned);
        localStorage.setItem(`activeBranch_${businessId}`, JSON.stringify(assigned));
        return;
      }
    }
    const headOffice = branches.find((b) => b.isHeadOffice) ?? null;
    const defaultBranch = headOffice ?? (branches.length > 0 ? branches[0] : null);
    if (defaultBranch) {
      setActiveBranchState(defaultBranch);
      localStorage.setItem(`activeBranch_${businessId}`, JSON.stringify(defaultBranch));
    }
  }, [businessId, branches, defaultBranchId]);

  const setActiveBranch = useCallback(
    (branch: BranchInfo) => {
      setActiveBranchState(branch);
      localStorage.setItem(`activeBranch_${businessId}`, JSON.stringify(branch));
    },
    [businessId],
  );

  const clearActiveBranch = useCallback(() => {
    setActiveBranchState(null);
    localStorage.removeItem(`activeBranch_${businessId}`);
  }, [businessId]);

  return (
    <ActiveBranchContext.Provider value={{ activeBranch, setActiveBranch, clearActiveBranch }}>
      {children}
    </ActiveBranchContext.Provider>
  );
}
