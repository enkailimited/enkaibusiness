"use server";

import { z } from "zod";
import { processMessage } from "../assistant/assistant-service";
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

const bizId = z.string().uuid("Invalid business ID");
const userId = z.string().uuid("Invalid user ID");
const sessionIdSchema = z.string().min(1, "Session ID required");
const inputSchema = z.string().min(1, "Input required");
const triggerSchema = z.string().min(1, "Trigger required");
const daysNum = z.coerce.number().int().positive().optional();

export async function sendMessageAction(
  input: string,
  context: { userId: string; businessId?: string; staffId?: string; workspaceId?: string },
  sessionId?: string,
) {
  const inputParsed = inputSchema.safeParse(input);
  if (!inputParsed.success) return { success: false, message: inputParsed.error.errors[0].message };
  return processMessage(input, context, sessionId);
}

export async function sendVoiceMessageAction(
  input: string,
  context: { userId: string; businessId?: string; staffId?: string; workspaceId?: string },
  sessionId?: string,
) {
  const inputParsed = inputSchema.safeParse(input);
  if (!inputParsed.success) return { success: false, message: inputParsed.error.errors[0].message };
  const { processVoiceInput } = await import("../voice/voice-service");
  const voiceResult = processVoiceInput(input);
  const messageToSend = voiceResult.parsed.confidence > 0 ? voiceResult.normalized : input;
  return processMessage(messageToSend, context, sessionId);
}

export async function getAssistantInsightsAction(businessId: string) {
  const parsed = bizId.safeParse(businessId);
  if (!parsed.success) return { success: false, message: "Invalid business ID" };
  return generateBusinessInsights(businessId);
}

export async function evaluateAutomationRulesAction(
  businessId: string,
  trigger: string,
  context: Record<string, unknown>,
) {
  const bParsed = bizId.safeParse(businessId);
  const tParsed = triggerSchema.safeParse(trigger);
  if (!bParsed.success) return { success: false, message: "Invalid business ID" };
  if (!tParsed.success) return { success: false, message: tParsed.error.errors[0].message };
  return evaluateRules(businessId, trigger, context);
}

export async function clearAssistantMemoryAction(sessionId: string) {
  const sParsed = sessionIdSchema.safeParse(sessionId);
  if (!sParsed.success) return { success: false, message: "Invalid session ID" };
  memoryStore.clear(sessionId);
  return { success: true };
}

export async function processVoiceAction(input: string) {
  const inputParsed = inputSchema.safeParse(input);
  if (!inputParsed.success) return { success: false, message: inputParsed.error.errors[0].message };
  const { processVoiceInput } = await import("../voice/voice-service");
  return processVoiceInput(input);
}

export async function getRevenueForecastAction(businessId: string) {
  const parsed = bizId.safeParse(businessId);
  if (!parsed.success) return { success: false, message: "Invalid business ID" };
  return forecastRevenue(businessId);
}

export async function getStockForecastAction(businessId: string, days?: number) {
  const bParsed = bizId.safeParse(businessId);
  if (!bParsed.success) return { success: false, message: "Invalid business ID" };
  return forecastStock(businessId, days);
}

export async function getReorderRecommendationsAction(businessId: string) {
  const parsed = bizId.safeParse(businessId);
  if (!parsed.success) return { success: false, message: "Invalid business ID" };
  return getReorderRecommendations(businessId);
}

export async function getDeadStockAction(businessId: string, days?: number) {
  const bParsed = bizId.safeParse(businessId);
  if (!bParsed.success) return { success: false, message: "Invalid business ID" };
  return getDeadStock(businessId, days);
}

export async function getChurnRiskAction(businessId: string) {
  const parsed = bizId.safeParse(businessId);
  if (!parsed.success) return { success: false, message: "Invalid business ID" };
  return detectChurnRisk(businessId);
}

export async function getSalesTrendsAction(businessId: string, days?: number) {
  const bParsed = bizId.safeParse(businessId);
  if (!bParsed.success) return { success: false, message: "Invalid business ID" };
  return getSalesTrends(businessId, days);
}

export async function getProfitAnalysisAction(businessId: string, days?: number) {
  const bParsed = bizId.safeParse(businessId);
  if (!bParsed.success) return { success: false, message: "Invalid business ID" };
  return getProfitAnalysis(businessId, days);
}

export async function getProactiveInsightsAction(businessId: string) {
  const parsed = bizId.safeParse(businessId);
  if (!parsed.success) return { success: false, message: "Invalid business ID" };
  return generateProactiveInsights(businessId);
}
