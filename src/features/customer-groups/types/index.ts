export interface CustomerGroup {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  discountPercent: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerGroupWithCount extends CustomerGroup {
  _count: { customers: number };
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  discountPercent?: number;
  isDefault?: boolean;
}
