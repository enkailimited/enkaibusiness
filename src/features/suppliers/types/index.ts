export interface Supplier {
  id: string;
  businessId: string;
  supplierType: "local" | "international";
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  taxId: string | null;
  paymentTerms: string | null;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierWithCount extends Supplier {
  _count?: { purchases: number; purchaseOrders: number };
}

export interface SupplierFilter {
  supplierType?: string;
  country?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateSupplierInput {
  supplierType: "local" | "international";
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms?: string;
  currency?: string;
  isActive?: boolean;
}

export type SupplierType = "local" | "international";
