"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ActiveBranchProvider } from "@/features/branches/context/active-branch-context";
import { BranchSwitcher } from "@/features/branches/components/branch-switcher";

interface BranchInfo {
  id: string;
  name: string;
  isHeadOffice: boolean;
}

interface BusinessLayoutClientProps {
  children: React.ReactNode;
  businessId: string;
  branches: BranchInfo[];
  assignedBranchId?: string | null;
}

function BranchSwitcherSlot({ branches }: { branches: BranchInfo[] }) {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setTarget(document.getElementById("branch-switcher-portal"));
  }, []);

  if (!target) return null;

  return createPortal(<BranchSwitcher branches={branches} />, target);
}

export function BusinessLayoutClient({
  children,
  businessId,
  branches,
  assignedBranchId,
}: BusinessLayoutClientProps) {
  return (
    <ActiveBranchProvider businessId={businessId} branches={branches} defaultBranchId={assignedBranchId ?? undefined}>
      <BranchSwitcherSlot branches={branches} />
      {children}
    </ActiveBranchProvider>
  );
}
