export interface RuleWithHierarchy {
  id: string;
  name: string;
  hierarchyLevelId: string | null;
  type: string;
  value: unknown;
  minAmount: unknown | null;
  maxAmount: unknown | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  hierarchyLevel?: { id: string; createdAt: Date; updatedAt: Date; slug: string; description: string | null; title: string; level: number } | null;
}

export interface EntryWithProfile {
  id: string;
  salesProfileId: string;
  subscriptionId: string | null;
  payoutId: string | null;
  amount: unknown;
  type: string;
  description: string | null;
  status: string;
  paidAt: Date | null;
  payoutMethodId: string | null;
  paymentReference: string | null;
  adjustedById: string | null;
  adjustmentReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  salesProfile: { id: string; user: { id: string; firstName: string; lastName: string; email: string } };
  payout?: { id: string; amount: unknown; paidAt: Date } | null;
}

export interface PayoutWithEntries {
  id: string;
  amount: unknown;
  notes: string | null;
  paidById: string | null;
  paidAt: Date;
  createdAt: Date;
  entries: ({
    id: string;
    salesProfileId: string;
    amount: unknown;
    type: string;
    status: string;
    description: string | null;
    paidAt: Date | null;
    createdAt: Date;
    salesProfile: { id: string; user: { id: string; firstName: string; lastName: string; email: string } };
  })[];
  paidBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface CommissionFilters {
  salesProfileId?: string;
  status?: string;
  type?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CommissionMetrics {
  totalEarned: number;
  totalApproved: number;
  totalPaid: number;
  totalPending: number;
}

export interface PendingPayout {
  salesProfileId: string;
  profileName: string;
  total: number;
  entries: { id: string; amount: number; type: string; description?: string }[];
  payoutMethod?: { id: string; type: string; label: string | null } | null;
}

export interface CalculationContext {
  amount: number;
  industry?: string;
  businessModeId?: string;
  subscriptionPlanId?: string;
  installationPackageId?: string;
  businessId?: string;
  userId?: string;
  revenue?: number;
  branchCount?: number;
  customerCount?: number;
  catalogItemCount?: number;
  subscriptionId?: string;
  salesProfileId?: string;
  [key: string]: unknown;
}

export interface CommissionBreakdownItem {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  calculationType: string;
  amount: number;
  description?: string;
}

export interface CommissionCalculationResult {
  total: number;
  breakdown: CommissionBreakdownItem[];
}

export interface TierConfig {
  min: number;
  max: number;
  percentage?: number;
  flatAmount?: number;
}

export interface HybridSubRule {
  name: string;
  calculationType: "FLAT" | "PERCENTAGE" | "FORMULA";
  value?: number;
  formula?: string;
}

export interface HybridConfig {
  operator: "SUM" | "MAX" | "AVERAGE";
  rules: HybridSubRule[];
}

export interface CreateRuleV2Data {
  name: string;
  description?: string;
  triggerEvent: string;
  ruleType: string;
  calculationType?: string;
  industry?: string;
  businessModeId?: string;
  subscriptionPlanId?: string;
  installationPackageId?: string;
  minRevenue?: number;
  maxRevenue?: number;
  minBranches?: number;
  maxBranches?: number;
  minCustomers?: number;
  maxCustomers?: number;
  minCatalogItems?: number;
  maxCatalogItems?: number;
  tiers?: TierConfig[];
  formula?: string;
  hybridConfig?: HybridConfig;
  priority?: number;
  effectiveDate?: Date;
  expiryDate?: Date;
  percentage?: number;
  flatAmount?: number;
}

export interface UpdateRuleV2Data {
  name?: string;
  description?: string;
  triggerEvent?: string;
  ruleType?: string;
  calculationType?: string;
  industry?: string;
  businessModeId?: string;
  subscriptionPlanId?: string;
  installationPackageId?: string;
  minRevenue?: number;
  maxRevenue?: number;
  minBranches?: number;
  maxBranches?: number;
  minCustomers?: number;
  maxCustomers?: number;
  minCatalogItems?: number;
  maxCatalogItems?: number;
  tiers?: TierConfig[];
  formula?: string;
  hybridConfig?: HybridConfig;
  priority?: number;
  effectiveDate?: Date;
  expiryDate?: Date;
  isActive?: boolean;
  percentage?: number;
  flatAmount?: number;
}

export interface CreateDistributionData {
  name: string;
  description?: string;
  participantType: string;
  percentage: number;
  fixedAmount?: number;
  priority?: number;
}

export interface UpdateDistributionData {
  name?: string;
  description?: string;
  participantType?: string;
  percentage?: number;
  fixedAmount?: number;
  priority?: number;
  isActive?: boolean;
}

export interface DistributionResult {
  total: number;
  distributions: DistributionAllocation[];
}

export interface DistributionAllocation {
  participantType: string;
  percentage: number;
  amount: number;
  fixedAmount?: number;
}

export interface CreateRecurringConfigData {
  salesProfileId: string;
  subscriptionId: string;
  ruleId: string;
  percentage: number;
}

export interface RecurringCommissionMetrics {
  totalRecurringEarned: number;
  activeConfigs: number;
  totalPaidCount: number;
  averagePerPayment: number;
}

export interface CreateEntryData {
  salesProfileId: string;
  amount: number;
  type: "FLAT" | "PERCENTAGE";
  description?: string;
  subscriptionId?: string;
  payoutMethodId?: string;
  paymentReference?: string;
  adjustedById?: string;
  adjustmentReason?: string;
}

export interface AdjustmentData {
  amount: number;
  reason: string;
  adjustedById: string;
}

export interface CreateRetentionBonusConfigData {
  name: string;
  description?: string;
  triggerType: string;
  triggerValue?: number;
  bonusType: string;
  bonusValue: number;
  formula?: string;
}

export interface UpdateRetentionBonusConfigData {
  name?: string;
  description?: string;
  triggerType?: string;
  triggerValue?: number;
  bonusType?: string;
  bonusValue?: number;
  formula?: string;
  isActive?: boolean;
}

export interface CLVData {
  businessId: string;
  businessName: string;
  lifetimeValue: number;
  averageRevenuePerPeriod: number;
  customerLifespanMonths: number;
  totalTransactions: number;
  lastUpdated?: Date;
}

export interface CLVAggregateMetrics {
  averageCLV: number;
  medianCLV: number;
  topCLV: number;
  bottomCLV: number;
  totalBusinessesTracked: number;
}
