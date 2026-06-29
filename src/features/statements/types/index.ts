export interface StatementLine {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerStatement {
  customerId: string;
  customerName: string;
  businessId: string;
  dateRange: { from: Date; to: Date };
  openingBalance: number;
  lines: StatementLine[];
  closingBalance: number;
}

export interface SupplierStatement {
  supplierId: string;
  supplierName: string;
  businessId: string;
  dateRange: { from: Date; to: Date };
  openingBalance: number;
  lines: StatementLine[];
  closingBalance: number;
}
