export interface KPIData {
  label: string;
  value: string | number;
  change: number | null;
  trend: "up" | "down" | "neutral" | null;
}

export type WidgetType =
  | "kpi"
  | "sales-chart"
  | "revenue-summary"
  | "low-stock"
  | "pending-orders"
  | "subscriptions"
  | "top-customers"
  | "top-products"
  | "recent-sales";

export interface DashboardWidget {
  type: WidgetType;
  title: string;
  data: KPIData[] | Record<string, unknown>;
  layout?: {
    colSpan?: number;
    rowSpan?: number;
  };
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
}

export interface RoleDashboard {
  role: "platform" | "business";
  layout: DashboardLayout;
}

export interface PlatformKPIs {
  totalWorkspaces: number;
  totalBusinesses: number;
  totalUsers: number;
  totalRevenue: number;
  activeSubscriptions: number;
  pendingTickets: number;
}

export interface BusinessKPIs {
  todaySales: number;
  weeklyRevenue: number;
  totalCustomers: number;
  lowStockCount: number;
  pendingOrders: number;
  monthlyExpenses: number;
}
