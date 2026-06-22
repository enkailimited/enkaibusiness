import "server-only";

import { prisma } from "@/server/db";
import { parseCommand } from "../commands/command-parser";
import { toolRegistry } from "../tools/tool-registry";
import { workflowEngine } from "../services/workflow-engine";
import { checkPermission } from "../services/permission-service";
import { classifyExpense } from "../services/expense-classifier";
import { generateProactiveInsights } from "../services/proactive-insights";
import { getBusinessMemory, learnPattern } from "./memory-service";
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
}

const NEEDS_BUSINESS: string[] = [
  "sell", "create-sale", "check-stock", "check-price", "lookup-customer",
  "add-customer", "check-staff", "view-orders", "create-order", "view-report",
  "add-expense", "add-purchase", "lookup-supplier", "add-supplier",
  "transfer-stock", "adjust-stock", "check-wallet", "create-purchase-order",
  "create-quotation", "create-invoice", "create-return", "send-notification",
  "business-insights",
];

export async function processWithBrain(req: BrainRequest): Promise<BrainResponse> {
  const { input, context, pageContext } = req;
  const businessId = context.businessId || "";
  const userId = context.userId;
  const mode = context.mode || "generic";

  if (mode === "platform") {
    return handlePlatformRequest(input, userId, pageContext);
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

  if (!businessId) {
    const parsed = parseCommand(input);
    if (parsed.intent === "help" || parsed.intent === "unknown") {
      return {
        message: "Mimi ni Firdaus, msaidizi wako wa biashara. Ninaweza kukusaidia kuona ripoti, kuangalia stock, kurekodi mauzo, na mengine mengi. Tafadhali nenda kwenye ukurasa wa biashara yako, kisha niite kwa kusema Dausi nikusaidie.",
      };
    }
    if (parsed.intent === "setup-business") {
      return {
        message: "Ili kuanzisha biashara mpya, tafadhali nenda kwenye sehemu ya 'Setup' kwenye dashboard au wasiliana na msimamizi wa mfumo.",
      };
    }
    return {
      message: "Samahani, siwezi kukusaidia kwa sasa kwa sababu huna biashara iliyosajiliwa. Tafadhali wasiliana na msimamizi wako au anzisha biashara kwanza.",
    };
  }

  // Check for active persistent workflow
  const activeWf = await getActiveWorkflow(businessId, userId);
  if (activeWf && activeWf.status !== "COMPLETED") {
    return handleActiveWorkflow(activeWf, input, context);
  }

  const parsed = parseCommand(input);
  if (parsed.intent === "unknown") {
    const dbWf = await getActiveWorkflow(businessId, userId);
    if (dbWf) {
      return handleActiveWorkflow(dbWf, input, context);
    }
    return {
      message: "Samahani, sikuelewa. Tafadhali sema tena au tumia maneno kama: nimeuza, nimenunua, nimelipa, stock, au ripoti.",
    };
  }

  const hasPerm = await checkPermission(userId, businessId, parsed.intent);
  if (!hasPerm.allowed) {
    return {
      message: "Samahani, huna ruhusa ya kufanya operesheni hiyo. Tafadhali wasiliana na msimamizi wa mfumo.",
    };
  }

  let response: BrainResponse;

  switch (parsed.intent) {
    case "sell":
      response = await handleSalesIntent(parsed.params, context, pageContext);
      break;
    case "add-purchase":
      response = await handlePurchaseIntent(parsed.params, context);
      break;
    case "add-expense":
      response = await handleExpenseIntent(parsed.params, context);
      break;
    case "check-stock":
      response = await handleStockIntent(parsed.params, context, pageContext);
      break;
    case "transfer-stock":
      response = await handleTransferIntent(parsed.params, context);
      break;
    default:
      response = await handleGenericIntent(parsed, context);
  }

  await createAuditLog(context, parsed.intent, input, response.message);

  if (response.message.includes("yamekamilika") || response.message.includes("zimekamilika") || response.message.includes("imerekodiwa")) {
    try {
      if (parsed.params.item) {
        await learnPattern(businessId, "POPULAR_PRODUCT", String(parsed.params.item), String(parsed.params.item));
      }
      if (parsed.params.customer) {
        await learnPattern(businessId, "TOP_CUSTOMER", String(parsed.params.customer), String(parsed.params.customer));
      }
    } catch {}
  }

  return response;
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
    sales: ["awaiting_product", "awaiting_quantity", "awaiting_price", "awaiting_payment_method", "awaiting_customer", "awaiting_store", "completed"],
    purchases: ["awaiting_supplier", "awaiting_supplier_item", "awaiting_supplier_quantity", "awaiting_supplier_cost", "awaiting_payment_method", "completed"],
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
  switch (type) {
    case "sales":
      return toolRegistry.execute("sell", {
        item: data.product,
        quantity: Number(data.quantity),
        price: data.price ? Number(data.price) : undefined,
        customer: data.customer,
        store: data.store,
        paymentMethod: data.payment_method,
        businessId: context.businessId,
        staffId: context.staffId,
        cashierId: context.staffId,
      });
    case "purchases":
      return toolRegistry.execute("add-purchase", {
        item: data.supplier_item || data.product,
        quantity: Number(data.supplier_quantity || data.quantity),
        cost: Number(data.supplier_cost || data.price),
        supplier: data.supplier,
        paymentMethod: data.payment_method,
        businessId: context.businessId,
      });
    case "expenses":
      return toolRegistry.execute("add-expense", {
        amount: Number(data.price || data.amount),
        description: data.description,
        category: data.category,
        businessId: context.businessId,
      });
    case "inventory":
      return toolRegistry.execute("transfer-stock", {
        item: data.product,
        quantity: Number(data.quantity),
        from: data.from_location,
        to: data.to_location,
        businessId: context.businessId,
      });
    default:
      return { message: "Workflow imekamilika." };
  }
}

export { handleSalesIntent, handlePurchaseIntent, handleExpenseIntent, handleStockIntent, handleTransferIntent, handleGenericIntent, createAuditLog };

async function handleSalesIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
  pageContext?: BrainRequest["pageContext"],
): Promise<BrainResponse> {
  const product = (params.item || pageContext?.entityType === "product" ? pageContext?.entityId : undefined) as string | undefined;
  const quantity = params.quantity as number | undefined;

  if (!product) {
    return { message: "Umeuza bidhaa gani?", workflow: "sales", step: "awaiting_product" };
  }
  if (!quantity) {
    return { message: `Umeuza kiasi gani cha ${product}?`, workflow: "sales", step: "awaiting_quantity" };
  }

  const result = await toolRegistry.execute("sell", {
    item: product, quantity,
    businessId: context.businessId, staffId: context.staffId,
    customerId: params.customer as string,
  });

  if (result.success) {
    const memory = await getBusinessMemory(context.businessId || "");
    return {
      message: `Mauzo yamekamilika.\n${result.message}` +
        (memory.topProducts?.length ? `\n\nBidhaa zinazotamba: ${memory.topProducts.slice(0, 3).join(", ")}` : ""),
      data: result.data,
    };
  }
  return { message: result.message };
}

async function handlePurchaseIntent(
  params: Record<string, string | number | undefined>,
  context: AssistantContext,
): Promise<BrainResponse> {
  const item = params.item as string | undefined;
  const quantity = params.quantity as number | undefined;
  const cost = params.cost as number | undefined;

  if (!item) return { message: "Umenunua bidhaa gani?", workflow: "purchases", step: "awaiting_supplier_item" };
  if (!quantity) return { message: `Umenunua kiasi gani cha ${item}?`, workflow: "purchases", step: "awaiting_supplier_quantity" };
  if (!cost) return { message: `Umenunua kwa bei gani kwa kila ${item}?`, workflow: "purchases", step: "awaiting_supplier_cost" };

  const result = await toolRegistry.execute("add-purchase", {
    item, quantity, cost,
    businessId: context.businessId,
  });
  return { message: result.message, data: result.data };
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

async function createAuditLog(
  context: AssistantContext,
  action: string,
  input: string,
  response: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: context.userId,
        resourceType: "FIRDAUS",
        resourceId: action,
        action,
        before: { input },
        after: { response, timestamp: new Date().toISOString() },
      },
    });
  } catch {}
}
