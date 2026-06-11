// Enkai AI Intelligence Layer

// Forecasting
export { forecastRevenue } from "./forecasting/revenue-forecast";
export type { RevenueForecast } from "./forecasting/revenue-forecast";
export { forecastStock, getDeadStock } from "./forecasting/stock-forecast";
export type { StockForecast } from "./forecasting/stock-forecast";

// Recommendations
export { getReorderRecommendations } from "./recommendations/reorder-recommendations";
export type { ReorderRecommendation } from "./recommendations/reorder-recommendations";

// Anomaly Detection
export { detectChurnRisk } from "./anomaly-detection/churn-detection";
export type { ChurnRisk } from "./anomaly-detection/churn-detection";

// Trend Analysis
export { getSalesTrends, getProfitAnalysis } from "./trend-analysis/sales-trends";
export type { SalesTrend } from "./trend-analysis/sales-trends";

// Business Insights
export { generateBusinessInsights } from "./business-insights/insights-engine";
export type { BusinessInsight } from "./business-insights/insights-engine";

// Automation Rules
export { evaluateAndExecute } from "./automation-rules/rule-engine";
export type { AutomationAction, AutomationRule } from "./automation-rules/rule-engine";
