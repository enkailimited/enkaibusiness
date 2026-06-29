import type { CustomerGroup } from "@/types/models";

export interface Customer {
  id: string;
  businessId: string;
  contactId: string | null;
  userId: string | null;
  customerType: "RETAIL" | "WHOLESALE" | "WALK_IN";
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  customerGroupId: string | null;
  creditLimit: number;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithGroup extends Customer {
  customerGroup: CustomerGroup | null;
}

export interface CustomerWithRelations extends Customer {
  customerGroup: CustomerGroup | null;
  _count?: { sales: number; quotations: number; invoices: number; payments: number };
}

export interface CustomerFilter {
  customerType?: string;
  customerGroupId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateCustomerInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  customerType: "RETAIL" | "WHOLESALE" | "WALK_IN";
  contactId?: string;
  customerGroupId?: string;
  creditLimit?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export type CustomerType = "RETAIL" | "WHOLESALE" | "WALK_IN";
