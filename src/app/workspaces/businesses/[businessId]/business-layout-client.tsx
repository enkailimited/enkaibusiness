"use client";

import { useEffect } from "react";
import { ActiveBranchProvider } from "@/features/branches/context/active-branch-context";
import { BranchSwitcher } from "@/features/branches/components/branch-switcher";
import { useNavbarSlots } from "@/components/layout/navbar-slots";

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
  const { setBranchSwitcher } = useNavbarSlots();

  useEffect(() => {
    setBranchSwitcher(<BranchSwitcher branches={branches} />);
    return () => setBranchSwitcher(null);
  }, [branches, setBranchSwitcher]);

  return null;
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
