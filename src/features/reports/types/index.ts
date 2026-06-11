export type ReportPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface ReportSummary {
  total: number;
  count: number;
  avg: number;
  min: number;
  max: number;
}

export interface TrendPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ProductSale {
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  revenue: number;
}

export interface StaffSale {
  staffId: string;
  staffName: string;
  saleCount: number;
  totalRevenue: number;
}

export interface SalesReport {
  summary: ReportSummary;
  byStatus: Record<string, number>;
  byStaff: StaffSale[];
  topProducts: ProductSale[];
  trend: TrendPoint[];
}

export interface LowStockItem {
  id: string;
  itemName: string;
  sku: string | null;
  quantityOnHand: number;
  reorderPoint: number;
  locationName: string;
}

export interface LocationValue {
  locationId: string;
  locationName: string;
  stockValue: number;
  itemCount: number;
}

export interface ExpiringItem {
  id: string;
  itemName: string;
  sku: string | null;
  batchNo: string | null;
  quantity: number;
  expiryDate: string;
  locationName: string;
}

export interface InventorySummaryReport {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringCount: number;
  totalLocations: number;
}

export interface InventoryReport {
  summary: InventorySummaryReport;
  lowStock: LowStockItem[];
  stockValueByLocation: LocationValue[];
  expiringItems: ExpiringItem[];
  turnover: number;
}

export interface SupplierSpend {
  supplierId: string;
  supplierName: string;
  totalSpend: number;
  purchaseCount: number;
}

export interface PurchasesReport {
  summary: ReportSummary;
  bySupplier: SupplierSpend[];
  trend: TrendPoint[];
}

export interface CategorySpend {
  categoryId: string;
  categoryName: string;
  totalSpend: number;
  expenseCount: number;
}

export interface ExpensesReport {
  summary: ReportSummary;
  byCategory: CategorySpend[];
  trend: TrendPoint[];
}

export interface CustomerSummary {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  totalSpend: number;
  saleCount: number;
  lastPurchase: string | null;
}

export interface AcquisitionPoint {
  date: string;
  count: number;
}

export interface CustomersReport {
  summary: CustomerSummary;
  topCustomers: TopCustomer[];
  acquisition: AcquisitionPoint[];
}

export interface SupplierSummary {
  totalSuppliers: number;
  localSuppliers: number;
  internationalSuppliers: number;
}

export interface TopSupplier {
  supplierId: string;
  supplierName: string;
  totalSpend: number;
  purchaseCount: number;
}

export interface SupplierReliability {
  supplierId: string;
  supplierName: string;
  onTimeRate: number;
  totalOrders: number;
}

export interface SuppliersReport {
  summary: SupplierSummary;
  topSuppliers: TopSupplier[];
  reliability: SupplierReliability[];
}

export interface PlanDistribution {
  planId: string;
  planName: string;
  subscriberCount: number;
  mrr: number;
}

export interface SubscriptionSummary {
  totalActive: number;
  mrr: number;
  arpu: number;
  totalRevenue: number;
}

export interface SubscriptionsReport {
  summary: SubscriptionSummary;
  churnRate: number;
  planDistribution: PlanDistribution[];
}

export interface ReportFilter {
  dateRange?: DateRange;
  period?: ReportPeriod;
  businessId: string;
}
