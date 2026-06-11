export type SessionStatus = "open" | "closed";

export interface POSSession {
  id: string;
  businessId: string;
  storeId: string | null;
  openedById: string;
  closedById: string | null;
  openedAt: string;
  closedAt: string | null;
  openingFloat: number;
  closingFloat: number | null;
  expectedAmount: number | null;
  actualAmount: number | null;
  difference: number | null;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface POSSessionWithStaff extends POSSession {
  store?: { id: string; name: string } | null;
  openedBy: { id: string; firstName: string; lastName: string };
  closedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CreatePOSSessionInput {
  storeId?: string;
  openingFloat: number;
}

export interface ClosePOSSessionInput {
  closingFloat: number;
}

export interface POSSessionFilter {
  storeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
