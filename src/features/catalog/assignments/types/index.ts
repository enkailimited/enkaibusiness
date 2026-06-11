import type { CatalogItemAssignment, Branch, Store } from "@/types/models";

export type AssignmentLevel = "branch" | "store";

export interface AssignmentInput {
  businessId: string;
  catalogItemId: string;
  branchId?: string;
  storeId?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface AssignmentWithRelations extends CatalogItemAssignment {
  branch: Pick<Branch, "id" | "name"> | null;
  store: Pick<Store, "id" | "name"> | null;
  catalogItem: Pick<CatalogItemAssignment["catalogItem"], "id" | "name" | "sku" | "imageUrl">;
}

export interface ItemAvailability {
  catalogItemId: string;
  itemName: string;
  assignments: AssignmentWithRelations[];
}
