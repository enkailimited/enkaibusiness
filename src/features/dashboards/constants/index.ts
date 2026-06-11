import type { WidgetType, DashboardLayout } from "../types";

export const WIDGET_TYPES: { value: WidgetType; label: string }[] = [
  { value: "kpi", label: "KPI Card" },
  { value: "sales-chart", label: "Sales Chart" },
  { value: "revenue-summary", label: "Revenue Summary" },
  { value: "low-stock", label: "Low Stock" },
  { value: "pending-orders", label: "Pending Orders" },
  { value: "subscriptions", label: "Subscriptions" },
  { value: "top-customers", label: "Top Customers" },
  { value: "top-products", label: "Top Products" },
  { value: "recent-sales", label: "Recent Sales" },
];

export const PLATFORM_LAYOUT: DashboardLayout = {
  columns: 4,
  widgets: [
    { type: "kpi", title: "Platform KPIs", data: [] },
    { type: "subscriptions", title: "Active Subscriptions", data: [] },
    { type: "revenue-summary", title: "Platform Revenue", data: [] },
    { type: "sales-chart", title: "Sales Overview", data: [] },
  ],
};

export const BUSINESS_LAYOUT: DashboardLayout = {
  columns: 3,
  widgets: [
    { type: "kpi", title: "Business KPIs", data: [] },
    { type: "sales-chart", title: "Sales Trend", data: [] },
    { type: "low-stock", title: "Low Stock Alerts", data: [] },
    { type: "pending-orders", title: "Pending Orders", data: [] },
  ],
};
