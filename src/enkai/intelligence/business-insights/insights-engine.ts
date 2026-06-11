import "server-only";

import { getSalesTrends, getProfitAnalysis } from "../trend-analysis/sales-trends";
import { detectChurnRisk } from "../anomaly-detection/churn-detection";
import { getReorderRecommendations } from "../recommendations/reorder-recommendations";
import { getDeadStock } from "../forecasting/stock-forecast";
import { forecastRevenue } from "../forecasting/revenue-forecast";

export interface BusinessInsight {
  type: "opportunity" | "warning" | "info";
  category: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  action?: string;
}

export async function generateBusinessInsights(businessId: string): Promise<BusinessInsight[]> {
  const insights: BusinessInsight[] = [];

  try {
    const trends = await getSalesTrends(businessId);
    const profit = await getProfitAnalysis(businessId);
    const churnRisks = await detectChurnRisk(businessId);
    const reorders = await getReorderRecommendations(businessId);
    const deadStock = await getDeadStock(businessId);
    const revenue = await forecastRevenue(businessId);

    // Revenue insights
    const revenueChange = revenue.trend;
    if (revenueChange === "up") {
      insights.push({
        type: "opportunity",
        category: "Revenue",
        title: "Revenue Growth Detected",
        description: `Your revenue is trending upward. Next month forecast: ${formatCurrency(revenue.nextMonth)}.`,
        severity: "low",
        action: "Consider increasing inventory to meet growing demand.",
      });
    } else if (revenueChange === "down") {
      insights.push({
        type: "warning",
        category: "Revenue",
        title: "Revenue Decline Detected",
        description: `Your revenue is trending downward. Current month: ${formatCurrency(revenue.currentMonth)}.`,
        severity: "high",
        action: "Review pricing strategy and consider promotional campaigns.",
      });
    }

    // Profit margin insights
    if (profit.margin < 10) {
      insights.push({
        type: "warning",
        category: "Profitability",
        title: "Low Profit Margin",
        description: `Your profit margin is ${profit.margin.toFixed(1)}%. Consider reviewing costs.`,
        severity: "high",
        action: "Review supplier pricing and adjust retail prices.",
      });
    } else if (profit.margin > 30) {
      insights.push({
        type: "opportunity",
        category: "Profitability",
        title: "Healthy Profit Margin",
        description: `Your profit margin is ${profit.margin.toFixed(1)}%. You're in good shape.`,
        severity: "low",
      });
    }

    // Top products
    const topProduct = trends.topProducts[0];
    if (topProduct) {
      insights.push({
        type: "info",
        category: "Sales",
        title: "Top Performing Products",
        description: `Top product: ${topProduct.name} (${formatCurrency(topProduct.revenue)} in revenue).`,
        severity: "low",
      });
    }

    // Churn risks
    const highRiskChurn = churnRisks.filter((c) => c.riskLevel === "high");
    if (highRiskChurn.length > 0) {
      insights.push({
        type: "warning",
        category: "Customers",
        title: "Customer Churn Risk",
        description: `${highRiskChurn.length} customer(s) at high risk of churning. Consider reaching out.`,
        severity: "high",
        action: "Send re-engagement offers to at-risk customers.",
      });
    }

    // Reorder recommendations
    const criticalReorders = reorders.filter((r) => r.priority === "critical");
    if (criticalReorders.length > 0) {
      insights.push({
        type: "warning",
        category: "Inventory",
        title: "Critical Stock Alert",
        description: `${criticalReorders.length} item(s) critically low in stock and need immediate reorder.`,
        severity: "high",
        action: "Place urgent purchase orders for critical items.",
      });
    }

    // Dead stock
    if (deadStock.length > 0) {
      const deadStockValue = deadStock.reduce((s, d) => s + d.value, 0);
      insights.push({
        type: "warning",
        category: "Inventory",
        title: "Dead Stock Detected",
        description: `${deadStock.length} item(s) with no sales in 90 days. Value tied up: ${formatCurrency(deadStockValue)}.`,
        severity: "medium",
        action: "Consider discounting or bundling slow-moving items.",
      });
    }

    // General health
    if (revenue.currentMonth > 0 && profit.margin > 15) {
      insights.push({
        type: "info",
        category: "Business Health",
        title: "Business is Healthy",
        description: "Revenue is stable and margins are healthy. Keep up the good work!",
        severity: "low",
      });
    }
  } catch (error) {
    console.error("Error generating insights:", error);
  }

  return insights;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-TZ", { style: "currency", currency: "TZS" }).format(value);
}
