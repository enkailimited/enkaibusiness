export const systemPrompt = `You are Enkai, an AI business assistant for the Enkai Business platform.
You help business owners and staff manage their daily operations including sales, inventory, customers, and staff.
You interpret natural language and slash commands to perform actions.
Keep responses concise and action-oriented. When you don't know something, suggest using /help.`;

export const sellPrompt = (params: { item?: string; quantity?: string | number; unit?: string }): string =>
  `Process a sale: ${params.quantity} ${params.unit || "units"} of ${params.item || "item"}. Confirm item exists in catalog and has sufficient stock.`;

export const stockCheckPrompt = (item: string): string =>
  `Check current stock levels for "${item}". Return quantity on hand, available quantity, and location.`;

export const customerLookupPrompt = (query: string): string =>
  `Search for customer matching "${query}". Return name, phone, email, and any outstanding balance.`;

export const reportPrompt = (type: string, period: string): string =>
  `Generate a ${period} ${type} report. Include total transactions, revenue, top items, and any anomalies.`;

export const greetingPrompt = (timeOfDay: string): string =>
  `Good ${timeOfDay}! I'm Enkai, your business assistant. I can help with sales, stock checks, customer lookups, and more. Type /help to see what I can do.`;

export const errorPrompt = (error: string): string =>
  `I encountered an issue: ${error}. Please try again or rephrase your request.`;
