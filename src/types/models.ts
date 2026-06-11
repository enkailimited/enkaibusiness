import type {
  SalesProfileStatus,
  LeadSource,
  LeadStatus,
  SubscriptionInterval,
  SubscriptionStatus,
  CommissionType,
  CommissionLedgerStatus,
  CampaignStatus,
  QRCodeStatus,
  TicketStatus,
  TicketPriority,
} from "./enums";

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

export interface SalesHierarchy {
  id: string;
  level: number;
  title: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  profiles?: SalesProfile[];
  commissionRules?: CommissionRule[];
}

export interface SalesProfile {
  id: string;
  userId: string;
  phone: string | null;
  photo: string | null;
  region: string | null;
  status: SalesProfileStatus;
  hierarchyId: string | null;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  hierarchy?: SalesHierarchy | null;
  manager?: SalesProfile | null;
  subordinates?: SalesProfile[];
  leads?: Lead[];
  leadAssignments?: LeadAssignment[];
  commissionEntries?: CommissionLedger[];
}

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  businessName: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  assignedToId: string | null;
  convertedAt: string | null;
  convertedToUserId: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo?: SalesProfile | null;
  activities?: LeadActivity[];
  assignments?: LeadAssignment[];
}

export interface Activity {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  action: string;
  detail: string | null;
  createdById: string | null;
  createdAt: string;
  lead?: Lead;
  createdBy?: User | null;
}

export interface LeadAssignment {
  id: string;
  leadId: string;
  assignedToId: string;
  assignedById: string;
  reason: string | null;
  assignedAt: string;
  createdAt: string;
  lead?: Lead;
  assignedTo?: SalesProfile;
  assignedBy?: User;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  amount: string | number;
  currency: string;
  interval: SubscriptionInterval;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptions?: Subscription[];
}

export interface Subscription {
  id: string;
  planId: string;
  businessId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  graceEndDate: string | null;
  suspendedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  business?: Business;
  payments?: SubscriptionPayment[];
}

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: string | number;
  currency: string;
  method: string | null;
  reference: string | null;
  paidAt: string;
  createdAt: string;
  subscription?: Subscription;
}

export interface CommissionRule {
  id: string;
  name: string;
  hierarchyLevelId: string | null;
  type: CommissionType;
  value: string | number;
  minAmount: string | number | null;
  maxAmount: string | number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hierarchyLevel?: SalesHierarchy | null;
}

export interface CommissionLedger {
  id: string;
  salesProfileId: string;
  subscriptionId: string | null;
  payoutId: string | null;
  amount: string | number;
  type: CommissionType;
  description: string | null;
  status: CommissionLedgerStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  salesProfile?: SalesProfile;
  payout?: CommissionPayout | null;
}

export interface CommissionPayout {
  id: string;
  amount: string | number;
  notes: string | null;
  paidById: string | null;
  paidAt: string;
  createdAt: string;
  entries?: CommissionLedger[];
  paidBy?: User | null;
}

export interface DistributionCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  totalQRCodes: number;
  status: CampaignStatus;
  startDate: string | null;
  endDate: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: User | null;
  qrCodes?: QRCode[];
}

export interface QRCode {
  id: string;
  campaignId: string;
  code: string;
  businessId: string | null;
  status: QRCodeStatus;
  assignedToId: string | null;
  installedAt: string | null;
  createdAt: string;
  updatedAt: string;
  campaign?: DistributionCampaign;
  business?: Business | null;
  assignments?: QRCodeAssignment[];
  installations?: QRCodeInstallation[];
}

export interface QRCodeAssignment {
  id: string;
  qrCodeId: string;
  assignedTo: string;
  assignedBy: string;
  notes: string | null;
  assignedAt: string;
  createdAt: string;
  qrCode?: QRCode;
}

export interface QRCodeInstallation {
  id: string;
  qrCodeId: string;
  businessId: string;
  location: string | null;
  installedBy: string;
  notes: string | null;
  installedAt: string;
  createdAt: string;
  qrCode?: QRCode;
  business?: Business;
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  customerId: string;
  assignedToId: string | null;
  businessId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  assignedTo?: User | null;
}
