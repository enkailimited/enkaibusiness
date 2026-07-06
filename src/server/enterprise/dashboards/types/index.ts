import type {
  SubscriptionInterval,
  InstallerStatus,
  CommissionLedgerStatus,
  CommissionType,
  TargetPeriod,
  KpiPeriod,
} from "@prisma/client";

// ──────────────────────────────────────────────
// Platform Dashboard
// ──────────────────────────────────────────────

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  recurringRevenue: number;
  installationRevenue: number;
}

export interface CommissionTrendPoint {
  date: string;
  earned: number;
  paid: number;
  pending: number;
}

export interface SubscriptionTrendPoint {
  date: string;
  active: number;
  new: number;
  expired: number;
}

export interface PlatformDashboardData {
  mrr: number;
  arr: number;
  totalRevenue: number;
  activeSubscriptions: number;
  totalCommissionEarned: number;
  totalCommissionPaid: number;
  newBusinesses: number;
  activeInstallers: number;
  pendingInstallations: number;
  salesPipeline: {
    totalLeads: number;
    convertedThisMonth: number;
  };
  customerLifetimeValue: {
    averageCLV: number;
    medianCLV: number;
    topCLV: number;
    bottomCLV: number;
    totalBusinessesTracked: number;
  };
  churnRate: number;
  retentionRate: number;
  revenueTrend: RevenueTrendPoint[];
  commissionTrend: CommissionTrendPoint[];
  subscriptionGrowth: SubscriptionTrendPoint[];
}

// ──────────────────────────────────────────────
// Sales Dashboard
// ──────────────────────────────────────────────

export interface CommissionBreakdown {
  earned: number;
  paid: number;
  pending: number;
  approved: number;
}

export interface LeadPipelineItem {
  status: string;
  count: number;
}

export interface RecentCommissionEntry {
  id: string;
  amount: number;
  type: CommissionType;
  description: string | null;
  status: CommissionLedgerStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface MonthlyCommissionPoint {
  month: string;
  amount: number;
}

export interface RecurringCommissionItem {
  id: string;
  percentage: number;
  totalPaid: number;
  paidCount: number;
  lastPaidDate: Date | null;
  planName: string;
  planAmount: number;
  planInterval: SubscriptionInterval;
  businessName: string;
}

export interface TopCustomerCLV {
  businessName: string;
  clv: number;
}

export interface SalesTargetInfo {
  id: string;
  period: TargetPeriod;
  year: number;
  month: number | null;
  leadsTarget: number | null;
  conversionsTarget: number | null;
  revenueTarget: number;
  recurringRevenueTarget: number;
  installationsTarget: number | null;
  achievedLeads: number;
  achievedConversions: number;
  achievedRevenue: number;
}

export interface ProgressPercentages {
  leads: number;
  conversions: number;
  revenue: number;
}

export interface SalesDashboardData {
  activeCustomers: number;
  recurringIncome: number;
  projectedIncome: number;
  lifetimeIncome: number;
  installationsThisMonth: number;
  currentTarget: SalesTargetInfo | null;
  progress: ProgressPercentages;
  commissionBreakdown: CommissionBreakdown;
  leadsPipeline: LeadPipelineItem[];
  recentCommissionEntries: RecentCommissionEntry[];
  monthlyCommissionTrend: MonthlyCommissionPoint[];
  recurringCommissions: RecurringCommissionItem[];
  topCustomersByCLV: TopCustomerCLV[];
}

// ──────────────────────────────────────────────
// Installer Dashboard
// ──────────────────────────────────────────────

export interface InstallerInfo {
  id: string;
  firstName: string;
  lastName: string;
  status: InstallerStatus;
  travelStatus: string | null;
}

export interface InstallerTicketItem {
  id: string;
  ticketNumber: string;
  businessName: string;
  businessAddress: string | null;
  branchName: string | null;
  scheduledDate: Date | null;
  status: string;
}

export interface TodayScheduleItem extends InstallerTicketItem {}

export interface InstallerPerformance {
  avgCompletionHours: number;
  rating: number;
  totalInstallations: number;
  completedJobs: number;
}

export interface ChecklistStatus {
  ticketId: string;
  ticketNumber: string;
  totalItems: number;
  completedItems: number;
  progress: number;
  items: Array<{
    id: string;
    name: string;
    isCompleted: boolean;
    sortOrder: number;
  }>;
}

export interface NextScheduledVisit {
  ticketId: string;
  ticketNumber: string;
  businessName: string;
  address: string | null;
  scheduledDate: Date | null;
}

export interface InstallerDashboardData {
  installer: InstallerInfo;
  upcomingInstallations: InstallerTicketItem[];
  completedThisMonth: number;
  pendingInstallations: number;
  currentTravelStatus: string | null;
  todaySchedule: TodayScheduleItem[];
  performance: InstallerPerformance;
  checklistStatus: ChecklistStatus | null;
  totalInstallationsAllTime: number;
  gpsLastUpdatedMinutesAgo: number | null;
  nextScheduledVisit: NextScheduledVisit | null;
}

// ──────────────────────────────────────────────
// Admin Reports
// ──────────────────────────────────────────────

export interface RevenueTrendItem {
  date: string;
  total: number;
  recurring: number;
  installation: number;
}

export interface RevenueReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  totalRevenue: number;
  recurringRevenue: number;
  installationRevenue: number;
  commissionRevenue: number;
  subscriptionRevenue: number;
  trend: RevenueTrendItem[];
}

export interface SalesRepCommission {
  salesProfileId: string;
  name: string;
  email: string | null;
  totalCommission: number;
  entryCount: number;
}

export interface CommissionReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  earned: number;
  paid: number;
  pending: number;
  bySalesRep: SalesRepCommission[];
}

export interface InstallerJobStats {
  installerId: string;
  name: string;
  totalJobs: number;
  avgCompletionTime: number;
}

export interface InstallationReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  total: number;
  completed: number;
  pending: number;
  byInstaller: InstallerJobStats[];
}

export interface TopCLVCustomer {
  businessId: string;
  businessName: string;
  lifetimeValue: number;
  averageMonthlyValue: number;
  monthsActive: number;
}

export interface CLVReport {
  averageCLV: number;
  medianCLV: number;
  topCLV: number;
  bottomCLV: number;
  totalBusinessesTracked: number;
  topCustomers: TopCLVCustomer[];
}

export interface ChurnTrendPoint {
  date: string;
  churnRate: number;
  retentionRate: number;
}

export interface ChurnReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  churnRate: number;
  retentionRate: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  activeCustomers: number;
  churnedCustomers: number;
  retainedCustomers: number;
  trend: ChurnTrendPoint[];
}

export interface RetentionTrendPoint {
  date: string;
  retentionRate: number;
  renewalsSuccessful: number;
  renewalsFailed: number;
}

export interface RetentionReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  renewalsSuccessful: number;
  renewalsFailed: number;
  retentionRate: number;
  retentionBonusesAwarded: number;
  retentionBonusCount: number;
  trend: RetentionTrendPoint[];
}

export interface TopReferrer {
  salesProfileId: string;
  name: string;
  totalCommission: number;
  entryCount: number;
}

export interface ReferralReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  totalReferralCommissions: number;
  totalReferralEntries: number;
  topReferrers: TopReferrer[];
}

export interface SalesRepRanking {
  salesProfileId: string;
  name: string;
  email: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalRevenue: number;
  installations: number;
}

export interface SalesPerformanceReport {
  period: KpiPeriod;
  dateFrom: Date;
  dateTo: Date;
  rankings: SalesRepRanking[];
}
