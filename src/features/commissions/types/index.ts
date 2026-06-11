import type { CommissionRule, CommissionLedger, CommissionPayout, SalesHierarchy, SalesProfile, User } from "@/types/models";

export interface RuleWithHierarchy extends CommissionRule {
  hierarchyLevel?: SalesHierarchy | null;
}

export interface EntryWithProfile extends CommissionLedger {
  salesProfile: Pick<SalesProfile, "id"> & {
    user: Pick<User, "id" | "firstName" | "lastName" | "email">;
  };
  payout?: Pick<CommissionPayout, "id" | "amount" | "paidAt"> | null;
}

export interface PayoutWithEntries extends CommissionPayout {
  entries: (CommissionLedger & {
    salesProfile: Pick<SalesProfile, "id"> & {
      user: Pick<User, "id" | "firstName" | "lastName" | "email">;
    };
  })[];
  paidBy?: Pick<User, "id" | "firstName" | "lastName"> | null;
}

export interface CommissionFilters {
  salesProfileId?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CommissionMetrics {
  totalEarned: number;
  totalApproved: number;
  totalPaid: number;
  totalPending: number;
}

export interface PendingPayout {
  salesProfileId: string;
  profileName: string;
  total: number;
  entries: { id: string; amount: number; type: string; description?: string }[];
}
