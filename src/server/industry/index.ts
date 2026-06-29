import "server-only";

export type {
  IndustrySlug,
  IndustryEnum,
  IndustryMode,
  IndustryModule,
  IndustryConfig,
  FullIndustryDefinition,
  IndustryPermission,
  IndustryAIKnowledge,
  IndustryReport,
  IndustryDashboard,
  IndustryWorkflow,
} from "./types";

export {
  INDUSTRY_REGISTRY,
  getIndustry,
  getIndustryByEnum,
  getAllIndustries,
  getIndustryModes,
  getIndustryModules,
  getModulesForMode,
} from "./registry";

export { ModuleResolver, moduleResolver } from "./module-resolver";
export { PermissionResolver, permissionResolver } from "./permission-resolver";
export { IndustryAIResolver, industryAIResolver } from "./ai-resolver";
export { ReportResolver, reportResolver } from "./report-resolver";
export { DashboardResolver, dashboardResolver } from "./dashboard-resolver";
export { WorkflowResolver, workflowResolver } from "./workflow-resolver";
export { UIAdapter, uiAdapter } from "./ui-adapter";
