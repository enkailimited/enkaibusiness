import type { WorkflowType, WorkflowStep } from "./workflow-persistence";

export type { WorkflowType, WorkflowStep };

export interface WorkflowState {
  type: WorkflowType;
  currentStep: WorkflowStep;
  params: Record<string, unknown>;
  startedAt: Date;
  updatedAt: Date;
}

const workflowStepSequences: Record<WorkflowType, WorkflowStep[]> = {
  sales: ["awaiting_product", "awaiting_quantity", "awaiting_price", "awaiting_payment_method", "awaiting_customer", "awaiting_store", "completed"],
  purchases: ["awaiting_supplier", "awaiting_supplier_item", "awaiting_supplier_quantity", "awaiting_supplier_cost", "completed"],
  expenses: ["awaiting_description", "awaiting_category", "awaiting_price", "completed"],
  inventory: ["awaiting_product", "awaiting_from_location", "awaiting_to_location", "awaiting_quantity", "completed"],
  customers: ["awaiting_product", "awaiting_quantity", "completed"],
  suppliers: ["awaiting_product", "awaiting_quantity", "completed"],
  business_setup: ["awaiting_business_name", "awaiting_business_type", "awaiting_branch_name", "completed"],
  user_creation: ["awaiting_user_name", "awaiting_user_email", "awaiting_user_role", "completed"],
  none: [],
};

export class WorkflowEngine {
  private workflows: Map<string, WorkflowState> = new Map();

  getOrCreate(sessionId: string, type: WorkflowType): WorkflowState {
    let wf = this.workflows.get(sessionId);
    if (!wf || wf.type !== type) {
      wf = {
        type,
        currentStep: workflowStepSequences[type]?.[0] || "completed",
        params: {},
        startedAt: new Date(),
        updatedAt: new Date(),
      };
      this.workflows.set(sessionId, wf);
    }
    return wf;
  }

  get(sessionId: string): WorkflowState | undefined {
    return this.workflows.get(sessionId);
  }

  setParam(sessionId: string, key: string, value: unknown): void {
    const wf = this.workflows.get(sessionId);
    if (wf) {
      wf.params[key] = value;
      wf.updatedAt = new Date();
    }
  }

  advance(sessionId: string): WorkflowStep {
    const wf = this.workflows.get(sessionId);
    if (!wf) return "completed";
    const sequence = workflowStepSequences[wf.type] || [];
    const currentIdx = sequence.indexOf(wf.currentStep);
    if (currentIdx === -1 || currentIdx >= sequence.length - 1) {
      wf.currentStep = "completed";
    } else {
      wf.currentStep = sequence[currentIdx + 1];
    }
    wf.updatedAt = new Date();
    return wf.currentStep;
  }

  isComplete(sessionId: string): boolean {
    return this.workflows.get(sessionId)?.currentStep === "completed";
  }

  getMissingFields(sessionId: string): string[] {
    const wf = this.workflows.get(sessionId);
    if (!wf || wf.currentStep === "completed") return [];
    switch (wf.currentStep) {
      case "awaiting_product": return ["product"];
      case "awaiting_quantity": return ["quantity"];
      case "awaiting_price": return ["price"];
      case "awaiting_payment_method": return ["payment_method"];
      case "awaiting_customer": return ["customer"];
      case "awaiting_store": return ["store"];
      case "awaiting_supplier": return ["supplier"];
      case "awaiting_supplier_item": return ["supplier_item"];
      case "awaiting_supplier_quantity": return ["supplier_quantity"];
      case "awaiting_supplier_cost": return ["supplier_cost"];
      case "awaiting_description": return ["description"];
      case "awaiting_category": return ["category"];
      case "awaiting_from_location": return ["from_location"];
      case "awaiting_to_location": return ["to_location"];
      case "awaiting_business_name": return ["business_name"];
      case "awaiting_business_type": return ["business_type"];
      case "awaiting_branch_name": return ["branch_name"];
      case "awaiting_user_name": return ["user_name"];
      case "awaiting_user_email": return ["user_email"];
      case "awaiting_user_role": return ["user_role"];
      default: return [];
    }
  }

  clear(sessionId: string): void {
    this.workflows.delete(sessionId);
  }

  getNextQuestion(sessionId: string): string | null {
    const wf = this.workflows.get(sessionId);
    if (!wf || wf.currentStep === "completed") return null;

    const questions: Record<WorkflowStep, string> = {
      awaiting_product: "Bidhaa gani?",
      awaiting_quantity: "Kiasi gani?",
      awaiting_price: "Bei gani?",
      awaiting_payment_method: "Njia ya malipo? (Cash, M-Pesa, Tigo Pesa, Airtel Money, Benki, Kadi)",
      awaiting_customer: "Mteja ni nani?",
      awaiting_store: "Duka gani?",
      awaiting_supplier: "Msambazaji gani?",
      awaiting_supplier_item: "Bidhaa gani?",
      awaiting_supplier_quantity: "Umenunua kiasi gani?",
      awaiting_supplier_cost: "Umenunua kwa bei gani?",
      awaiting_description: "Gharama hii ni ya nini? (mf: mafuta, usafiri, internet, umeme, kodi)",
      awaiting_category: "Aina ya gharama?",
      awaiting_from_location: "Sehemu ya kutoka?",
      awaiting_to_location: "Sehemu ya kwenda?",
      awaiting_business_name: "Jina la biashara?",
      awaiting_business_type: "Aina ya biashara? (mf: Retail, Wholesale, Restaurant, Pharmacy)",
      awaiting_branch_name: "Jina la tawi?",
      awaiting_user_name: "Jina la mtumiaji?",
      awaiting_user_email: "Barua pepe ya mtumiaji?",
      awaiting_user_role: "Cheo cha mtumiaji?",
      awaiting_confirmation: "Je, una uhakika?",
      completed: null,
    };

    return questions[wf.currentStep] || null;
  }
}

export const workflowEngine = new WorkflowEngine();
