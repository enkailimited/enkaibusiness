export type DepositRequestStatus = "pending" | "approved" | "rejected";

export interface DepositRequestListItem {
  id: string;
  businessId: string;
  businessName: string;
  amount: number;
  reference: string | null;
  description: string | null;
  status: DepositRequestStatus;
  requestedBy: { id: string; firstName: string | null; lastName: string | null; email: string };
  reviewedBy: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  reviewedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}
