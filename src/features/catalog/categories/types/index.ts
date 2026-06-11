export interface CategoryWithChildren {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryWithChildren[];
  _count?: { catalogItems: number };
}

export interface CategoryHierarchy {
  id: string;
  name: string;
  slug: string;
  level: number;
  children: CategoryHierarchy[];
}

export interface CreateCategoryInput {
  name: string;
  parentId?: string;
  description?: string;
  imageUrl?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}
