export { complete, embed, configureProvider, type LLMMessage, type LLMCompletion, type LLMConfig } from "./llm/provider";

export { ask, indexKnowledge, removeKnowledge, clearBusinessKnowledge, type KnowledgeChunk, type RAGResult } from "./rag/pipeline";

export {
  addToSession,
  getSessionHistory,
  clearSession,
  getSessionStats,
  getBusinessMemory,
  saveBusinessMemory,
  type ConversationMessage,
  type BusinessKnowledge,
} from "./memory";

export {
  registerKnowledge,
  getDomainKnowledge,
  searchKnowledge,
  loadBusinessKnowledge,
  type KnowledgeEntry,
  type KnowledgeDomain,
} from "./knowledge";

// Re-export intelligence layer for backward compatibility
export {
  forecastRevenue,
  forecastStock,
  getDeadStock,
  getReorderRecommendations,
  detectChurnRisk,
  getSalesTrends,
  getProfitAnalysis,
  generateBusinessInsights,
} from "@/enkai/intelligence";
export type {
  RevenueForecast,
  StockForecast,
  ReorderRecommendation,
  ChurnRisk,
  SalesTrend,
} from "@/enkai/intelligence";
