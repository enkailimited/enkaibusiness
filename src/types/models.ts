export interface User {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  password: string;
  avatarUrl: string | null;
  isActive: boolean;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  workspace?: Workspace;
}

export type WorkspaceMemberRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

export interface Business {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  logoUrl: string | null;
  taxId: string | null;
  currency: string;
  timezone: string;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMode {
  id: string;
  businessId: string;
  industry: Industry;
  mode: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Industry =
  | "COMMERCE"
  | "HEALTHCARE"
  | "RESTAURANT"
  | "MANUFACTURING"
  | "AGRICULTURE"
  | "SERVICES";

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postalCode: string | null;
  isHeadOffice: boolean;
  isActive: boolean;
  openingTime: string | null;
  closingTime: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  branchId: string;
  name: string;
  code: string | null;
  description: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description: string | null;
  sku: string | null;
  barcode: string | null;
  itemType: CatalogItemType;
  category: string | null;
  unit: string | null;
  price: number;
  costPrice: number | null;
  taxRate: number | null;
  currency: string;
  imageUrl: string | null;
  isActive: boolean;
  isService: boolean;
  trackStock: boolean;
  metadata: Record<string, unknown> | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CatalogItemType = "PRODUCT" | "SERVICE" | "MEDICINE" | "MENU_ITEM";

export interface Role {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  businessId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RoleScope = "PLATFORM" | "BUSINESS";

export interface Permission {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  module: string;
  action: string;
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  businessId: string | null;
  createdAt: string;
}
