export interface BrandWithCount {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
  _count: { catalogItems: number };
}

export interface CreateBrandInput {
  name: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}
