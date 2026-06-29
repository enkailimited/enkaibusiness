import "server-only";

import { prisma } from "@/server/db";
import { parseCommand } from "../commands/command-parser";
import { toolRegistry } from "../tools/tool-registry";
import { checkPermission, requireOwnerOrPermission } from "../services/permission-service";
import { classifyExpense } from "../services/expense-classifier";
import { learnPattern } from "./memory-service";
import {
  getOrCreateWorkflow,
  saveWorkflowStep,
  setWorkflowParam,
  completeWorkflow,
  failWorkflow,
  validateWorkflow,
  executeWorkflow,
  getActiveWorkflow,
} from "../services/workflow-persistence";
import { resolveProduct } from "../tools/product-resolver";
import { logAiAction, resolveVocabulary, summarizeConversation } from "../services/ai-logger";
import type { AssistantContext } from "../assistant/types";

export interface BrainRequest {
  input: string;
  context: AssistantContext;
  pageContext?: {
    page: string;
    entityId?: string;
    entityType?: string;
  };
}

export interface BrainResponse {
  message: string;
  data?: Record<string, unknown>;
  workflow?: string;
  step?: string;
  requiresConfirmation?: boolean;
  confirmationKey?: string;
}

const pendingConfirmations = new Map<string, { intent: string; params: Record<string, unknown>; context: AssistantContext }>();

const CONFIRMATION_YES = /^(ndio|ndiyo|yes|yeah|yep|confirm|thibitisha|sawa|poa|endelea|continue)/i;
const CONFIRMATION_NO = /^(hapana|no|nope|cancel|ghairi|sitaki|acha|stop)/i;

const CONVERSATIONAL_GREETINGS = [
  /^(hello|hi|hey|hujambo|habari|salama|mambo|vipi|jambo)/i,
  /^(good\s*(morning|afternoon|evening)|habari\s+(ya\s+)?(asubuhi|mchana|jioni))/i,
  /^(nzuri|safi|poa|fresh)/i,
];

const CONVERSATIONAL_FAREWELLS = [
  /^(bye|goodbye|kwaheri|baadaye|tutaonana|nimeondoka)/i,
];

const CONVERSATIONAL_PERSONAL = [
  /^(how\s+are\s+you|u[ae]po\s?je|poa\??|safi\??)/i,
  /^(nzima|nzuri|safi|poa)\s+(asante|sana)?/i,
  /^(nimechoka|nina\s+?uchovu|tired|ninaumwa)/i,
  /^asante\s+|thank/i,
];

const CONVERSATIONAL_BUSINESS = [
  /(sold\s+(many|a\s+lot|some)|mauzo\s+(ni\s+)?mazuri|biashara\s+(iko|inaendelea)\s+sawa)/i,
  /(purchased|bought|ordered|stock)\s+(many|some|new|a\s+lot)/i,
  /(profit|faida|hasara|loss|gharama|expense)/i,
  /(customer|mteja|wananunua|wanunuzi)/i,
  /(supplier|msambazaji|deni|debt)/i,
];

function detectConversationType(input: string): "greeting" | "farewell" | "personal" | "business_talk" | "thanks" | null {
  if (CONVERSATIONAL_GREETINGS.some((r) => r.test(input.trim()))) return "greeting";
  if (CONVERSATIONAL_FAREWELLS.some((r) => r.test(input.trim()))) return "farewell";
  if (CONVERSATIONAL_PERSONAL.some((r) => r.test(input.trim()))) return "personal";
  if (CONVERSATIONAL_BUSINESS.some((r) => r.test(input.trim()))) return "business_talk";
  if (/^(asante|thank)/i.test(input.trim())) return "thanks";
  return null;
}

function conversationalResponse(type: string, input: string): string | null {
  switch (type) {
    case "greeting":
      return "Habari! Mimi ni Firdaus, msaidizi wako wa biashara. Nikusaidie nini leo?";
    case "farewell":
      return "Kwaheri! Nakutakia siku njema. Kama utahitaji msaada, nipo hapa.";
    case "personal": {
      if (/tired|nimechoka|uchovu/i.test(input)) return "Pumzika kidogo. Biashara inaweza kungoja, afya yako ni muhimu zaidi. Nikusaidie kurahisisha kazi zako?";
      if (/how\s+are\s+you|u[ae]po\s?je|poa/i.test(input)) return "Nipo vizuri, asante! Niko tayari kukusaidia na shughuli za biashara yako.";
      return "Nipo hapa kukusaidia. Unachotaka kufanya leo?";
    }
    case "business_talk": {
      if (/sold|mauzo|nimeuza/i.test(input)) return "Hongera! Mauzo mazuri yanaonyesha biashara inaendelea vizuri. Ningekusaidia kuangalia ripoti ya mauzo ya leo?";
      if (/purchased|bought|ordered|stock|nimenunua/i.test(input)) return "Umewekeza tena kwenye stock. Ningekusaidia kuangalia gharama za ununuzi au ripoti ya stock?";
      if (/profit|faida/i.test(input)) return "Faida ni kiashiria muhimu cha afya ya biashara. Nikuangalie ripoti ya faida kwa mwezi huu?";
      if (/loss|hasara/i.test(input)) return "Pole kwa hasara. Ningekusaidia kuchambua gharama au kupunguza expenses?";
      if (/gharama|expense/i.test(input)) return "Gharama zinaweza kuathiri faida. Ningekusaidia kuangalia muhtasari wa gharama au kubaini njia za kupunguza?";
      if (/customer|mteja|wananunua/i.test(input)) return "Wateja ni msingi wa biashara. Ningekusaidia kuangalia ripoti ya wateja au wateja walio na deni?";
      return "Nimekuelewa. Ningekusaidia kwa takwimu za biashara yako leo?";
    }
    case "thanks":
      return "Karibu! Iko wakati wowote unapohitaji msaada, nipo haapa.";
    default:
      return null;
  }
}

export async function processWithBrain(req: BrainRequest): Promise<BrainResponse> {
  const startTime = Date.now();
  const { input, context, pageContext } = req;
  const businessId = context.businessId || "";
  const userId = context.userId || "";
  const mode = context.mode || "generic";

  // Helper to log and return
  const respond = async (resp: BrainResponse, intent: string, resolvedProducts?: string[]) => {
    const duration = Date.now() - startTime;
    await logAiAction({
      userId,
      businessId,
      intent,
      input,
      response: resp.message,
      success: true,
      durationMs: duration,
      resolvedProductIds: resolvedProducts,
      posFlowSteps: [],
    });
    return resp;
  };

  if (mode === "platform") {
    const resp = await handlePlatformRequest(input, userId, pageContext);
    return respond(resp, "platform");
  }

  if (!businessId && userId) {
    const userBiz = await prisma.userRole.findFirst({
      where: { userId },
      select: { businessId: true },
    });
    if (userBiz?.businessId) {
      context.businessId = userBiz.businessId;
      return processWithBrain({ ...req, context });
    }
  }

  // Natural conversation (no business context)
  if (!businessId && userId) {
    const convType = detectConversationType(input);
    if (convType) {
      const reply = conversationalResponse(convType, input);
      if (reply) return respond({ message: reply }, "conversation");
    }
    return respond({
      message: "Mimi ni Firdaus, msaidizi wako wa biashara. Ninaweza kukusaidia kuona ripoti, kuangalia stock, kurekodi mauzo, na mengine mengi. Tafadhali nenda kwenye ukurasa wa biashara yako, kisha niite kwa kusema Dausi nikusaidie.",
    }, "help");
  }

  if (!businessId) {
    return respond({
      message: "Samahani, siwezi kukusaidia kwa sasa kwa sababu huna biashara iliyosajiliwa. Tafadhali wasiliana na msimamizi wako au anzisha biashara kwanza.",
    }, "no_business");
  }

  // — Business context available —

  // 0. Check for pending confirmation
  const confirmKey = `${businessId}_${userId}`;
  const pendingConfirm = pendingConfirmations.get(confirmKey);
  if (pendingConfirm) {
    if (CONFIRMATION_YES.test(input.trim())) {
      pendingConfirmations.delete(confirmKey);
      const hasPerm = await requireOwnerOrPermission(userId, businessId, pendingConfirm.intent);
      if (hasPerm.allowed) {
        const parsed = parseCommand(pendingConfirm.params.input as string);
        parsed.intent = pendingConfirm.intent as any;
        parsed.params = { ...parsed.params, ...pendingConfirm.params, confirmed: "true" };
        const resp = await routeIntent(parsed, pendingConfirm.context, pageContext);
        const prod: string[] = [];
        if (resp.data?.resolvedProductName) prod.push(resp.data.resolvedProductName as string);
        return respond(resp, pendingConfirm.intent, prod);
      }
      return respond({ message: "Huna ruhusa ya kufanya operesheni hiyo." }, "no_permission");
    }
    if (CONFIRMATION_NO.test(input.trim())) {
      pendingConfirmations.delete(confirmKey);
      return respond({ message: "Sawa, nimeghairi operesheni hiyo. Unahitaji msaada mwingine?" }, "cancelled");
    }
  }

  // 1. Check for active workflow
  const activeWf = await getActiveWorkflow(businessId, userId);
  if (activeWf && activeWf.status !== "COMPLETED") {
    const resp = await handleActiveWorkflow(activeWf, input, context);
    return respond(resp, "workflow_continue");
  }

  // 2. Try vocabulary resolution (learned business phrases)
  const vocabIntent = await resolveVocabulary(businessId, input);
  if (vocabIntent) {
    const parsed = parseCommand(input);
    parsed.intent = vocabIntent as any;
    const hasPerm = await requireOwnerOrPermission(userId, businessId, parsed.intent);
    if (hasPerm.allowed) {
      const resp = await routeIntent(parsed, context, pageContext);
      if (resp.requiresConfirmation && resp.confirmationKey) {
        pendingConfirmations.set(confirmKey, { intent: vocabIntent, params: { ...parsed.params, input }, context });
        return respond(resp, vocabIntent);
      }
      return respond(resp, vocabIntent);
    }
  }

  // 3. Parse command
  const parsed = parseCommand(input);

  // 4. Natural conversation check
  if (parsed.intent === "unknown") {
    const convType = detectConversationType(input);
    if (convType) {
      const reply = conversationalResponse(convType, input);
      if (reply) return respond({ message: reply }, "conversation");
    }

    const dbWf = await getActiveWorkflow(businessId, userId);
    if (dbWf) return respond(await handleActiveWorkflow(dbWf, input, context), "workflow_continue");

    return respond({
      message: "Samahani, sikuelewa. Tafadhali sema tena au tumia maneno kama: nimeuza, nimenunua, nimelipa, stock, au ripoti.",
    }, "unknown");
  }

  // 5. Permission check
  const hasPerm = await requireOwnerOrPermission(userId, businessId, parsed.intent);
  if (!hasPerm.allowed) {
    return respond({
      message: "Samahani, huna ruhusa ya kufanya operesheni hiyo. Tafadhali wasiliana na msimamizi wa mfumo.",
    }, "no_permission");
  }

  // 6. Route to handler
  const response = await routeIntent(parsed, context, pageContext);

  // 6b. If requires confirmation, store pending and return
  if (response.requiresConfirmation) {
    pendingConfirmations.set(confirmKey, { intent: parsed.intent, params: { ...parsed.params, input }, context });
    return respond(response, parsed.intent);
  }

  // 7. Enhanced logging with product resolution info
  const resolvedProducts: string[] = [];
  if (response.data?.resolvedProductName) {
    resolvedProducts.push(response.data.resolvedProductName as string);
  }
  if (response.data?.resolvedProductId) {
    resolvedProducts.push(response.data.resolvedProductId as string);
  }

  // 8. Learning from successful operations
  if (response.message.includes("✓") || response.message.includes("yamekamilika") || response.message.includes("zimekamilika") || response.message.includes("imerekodiwa")) {
    try {
      if (parsed.params.item) {
        await learnPattern(businessId, "POPULAR_PRODUCT", String(parsed.params.item), String(parsed.params.item));
      }
      if (parsed.params.customer) {
        await learnPattern(businessId, "TOP_CUSTOMER", String(parsed.params.customer), String(parsed.params.customer));
      }
      if (parsed.params.supplier) {
        await learnPattern(businessId, "PREFERRED_SUPPLIER", String(parsed.params.supplier), String(parsed.params.supplier));
      }
      if (parsed.params.payment_method) {
        await learnPattern(businessId, "PAYMENT_METHOD", String(parsed.params.payment_method), String(parsed.params.payment_method));
      }
    } catch {}
  }

  // 9. Summarize conversation periodically
  try {
    const messages = (global as any).__firdausMessages?.[userId] || [];
    await summarizeConversation(businessId, userId, messages);
  } catch {}

  return respond(response, parsed.intent, resolvedProducts);
}

async function routeIntent(
  parsed: ReturnType<typeof parseCommand>,
  context: AssistantContext,
  pageContext?: BrainRequest["pageContext"],
): Promise<BrainResponse> {
  switch (parsed.intent) {
    case "sell":
      return handleSalesIntent(parsed.params, context, pageContext);
    case "add-purchase":
      return handlePurchaseIntent(parsed.params, context);
    case "receive-goods":
      return handleReceiveGoodsIntent(parsed.params, context);
    case "receive-payment":
      return handleReceivePaymentIntent(parsed.params, context);
    case "pay-supplier":
      return handlePaySupplierIntent(parsed.params, context);
    case "add-expense":
      return handleExpenseIntent(parsed.params, context);
    case "check-stock":
      return handleStockIntent(parsed.params, context, pageContext);
    case "transfer-stock":
      return handleTransferIntent(parsed.params, context);
    default:
      return handleGenericIntent(parsed, context);
  }
}

async function handleActiveWorkflow(
  wf: Awaited<ReturnType<typeof getActiveWorkflow>>,
  input: string,
  context: AssistantContext,
): Promise<BrainResponse> {
  if (!wf) {
    return { message: "Samahani, siwezi kupata workflow inayoendelea." };
  }

  const businessId = context.businessId || "";

  // Try to extract a value from the input
  const value = input.trim();
  const key = wf.currentStep?.replace("awaiting_", "") || "";

  if (key && value) {
    await setWorkflowParam(wf.id, key, value);
  }

  // Advance the workflow
  const sequence = getSequence(wf.type);
  if (!sequence) {
    await failWorkflow(wf.id, "Unknown workflow type");
    return { message: "Samahani, aina hii ya workflow haijatambulika." };
  }

  const currentIdx = sequence.indexOf(wf.currentStep);
  if (currentIdx === -1 || currentIdx >= sequence.length - 1) {
    // Complete — execute
    await validateWorkflow(wf.id);
    const updatedWf = await getOrCreateWorkflow(businessId, context.userId, wf.type);
    const collectedData = updatedWf.collectedData;

    try {
      await executeWorkflow(wf.id);
      const result = await executeCollectedWorkflow(wf.type, collectedData, context);
      await completeWorkflow(wf.id);

      // Learn patterns from completed workflow
      try {
        if (collectedData.product) await learnPattern(businessId, "POPULAR_PRODUCT", String(collectedData.product), String(collectedData.product));
        if (collectedData.customer) await learnPattern(businessId, "TOP_CUSTOMER", String(collectedData.customer), String(collectedData.customer));
        if (collectedData.supplier) await learnPattern(businessId, "PREFERRED_SUPPLIER", String(collectedData.supplier), String(collectedData.supplier));
        if (collectedData.payment_method) await learnPattern(businessId, "PAYMENT_METHOD", String(collectedData.payment_method), String(collectedData.payment_method));
      } catch {}

      return { message: result.message, data: result.data };
    } catch (err) {
      await failWorkflow(wf.id, err instanceof Error ? err.message : "Execution failed");
      return { message: `Samahani, tatizo limetokea wakati wa kutekeleza: ${err instanceof Error ? err.message : "Tatizo la mfumo"}. Tafadhali jaribu tena.` };
    }
  }

  // Advance to next step
  const nextStep = sequence[currentIdx + 1] || "completed";
  const nextStatus = currentIdx >= sequence.length - 2 ? "VALIDATING" : "COLLECTING_DATA";
  await saveWorkflowStep(wf.id, nextStep, nextStatus);

  if (nextStep === "completed" || nextStatus === "VALIDATING") {
    await validateWorkflow(wf.id);
    return handleActiveWorkflow(await getActiveWorkflow(businessId, context.userId), "", context);
  }

  const question = getQuestionForStep(nextStep);
  return {
    message: question || "Nikusaidie nini zaidi?",
    workflow: wf.type,
    step: nextStep,
  };
}

function getSequence(type: string): string[] | null {
  const sequences: Record<string, string[]> = {
    sales: ["awaiting_product", "awaiting_quantity", "awaiting_customer", "awaiting_payment_method", "completed"],
    purchases: ["awaiting_supplier_item", "awaiting_supplier_quantity", "awaiting_supplier_cost", "awaiting_supplier", "completed"],
    receiving: ["awaiting_product", "awaiting_quantity", "awaiting_supplier", "completed"],
    customer_payment: ["awaiting_customer", "awaiting_amount", "completed"],
    supplier_payment: ["awaiting_supplier", "awaiting_amount", "completed"],
    expenses: ["awaiting_description", "awaiting_category", "awaiting_price", "completed"],
    inventory: ["awaiting_product", "awaiting_from_location", "awaiting_to_location", "awaiting_quantity", "completed"],
    business_setup: ["awaiting_business_name", "awaiting_business_type", "awaiting_branch_name", "completed"],
  };
  return sequences[type] || null;
}

function getQuestionForStep(step: string): string {
  const questions: Record<string, string> = {
    awaiting_product: "Bidhaa gani?",
    awaiting_quantity: "Kiasi gani?",
    awaiting_price: "Bei gani?",
    awaiting_payment_method: "Njia ya malipo? (Cash, M-Pesa, Tigo Pesa, Airtel Money, Benki, Kadi)",
    awaiting_customer: "Mteja ni nani?",
    awaiting_store: "Duka gani?",
    awaiting_supplier: "Msambazaji gani?",
    awaiting_supplier_item: "Bidhaa gani?",
    awaiting_supplier_quantity: "Umenunua kiasi gani?",
    awaiting_supplier_cost: "Umenunua kwa bei gani kwa kila bidhaa?",
    awaiting_amount: "Kiasi gani?",
    awaiting_description: "Gharama hii ni ya nini? (mf: mafuta, usafiri, internet, umeme, kodi)",
    awaiting_category: "Aina ya gharama?",
    awaiting_from_location: "Sehemu ya kutoka?",
    awaiting_to_location: "Sehemu ya kwenda?",
  };
  return questions[step] || "Tafadhali toa maelezo zaidi.";
}

async function executeCollectedWorkflow(
  type: string,
  data: Record<string, unknown>,
  context: AssistantContext,
): Promise<{ message: string; data?: Record<string, unknown> }> {
  const businessId = context.businessId || "";

  switch (type) {
    case "sales": {
      const productName = String(data.product || data.supplier_item || "");
      const { matches } = await resolveProduct(productName, businessId);
      const resolved = matches[0]?.product;
      return toolRegistry.execute("sell", {
        item: resolved?.name || productName,
        itemId: resolved?.id,
        quantity: Number(data.quantity),
        payment_method: data.payment_method,
        customer: data.customer,
        businessId,
        staffId: context.staffId,
      });
    }
    case "purchases": {
      const productName = String(data.supplier_item || data.product || "");
      const { matches } = await resolveProduct(productName, businessId);
      const resolved = matches[0]?.product;
      return toolRegistry.execute("add-purchase", {
        item: resolved?.name || productName,
        itemId: resolved?.id,
        quantity: Number(data.supplier_quantity || data.quantity),
        cost: Number(data.supplier_cost || data.price || 0),
        supplier: data.supplier,
        businessId,
      });
    }
    case "receiving": {
      const productName = String(data.product || "");
      const { matches } = await resolveProduct(productName, businessId);
      const resolved = matches[0]?.product;
      return toolRegistry.execute("add-purchase", {
        item: resolved?.name || productName,
        itemId: resolved?.id,
        quantity: Number(data.quantity),
        cost: 0,
        supplier: data.supplier,
        businessId,
      });
    }
    case "expenses":
      return toolRegistry.execute("add-expense", {
        amount: Number(data.price || data.amount),
        description: data.description,
        category: data.category,
        businessId,
      });
    case "inventory":
      return toolRegistry.execute("transfer-stock", {
        item: data.product,
        quantity: Number(data.quantity),
        from: data.from_location,
        to: data.to_location,
        businessId,
      });
    default:
      return { message: "Workflow imekamilika." };
  }
}

export { handleSalesIntent, handlePurchaseIntent, handleExpenseIntent, handleStockIntent, handleTransferIntent, handleGenericIntent, handleReceiveGoodsIntent, handleReceivePaymentIntent, handlePaySupplierIntent };

async function handleSalesIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
  pageContext?: BrainRequest["pageContext"],
): Promise<BrainResponse> {
  const businessId = context.businessId || "";
  const productRaw = (params.item || (pageContext?.entityType === "product" ? pageContext?.entityId : undefined)) as string | undefined;
  const quantity = params.quantity as number | undefined;
  const paymentMethod = params.payment_method as string | undefined;
  const customerName = params.customer as string | undefined;
  const staffId = context.staffId;

  // Step 1: Resolve product if provided
  if (productRaw) {
    const { matches, exact } = await resolveProduct(productRaw, businessId);

    if (exact) {
      // Product resolved — check quantity
      if (!quantity) {
        return {
          message: `Umeuza kiasi gani cha ${exact.name}? (Stock: ${exact.stockOnHand})`,
          workflow: "sales",
          step: "awaiting_quantity",
          data: { resolvedProductId: exact.id, resolvedProductName: exact.name },
        };
      }

      // Check stock
      if (exact.stockOnHand < quantity) {
        return {
          message: `Samahani, stock ya ${exact.name} haitoshi. Zimebaki ${exact.stockOnHand} tu. Tafadhali rekodi idadi sahihi.`,
          workflow: "sales",
          step: "awaiting_quantity",
          data: { resolvedProductId: exact.id, resolvedProductName: exact.name, maxQuantity: exact.stockOnHand },
        };
      }

      // Check payment method
      if (!paymentMethod) {
        return {
          message: `Umeuza ${quantity} x ${exact.name} kwa TZS ${(quantity * exact.price).toLocaleString("sw-TZ")}. Njia ya malipo? (Cash, M-Pesa, Tigo Pesa, Airtel Money, Benki, Kadi)`,
          workflow: "sales",
          step: "awaiting_payment_method",
          data: { resolvedProductId: exact.id, resolvedProductName: exact.name, quantity, total: quantity * exact.price },
        };
      }

      // All info collected — confirm before execution
      if (params.confirmed !== "true") {
        return {
          message: `Tafadhali thibitisha:\n${quantity} x ${exact.name} = TZS ${(quantity * exact.price).toLocaleString("sw-TZ")}\nMalipo: ${paymentMethod}${customerName ? `\nMteja: ${customerName}` : ""}\n\nNdio / Hapana?`,
          requiresConfirmation: true,
          confirmationKey: "sell",
          data: { resolvedProductId: exact.id, resolvedProductName: exact.name, quantity, total: quantity * exact.price },
        };
      }

      const result = await toolRegistry.execute("sell", {
        item: exact.name,
        itemId: exact.id,
        quantity,
        price: exact.price,
        payment_method: paymentMethod,
        customer: customerName,
        businessId,
        staffId,
      });

      if (result.success) {
        await learnPattern(businessId, "POPULAR_PRODUCT", exact.name, exact.name);
        if (customerName) await learnPattern(businessId, "TOP_CUSTOMER", customerName, customerName);
        if (paymentMethod) await learnPattern(businessId, "PAYMENT_METHOD", paymentMethod, paymentMethod);

        return {
          message: `✓ Mauzo yamekamilika!\n${quantity} x ${exact.name} = TZS ${(quantity * exact.price).toLocaleString("sw-TZ")}\nMalipo: ${paymentMethod}${customerName ? `\nMteja: ${customerName}` : ""}`,
          data: result.data,
        };
      }
      return { message: result.message };
    }

    // No exact match — suggest products
    if (matches.length > 0) {
      const suggestions = matches.slice(0, 5).map((m, i) => `  ${i + 1}. ${m.product.name}${m.product.sku ? ` (${m.product.sku})` : ""}`).join("\n");
      return {
        message: `Nimekuta bidhaa hizi zinazofanana na "${productRaw}":\n${suggestions}\n\nTafadhali chagua namba au jina sahihi la bidhaa.`,
        workflow: "sales",
        step: "awaiting_product",
        data: { searchQuery: productRaw, suggestions: matches.map((m) => ({ id: m.product.id, name: m.product.name })) },
      };
    }
  }

  // No product at all — ask
  const recentProducts = await prisma.catalogItem.findMany({
    where: { businessId, isActive: true, balances: { some: { quantityOnHand: { gt: 0 } } } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { name: true },
  });

  const suggestions = recentProducts.map((p) => p.name).join(", ");
  return {
    message: `Umeuza bidhaa gani?${suggestions ? `\n\nBidhaa zilizopo: ${suggestions}` : ""}`,
    workflow: "sales",
    step: "awaiting_product",
  };
}

async function handlePurchaseIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const businessId = context.businessId || "";
  const item = params.item as string | undefined;
  const quantity = params.quantity as number | undefined;
  const cost = params.cost as number | undefined;
  const supplierName = params.supplier as string | undefined;

  // Step 1: Resolve product if provided
  if (item) {
    const { matches, exact } = await resolveProduct(item, businessId);

    if (!exact && matches.length > 0) {
      const suggestions = matches.slice(0, 5).map((m, i) => `  ${i + 1}. ${m.product.name}${m.product.sku ? ` (${m.product.sku})` : ""}`).join("\n");
      return {
        message: `Nimekuta bidhaa hizi zinazofanana na "${item}":\n${suggestions}\n\nTafadhali chagua namba au jina sahihi.`,
        workflow: "purchases",
        step: "awaiting_supplier_item",
        data: { searchQuery: item, suggestions: matches.map((m) => ({ id: m.product.id, name: m.product.name })) },
      };
    }

    const productName = exact?.name || item;

    if (!quantity) {
      return { message: `Umenunua kiasi gani cha ${productName}?`, workflow: "purchases", step: "awaiting_supplier_quantity" };
    }
    if (!cost) {
      return { message: `Umenunua ${productName} kwa bei gani kwa kila bidhaa?`, workflow: "purchases", step: "awaiting_supplier_cost" };
    }

    // Confirm before execution
    if (params.confirmed !== "true") {
      return {
        message: `Tafadhali thibitisha ununuzi:\n${quantity} x ${productName} = TZS ${(quantity * (cost || 0)).toLocaleString("sw-TZ")}${supplierName ? `\nMsambazaji: ${supplierName}` : ""}\n\nNdio / Hapana?`,
        requiresConfirmation: true,
        confirmationKey: "add-purchase",
        data: { item: productName, itemId: exact?.id, quantity, cost, supplier: supplierName },
      };
    }

    const result = await toolRegistry.execute("add-purchase", {
      item: productName,
      itemId: exact?.id,
      quantity,
      cost,
      supplier: supplierName,
      businessId,
    });

    if (result.success) {
      await learnPattern(businessId, "POPULAR_PRODUCT", productName, productName);
      if (supplierName) await learnPattern(businessId, "PREFERRED_SUPPLIER", supplierName, supplierName);
    }

    return { message: result.message, data: result.data };
  }

  return { message: "Umenunua bidhaa gani?", workflow: "purchases", step: "awaiting_supplier_item" };
}

async function handleExpenseIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const amount = params.amount as number | undefined;
  const description = params.description as string | undefined;

  if (!amount) return { message: "Gharama ni kiasi gani?", workflow: "expenses", step: "awaiting_price" };
  if (!description) return { message: "Gharama hii ni ya nini? (mf: mafuta, usafiri, umeme, kodi, mshahara, matangazo)", workflow: "expenses", step: "awaiting_description" };

  const classification = classifyExpense(description);
  if (classification.isProcurementRelated && classification.suggestedCostAllocation) {
    return {
      message: `Gharama hii inahusiana na ununuzi (${classification.suggestedCostAllocation.description}).\nKiasi: ${amount}\nUnataka niweke gharama hii kwenye gharama za bidhaa? (ndio/hapana)`,
      data: { amount, description, classification, pendingAllocation: true },
      workflow: "expenses",
      step: "awaiting_confirmation",
    };
  }

  // Confirm before recording expense
  if (params.confirmed !== "true") {
    return {
      message: `Tafadhali thibitisha gharama:\nAina: ${classification.category}\nMaelezo: ${description}\nKiasi: TZS ${Number(amount).toLocaleString("sw-TZ")}\n\nNdio / Hapana?`,
      requiresConfirmation: true,
      confirmationKey: "add-expense",
      data: { amount, description, category: classification.category },
    };
  }

  const result = await toolRegistry.execute("add-expense", {
    amount, description,
    category: classification.category,
    businessId: context.businessId,
  });
  return { message: result.message, data: { ...result.data, classification } };
}

async function handleStockIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
  pageContext?: BrainRequest["pageContext"],
): Promise<BrainResponse> {
  const item = (params.item || pageContext?.entityType === "product" ? pageContext?.entityId : undefined) as string | undefined;
  if (!item) return { message: "Stock ya bidhaa gani?", workflow: "inventory", step: "awaiting_product" };

  const result = await toolRegistry.execute("check-stock", { item, businessId: context.businessId });
  return { message: result.message, data: result.data };
}

async function handleTransferIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const item = params.item as string | undefined;
  const quantity = params.quantity as number | undefined;
  const from = params.from as string | undefined;
  const to = params.to as string | undefined;

  if (!item) return { message: "Bidhaa gani?", workflow: "inventory", step: "awaiting_product" };
  if (!from) return { message: "Sehemu ya kutoka?", workflow: "inventory", step: "awaiting_from_location" };
  if (!to) return { message: "Sehemu ya kwenda?", workflow: "inventory", step: "awaiting_to_location" };
  if (!quantity) return { message: `Kiasi gani cha ${item}?`, workflow: "inventory", step: "awaiting_quantity" };

  const result = await toolRegistry.execute("transfer-stock", {
    item, quantity, from, to,
    businessId: context.businessId,
  });
  return { message: result.message, data: result.data };
}

async function handleReceiveGoodsIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const businessId = context.businessId || "";
  const item = params.item as string | undefined;
  const quantity = params.quantity as number | undefined;
  const supplierName = params.supplier as string | undefined;

  if (item) {
    const { matches, exact } = await resolveProduct(item, businessId);

    if (!exact && matches.length > 0) {
      const suggestions = matches.slice(0, 5).map((m, i) => `  ${i + 1}. ${m.product.name}`).join("\n");
      return {
        message: `Nimekuta bidhaa hizi zinazofanana:\n${suggestions}\n\nTafadhali chagua bidhaa sahihi.`,
        workflow: "receiving",
        step: "awaiting_product",
        data: { suggestions: matches.map((m) => ({ id: m.product.id, name: m.product.name })) },
      };
    }

    const productName = exact?.name || item;

    if (!quantity) {
      return { message: `Umepokea kiasi gani cha ${productName}?`, workflow: "receiving", step: "awaiting_quantity" };
    }
    if (!supplierName) {
      return { message: `Umepokea ${quantity} x ${productName} kutoka kwa msambazaji gani?`, workflow: "receiving", step: "awaiting_supplier" };
    }

    // Confirm receipt before execution
    if (params.confirmed !== "true") {
      return {
        message: `Tafadhali thibitisha upokeaji:\n${quantity} x ${productName}${supplierName ? `\nKutoka: ${supplierName}` : ""}\n\nNdio / Hapana?`,
        requiresConfirmation: true,
        confirmationKey: "receive-goods",
        data: { item: productName, itemId: exact?.id, quantity, supplier: supplierName },
      };
    }

    const result = await toolRegistry.execute("add-purchase", {
      item: productName,
      itemId: exact?.id,
      quantity,
      cost: 0,
      supplier: supplierName,
      businessId,
    });

    if (result.success) {
      await learnPattern(businessId, "POPULAR_PRODUCT", productName, productName);
      if (supplierName) await learnPattern(businessId, "PREFERRED_SUPPLIER", supplierName, supplierName);
    }

    return {
      message: `✓ Mzigo umepokelewa!\n${quantity} x ${productName}${supplierName ? ` kutoka ${supplierName}` : ""}\nStock imeongezwa.`,
      data: result.data,
    };
  }

  return { message: "Umepokea bidhaa gani?", workflow: "receiving", step: "awaiting_product" };
}

async function handleReceivePaymentIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const businessId = context.businessId || "";
  const customerName = params.customer as string | undefined;
  const amount = params.amount as number | undefined;

  if (!customerName) {
    return { message: "Mteja aliyelipa ni nani?", workflow: "customer_payment", step: "awaiting_customer" };
  }

  // Find customer
  const customer = await prisma.customer.findFirst({
    where: {
      businessId,
      OR: [
        { firstName: { contains: customerName, mode: "insensitive" } },
        { lastName: { contains: customerName, mode: "insensitive" } },
        { phone: { contains: customerName } },
      ],
    },
    include: { creditAccount: true },
  });

  if (!customer) {
    return { message: `Samahani, sikumpata mteja "${customerName}". Tafadhali toa jina kamili au namba ya simu.`, workflow: "customer_payment", step: "awaiting_customer" };
  }

  const customerFullName = `${customer.firstName} ${customer.lastName || ""}`.trim();
  const outstanding = customer.creditAccount ? Number(customer.creditAccount.currentBalance) : 0;

  if (!amount) {
    return {
      message: `${customerFullName} amelipa kiasi gani?${outstanding > 0 ? ` Deni lake ni TZS ${outstanding.toLocaleString("sw-TZ")}` : ""}`,
      workflow: "customer_payment",
      step: "awaiting_amount",
      data: { customerId: customer.id, customerName: customerFullName, outstanding },
    };
  }

  // Confirm before recording payment
  if (params.confirmed !== "true") {
    return {
      message: `Tafadhali thibitisha malipo:\nMteja: ${customerFullName}\nKiasi: TZS ${amount.toLocaleString("sw-TZ")}${outstanding > 0 ? `\nDeni: TZS ${outstanding.toLocaleString("sw-TZ")}` : ""}\n\nNdio / Hapana?`,
      requiresConfirmation: true,
      confirmationKey: "receive-payment",
      data: { customerId: customer.id, customerName: customerFullName, amount, outstanding },
    };
  }

  // Record payment
  if (customer.creditAccount && outstanding > 0) {
    await prisma.customerCreditAccount.update({
      where: { id: customer.creditAccount.id },
      data: { currentBalance: { decrement: Math.min(amount, outstanding) } },
    });
  }

  await prisma.payment.create({
    data: {
      businessId,
      customerId: customer.id,
      amount,
      reference: `AI-PAY-${Date.now().toString(36).toUpperCase()}`,
      status: "completed",
      paidAt: new Date(),
      createdById: context.userId,
    },
  });

  await learnPattern(businessId, "TOP_CUSTOMER", customerFullName, customerFullName);

  return {
    message: `✓ Malipo yamepokelewa!\nMteja: ${customerFullName}\nKiasi: TZS ${amount.toLocaleString("sw-TZ")}${outstanding > 0 ? `\nDeni lililobaki: TZS ${Math.max(0, outstanding - amount).toLocaleString("sw-TZ")}` : ""}`,
    data: { customerId: customer.id, amount, remaining: Math.max(0, outstanding - amount) },
  };
}

async function handlePaySupplierIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const businessId = context.businessId || "";
  const supplierName = params.supplier as string | undefined;
  const amount = params.amount as number | undefined;

  if (!supplierName) {
    return { message: "Umemlipa msambazaji gani?", workflow: "supplier_payment", step: "awaiting_supplier" };
  }

  const supplier = await prisma.supplier.findFirst({
    where: {
      OR: [
        { name: { contains: supplierName, mode: "insensitive" } },
        { phone: { contains: supplierName } },
      ],
    },
  });

  if (!supplier) {
    return { message: `Samahani, sikumpata msambazaji "${supplierName}". Tafadhali toa jina kamili.`, workflow: "supplier_payment", step: "awaiting_supplier" };
  }

  if (!amount) {
    return { message: `Umemlipa ${supplier.name} kiasi gani?`, workflow: "supplier_payment", step: "awaiting_amount", data: { supplierId: supplier.id, supplierName: supplier.name } };
  }

  // Confirm before recording payment
  if (params.confirmed !== "true") {
    return {
      message: `Tafadhali thibitisha malipo kwa msambazaji:\nMsambazaji: ${supplier.name}\nKiasi: TZS ${amount.toLocaleString("sw-TZ")}\n\nNdio / Hapana?`,
      requiresConfirmation: true,
      confirmationKey: "pay-supplier",
      data: { supplierId: supplier.id, supplierName: supplier.name, amount },
    };
  }

  const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { workspaceId: true } });
  const expenseCat = await prisma.expenseCategory.findFirst({ where: { businessId } });

  await prisma.expense.create({
    data: {
      workspaceId: biz?.workspaceId || "",
      businessId,
      categoryId: expenseCat?.id || "",
      amount,
      description: `Malipo kwa msambazaji ${supplier.name}`,
      expenseDate: new Date(),
      status: "approved",
    },
  });

  return {
    message: `✓ Malipo kwa msambazaji yamekamilika!\nMsambazaji: ${supplier.name}\nKiasi: TZS ${amount.toLocaleString("sw-TZ")}`,
    data: { supplierId: supplier.id, amount },
  };
}

async function handleGenericIntent(
  parsed: ReturnType<typeof parseCommand>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const result = await toolRegistry.execute(parsed.intent, {
    ...parsed.params,
    businessId: context.businessId,
  });
  return { message: result.message, data: result.data };
}

async function handlePlatformRequest(
  input: string,
  _userId: string | undefined,
  pageContext?: BrainRequest["pageContext"],
): Promise<BrainResponse> {
  const lower = input.toLowerCase();

  // --- Sales-team context awareness ---
  if (pageContext?.page === "sales-team" || /timu.*mauzo|sales.?team|team|wanatimu|mwanatimu/.test(lower)) {
    const [profiles, pendingInvites] = await Promise.all([
      prisma.salesProfile.count(),
      prisma.userInvite.count({ where: { status: "PENDING" } }),
    ]);
    const hierarchies = await prisma.salesHierarchy.findMany({
      select: { title: true, _count: { select: { profiles: true } } },
      orderBy: { level: "asc" },
    });
    const hierarchySummary = hierarchies.map((h) => `  • ${h.title}: ${h._count.profiles}`).join("\n");

    return {
      message: `Timu ya Mauzo\nJumla ya wanatimu: ${profiles}\nMialiko inayosubiri: ${pendingInvites}\n\nNgazi:\n${hierarchySummary}\n\nUnaweza:\n  • Kuona timu yako - "timu yangu"\n  • Kuongeza mwanatimu - "ongeza mwanatimu"\n  • Kutuma mwaliko upya - "tuma mwaliko upya"\n  • Kuangalia mauzo ya timu - "mauzo ya timu"`,
    };
  }

  // --- Users ---
  if (/watumiaji|users?|watumiaji/.test(lower)) {
    const [total, active, inactive, recent] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { firstName: true, lastName: true, email: true, createdAt: true } }),
    ]);
    const list = recent.map((u) => `  • ${u.firstName} ${u.lastName} (${u.email})`).join("\n");
    return {
      message: `Jumla ya watumiaji: ${total}\nWanaotumia: ${active}\nWaliozuiwa: ${inactive}\n\nWatumiaji wapya 5:\n${list}`,
    };
  }

  // --- Businesses ---
  if (/biashara|businesses?|business/.test(lower)) {
    const [total, active, inactive] = await Promise.all([
      prisma.business.count(),
      prisma.business.count({ where: { isActive: true } }),
      prisma.business.count({ where: { isActive: false } }),
    ]);
    return { message: `Jumla ya biashara: ${total}\nZinazotumika: ${active}\nHazitumiki: ${inactive}` };
  }

  // --- Subscriptions ---
  if (/subscription|subscriptions|usajili|plan/.test(lower)) {
    const [total, active, expired, cancelled] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "EXPIRED" } }),
      prisma.subscription.count({ where: { status: "CANCELLED" } }),
    ]);
    return { message: `Jumla ya usajili: ${total}\nWanaoendelea: ${active}\nWameisha: ${expired}\nWameghairi: ${cancelled}` };
  }

  // --- Leads ---
  if (/leads?|lead|wateja watarajiwa/.test(lower)) {
    const [total, new_, contacted, converted] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.lead.count({ where: { status: "CONTACTED" } }),
      prisma.lead.count({ where: { status: "CONVERTED" } }),
    ]);
    return { message: `Jumla ya leads: ${total}\nMpya: ${new_}\nWamewasiliana: ${contacted}\nWamebadilishwa kuwa wateja: ${converted}` };
  }

  // --- Workspaces ---
  if (/workspace|workspaces|kazi/.test(lower)) {
    const total = await prisma.workspace.count();
    return { message: `Jumla ya workspaces: ${total}` };
  }

  // --- Sales (cross-business) ---
  if (/mauzo|sales?|selling|income/.test(lower)) {
    const [totalSales, totalRevenue] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.aggregate({ _sum: { grandTotal: true } }),
    ]);
    const revenue = totalRevenue._sum?.grandTotal?.toLocaleString() || "0";
    return { message: `Jumla ya mauzo yote: ${totalSales}\nMapato yote: Tsh ${revenue}` };
  }

  // --- Help / unknown ---
  const isOnSalesTeamPage = pageContext?.page === "sales-team";
  return {
    message: isOnSalesTeamPage
      ? "Mimi ni Firdaus, msaidizi wako wa timu ya mauzo. Ninaweza kukusaidia:\n"
        + "  • Timu yangu — kuona wanatimu wako\n"
        + "  • Ongeza mwanatimu — kumwalika mwanatimu mpya\n"
        + "  • Tuma mwaliko upya — kumtumia mwaliko tena mwanatimu\n"
        + "  • Mauzo ya timu — kuona mauzo ya timu yako\n\n"
        + "Unachotaka kufanya?"
      : "Mimi ni Firdaus, msaidizi wako wa mfumo. Ninaweza kukusaidia:\n"
        + "  • Watumiaji — takwimu za watumiaji wote\n"
        + "  • Biashara — takwimu za biashara zote\n"
        + "  • Subscription — hali ya usajili\n"
        + "  • Leads — wateja watarajiwa\n"
        + "  • Workspace — workspaces zote\n"
        + "  • Mauzo — mauzo ya biashara zote\n"
        + "  • Timu ya mauzo — takwimu za timu ya mauzo\n\n"
        + "Unachotaka kuona?",
  };
}


