import "server-only";

import { getIndustry } from "./registry";
import { prisma } from "@/server/db";

interface IndustryKnowledgeConfig {
  industrySlug: string;
  systemPrompt: string;
  knowledgeLayers: string[];
  voiceCommands: string[];
}

const VOICE_COMMANDS: Record<string, string[]> = {
  commerce: [
    "record-sale", "check-stock", "add-customer", "check-price",
    "create-purchase", "process-return", "daily-report",
  ],
  restaurant: [
    "new-order", "check-table", "reserve-table", "check-menu",
    "kitchen-status", "daily-report",
  ],
  education: [
    "register-student", "record-attendance", "check-schedule",
    "student-grades", "exam-results", "parent-contact",
  ],
  healthcare: [
    "schedule-appointment", "patient-record", "prescription-refill",
    "lab-results", "doctor-schedule",
  ],
  manufacturing: [
    "production-status", "check-bom", "work-order-status",
    "quality-check", "material-availability",
  ],
  agriculture: [
    "livestock-health", "crop-status", "harvest-schedule",
    "feed-inventory", "sales-report",
  ],
  services: [
    "book-appointment", "project-status", "staff-schedule",
    "create-invoice", "payment-status",
  ],
  logistics: [
    "track-shipment", "driver-status", "fuel-report",
    "route-optimize", "delivery-status",
  ],
  "real-estate": [
    "property-search", "tenant-info", "rent-status",
    "maintenance-request", "lease-renewal",
  ],
  "non-profit": [
    "donor-info", "campaign-status", "member-directory",
    "event-schedule", "grant-status",
  ],
};

export class IndustryAIResolver {
  async getSystemPrompt(businessId: string): Promise<string> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    const industry = getIndustry(slug);
    if (!industry) return "You are a business AI assistant. Help with business operations.";

    const modes = await prisma.businessMode.findMany({
      where: { businessId, isActive: true },
      select: { mode: true },
    });

    const modeNames = modes.map((m) => m.mode).join(", ");
    const moduleList = industry.modules.map((m) => m.name).join(", ");

    return `${industry.aiKnowledge.prompt}\n\nIndustry: ${industry.name}\nBusiness Mode(s): ${modeNames}\nAvailable Modules: ${moduleList}`;
  }

  async getKnowledgeLayers(businessId: string): Promise<string[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    const industry = getIndustry(slug);
    return industry?.aiKnowledge.layers ?? ["general", "business"];
  }

  async getVoiceCommands(businessId: string): Promise<string[]> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: { select: { slug: true } } },
    });

    const slug = business?.businessType?.slug ?? "commerce";
    return VOICE_COMMANDS[slug] ?? VOICE_COMMANDS.commerce;
  }
}

export const industryAIResolver = new IndustryAIResolver();
