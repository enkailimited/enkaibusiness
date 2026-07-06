export type {
  RuleWithHierarchy,
  EntryWithProfile,
  PayoutWithEntries,
  CommissionFilters,
  CommissionMetrics,
  PendingPayout,
  CalculationContext,
  CommissionBreakdownItem,
  CommissionCalculationResult,
  TierConfig,
  HybridConfig,
  HybridSubRule,
  CreateRuleV2Data,
  UpdateRuleV2Data,
  CreateDistributionData,
  UpdateDistributionData,
  DistributionResult,
  DistributionAllocation,
  CreateRecurringConfigData,
  RecurringCommissionMetrics,
  CreateEntryData,
  AdjustmentData,
  CreateRetentionBonusConfigData,
  UpdateRetentionBonusConfigData,
  CLVData,
  CLVAggregateMetrics,
} from "./types";

export {
  CommissionType,
  CommissionLedgerStatus,
  COMMISSION_TYPE_LABELS,
  LEDGER_STATUS_LABELS,
  COMMISSION_TYPE_OPTIONS,
  LEDGER_STATUS_OPTIONS,
} from "./constants";
export type { CommissionTypeEnum, CommissionLedgerStatusEnum } from "./constants";

export {
  createCommissionRuleSchema,
  updateCommissionRuleSchema,
  approveCommissionSchema,
  createPayoutSchema,
  commissionFilterSchema,
  createRuleV2Schema,
  updateRuleV2Schema,
  createDistributionSchema,
  updateDistributionSchema,
  createRecurringConfigSchema,
  createEntrySchema,
  adjustmentSchema,
  createRetentionBonusConfigSchema,
  updateRetentionBonusConfigSchema,
} from "./schemas";
export type {
  CreateCommissionRuleSchema,
  UpdateCommissionRuleSchema,
  ApproveCommissionSchema,
  CreatePayoutSchema,
  CommissionFilterSchema,
  CreateRuleV2Schema,
  UpdateRuleV2Schema,
  CreateDistributionSchema,
  UpdateDistributionSchema,
  CreateRecurringConfigSchema,
  CreateEntrySchema,
  AdjustmentSchema,
  CreateRetentionBonusConfigSchema,
  UpdateRetentionBonusConfigSchema,
} from "./schemas";

// ─── V1 Rules ──────────────────────────────────────────────────────────────────
export {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
} from "./services/rule-service";

// ─── V2 Rules ──────────────────────────────────────────────────────────────────
export {
  getRulesV2,
  getRuleV2,
  createRuleV2,
  updateRuleV2,
  deleteRuleV2,
  toggleRuleV2,
  getRulesForEvent,
  calculateCommissionV2,
  getRuleBreakdown,
} from "./services/rule-service";

// ─── Ledger / Entries ──────────────────────────────────────────────────────────
export {
  createEntry,
  getEntries,
  getEntriesByProfile,
  approveEntry,
  rejectEntry,
  partialPayEntry,
  adjustEntry,
  manualEntry,
  calculateCommission,
  getPendingPayouts,
  cancelEntry,
  clawbackEntry,
  getCommissionMetrics,
} from "./services/ledger-service";

// ─── Payouts (V1) ───────────────────────────────────────────────────────────────
export {
  createPayout,
  getPayouts,
  getPayout,
} from "./services/payout-service";

// ─── Payouts (V2) ───────────────────────────────────────────────────────────────
export {
  getPendingPayoutsV2,
  createBatchPayout,
  processPayoutApproval,
  processPayoutPaid,
} from "./services/payout-service-v2";

// ─── Distribution ───────────────────────────────────────────────────────────────
export {
  getDistributionRules,
  createDistributionRule,
  updateDistributionRule,
  deleteDistributionRule,
  distributePayment,
  getDistributionForAmount,
} from "./services/distribution-service";

// ─── Recurring Commissions ──────────────────────────────────────────────────────
export {
  calculateRecurringCommission,
  createRecurringConfig,
  processRecurringCommission,
  deactivateRecurringCommission,
  getActiveRecurringCommissions,
  getRecurringCommissionMetrics,
} from "./services/recurring-commission-service";

// ─── CLV ────────────────────────────────────────────────────────────────────────
export {
  updateCLV,
  getCLV,
  getCLVRankings,
  aggregateCLVMetrics,
} from "./services/clv-service";

// ─── Retention Bonuses ──────────────────────────────────────────────────────────
export {
  getRetentionBonusConfigs,
  createRetentionBonusConfig,
  updateRetentionBonusConfig,
  checkAndAwardBonuses,
  processRetentionMilestones,
} from "./services/retention-service";

// ─── Actions ────────────────────────────────────────────────────────────────────
export {
  getCommissionRulesAction,
  getCommissionRuleAction,
  createCommissionRuleAction,
  updateCommissionRuleAction,
  deleteCommissionRuleAction,
  getCommissionEntriesAction,
  getEntriesByProfileAction,
  approveCommissionEntryAction,
  createPayoutAction,
  getPayoutsAction,
  getPayoutAction,
  getPendingPayoutsAction,
  getCommissionMetricsAction,
} from "./actions";

export { RuleList } from "./components/rule-list";
export { RuleForm } from "./components/rule-form";
export { LedgerList } from "./components/ledger-list";
export { PayoutList } from "./components/payout-list";
export { PayoutForm } from "./components/payout-form";
