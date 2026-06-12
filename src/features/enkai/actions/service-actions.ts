"use server";

import { processMessage, getSessionHistory, clearSession } from "../assistant/assistant-service";
import { generateInsights, getCachedInsights } from "../insights/insights-service";
import { evaluateRules } from "../automation/automation-service";
import { generateProactiveInsights } from "../services/proactive-insights";
import { memoryStore } from "../memory/memory-store";
import { generateBusinessInsights } from "@/enkai/intelligence/business-insights/insights-engine";
import { forecastRevenue } from "@/enkai/intelligence/forecasting/revenue-forecast";
import { forecastStock, getDeadStock } from "@/enkai/intelligence/forecasting/stock-forecast";
import { getReorderRecommendations } from "@/enkai/intelligence/recommendations/reorder-recommendations";
import { detectChurnRisk } from "@/enkai/intelligence/anomaly-detection/churn-detection";
import { getSalesTrends, getProfitAnalysis } from "@/enkai/intelligence/trend-analysis/sales-trends";

export async function sendMessageAction(
  input: string,
  context: { userId: string; businessId?: string; staffId?: string; workspaceId?: string },
  sessionId?: string,
) {
  return processMessage(input, context, sessionId);
}

export async function getAssistantInsightsAction(businessId: string) {
  return generateBusinessInsights(businessId);
}

export async function evaluateAutomationRulesAction(
  businessId: string,
  trigger: string,
  context: Record<string, unknown>,
) {
  return evaluateRules(businessId, trigger, context);
}

export async function clearAssistantMemoryAction(sessionId: string) {
  memoryStore.clear(sessionId);
  return { success: true };
}

export async function processVoiceAction(input: string) {
  const { processVoiceInput } = await import("../voice/voice-service");
  return processVoiceInput(input);
}

// Intelligence actions
export async function getRevenueForecastAction(businessId: string) {
  return forecastRevenue(businessId);
}

export async function getStockForecastAction(businessId: string, days?: number) {
  return forecastStock(businessId, days);
}

export async function getReorderRecommendationsAction(businessId: string) {
  return getReorderRecommendations(businessId);
}

export async function getDeadStockAction(businessId: string, days?: number) {
  return getDeadStock(businessId, days);
}

export async function getChurnRiskAction(businessId: string) {
  return detectChurnRisk(businessId);
}

export async function getSalesTrendsAction(businessId: string, days?: number) {
  return getSalesTrends(businessId, days);
}

export async function getProfitAnalysisAction(businessId: string, days?: number) {
  return getProfitAnalysis(businessId, days);
}

export async function getProactiveInsightsAction(businessId: string) {
  return generateProactiveInsights(businessId);
}
