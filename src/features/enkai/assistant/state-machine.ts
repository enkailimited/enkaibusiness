import "server-only";

export type TransactionType =
  | "sales"
  | "purchases"
  | "receiving"
  | "supplier_delivery"
  | "expenses"
  | "inventory"
  | "customer_payment"
  | "supplier_payment";

export type SalesStep =
  | "awaiting_product"
  | "awaiting_quantity"
  | "awaiting_customer"
  | "awaiting_payment_method"
  | "confirming_sale"
  | "completed";

export type PurchaseStep =
  | "awaiting_product"
  | "awaiting_quantity"
  | "awaiting_cost"
  | "awaiting_supplier"
  | "awaiting_payment_method"
  | "confirming_purchase"
  | "completed";

export type ReceivingStep =
  | "awaiting_product"
  | "awaiting_quantity"
  | "awaiting_supplier"
  | "confirming_receiving"
  | "completed";

export type CustomerPaymentStep =
  | "awaiting_customer"
  | "awaiting_amount"
  | "confirming_payment"
  | "completed";

export type SupplierPaymentStep =
  | "awaiting_supplier"
  | "awaiting_amount"
  | "confirming_payment"
  | "completed";

export type FlowStep =
  | SalesStep
  | PurchaseStep
  | ReceivingStep
  | CustomerPaymentStep
  | SupplierPaymentStep;

export interface ResolutionState {
  rawQuery: string;
  resolvedProductId: string | null;
  resolvedProductName: string | null;
  suggestedProducts: Array<{ id: string; name: string }>;
}

export interface TransactionState {
  transactionType: TransactionType;
  currentStep: FlowStep;
  resolvedProducts: ResolutionState[];
  quantity: number | null;
  unitPrice: number | null;
  totalAmount: number | null;
  paymentMethod: string | null;
  customerId: string | null;
  customerName: string | null;
  supplierId: string | null;
  supplierName: string | null;
  branchId: string | null;
  staffId: string | null;
  businessId: string;
  userId: string;
  confirmed: boolean;
  error: string | null;
}

export function createInitialState(
  transactionType: TransactionType,
  businessId: string,
  userId: string,
  staffId?: string,
): TransactionState {
  return {
    transactionType,
    currentStep: "awaiting_product",
    resolvedProducts: [],
    quantity: null,
    unitPrice: null,
    totalAmount: null,
    paymentMethod: null,
    customerId: null,
    customerName: null,
    supplierId: null,
    supplierName: null,
    branchId: null,
    staffId: staffId || null,
    businessId,
    userId,
    confirmed: false,
    error: null,
  };
}

export function getStepQuestion(state: TransactionState): string {
  const productName = state.resolvedProducts[0]?.resolvedProductName || "bidhaa";

  switch (state.currentStep) {
    case "awaiting_product":
      return "Umeuza bidhaa gani?";
    case "awaiting_quantity":
      return `Umeuza kiasi gani cha ${productName}?`;
    case "awaiting_customer":
      return `Mteja ni nani? (jina au namba ya simu) — au sema "mteja wa dukani" kwa walk-in`;
    case "awaiting_payment_method":
      return `Njia ya malipo? (Cash, M-Pesa, Tigo Pesa, Airtel Money, Benki, Kadi)`;
    case "awaiting_cost":
      return `Umenunua ${productName} kwa bei gani kwa kila bidhaa?`;
    case "awaiting_supplier":
      return "Msambazaji ni nani?";
    case "confirming_sale":
      return `Thibitisha mauzo: ${state.quantity} x ${productName}${state.customerName ? ` kwa ${state.customerName}` : ""}${state.paymentMethod ? ` - ${state.paymentMethod}` : ""}. Ndio / Hapana?`;
    case "confirming_purchase":
      return `Thibitisha ununuzi: ${state.quantity} x ${productName} kwa TZS ${(state.unitPrice || 0).toLocaleString("sw-TZ")} kila moja${state.supplierName ? ` kutoka ${state.supplierName}` : ""}. Ndio / Hapana?`;
    default:
      return "Nikusaidie nini zaidi?";
  }
}

export function shouldSuggestProducts(step: FlowStep): boolean {
  return step === "awaiting_product";
}

export function isConfirming(step: FlowStep): boolean {
  return step.startsWith("confirming_");
}

export function isComplete(step: FlowStep): boolean {
  return step === "completed";
}
