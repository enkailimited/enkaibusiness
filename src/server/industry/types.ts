import "server-only";

export type IndustrySlug =
  | "commerce"
  | "restaurant"
  | "education"
  | "healthcare"
  | "manufacturing"
  | "agriculture"
  | "services"
  | "logistics"
  | "real-estate"
  | "non-profit";

export type IndustryEnum =
  | "COMMERCE"
  | "RESTAURANT"
  | "EDUCATION"
  | "HEALTHCARE"
  | "MANUFACTURING"
  | "AGRICULTURE"
  | "SERVICES"
  | "LOGISTICS"
  | "REAL_ESTATE"
  | "NON_PROFIT";

export interface IndustryMode {
  slug: string;
  name: string;
  description: string;
}

export interface IndustryModule {
  slug: string;
  name: string;
  description: string;
  icon: string;
  isRequired: boolean;
}

export interface IndustryConfig {
  slug: IndustrySlug;
  enum: IndustryEnum;
  name: string;
  description: string;
  icon: string;
  color: string;
  modes: IndustryMode[];
  modules: IndustryModule[];
  requiredModules: string[];
  defaultMode: string;
}

export interface IndustryPermission {
  slug: string;
  name: string;
  module: string;
  description: string;
}

export interface IndustryAIKnowledge {
  slug: string;
  name: string;
  layers: string[];
  prompt: string;
}

export interface IndustryReport {
  slug: string;
  name: string;
  description: string;
  category: "sales" | "financial" | "operations" | "inventory" | "hr" | "custom";
  kpis: string[];
}

export interface IndustryDashboard {
  slug: string;
  name: string;
  widgets: string[];
  kpis: string[];
}

export interface IndustryWorkflow {
  slug: string;
  name: string;
  triggers: string[];
  actions: string[];
  module: string;
  isDefault: boolean;
}

export interface FullIndustryDefinition extends IndustryConfig {
  permissions: IndustryPermission[];
  aiKnowledge: IndustryAIKnowledge;
  reports: IndustryReport[];
  dashboards: IndustryDashboard[];
  workflows: IndustryWorkflow[];
}
