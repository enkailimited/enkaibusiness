"use client";

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

export function BusinessLayoutClient({
  children,
  businessId,
  branches,
  assignedBranchId,
}: BusinessLayoutClientProps) {
  return (
    <ActiveBranchProvider businessId={businessId} branches={branches} defaultBranchId={assignedBranchId ?? undefined}>
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <BranchSwitcher branches={branches} />
        </div>
        {children}
      </div>
    </ActiveBranchProvider>
  );
}
