import "server-only";

import { prisma } from "@/server/db";
import { getModulesForMode, getIndustry } from "./registry";

export class ModuleResolver {
  async getEnabledModules(businessId: string): Promise<string[]> {
    const [business, modes, settings] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        select: { businessTypeId: true },
      }),
      prisma.businessMode.findMany({
        where: { businessId, isActive: true },
      }),
      prisma.setting.findMany({
        where: { businessId, key: { startsWith: "module." } },
      }),
    ]);

    if (!business) return [];

    const bt = business.businessTypeId
      ? await prisma.businessType.findUnique({
          where: { id: business.businessTypeId },
          select: { slug: true },
        })
      : null;

    const industrySlug = bt?.slug ?? "commerce";
    const activeModes = modes.map((m) => m.mode);

    const modules = new Set<string>();
    modules.add("core");
    modules.add("settings");
    modules.add("staff");
    modules.add("accounting");

    for (const mode of activeModes) {
      const modeModules = getModulesForMode(industrySlug, mode);
      for (const m of modeModules) {
        modules.add(m);
      }
    }

    for (const setting of settings) {
      const moduleSlug = setting.key.replace("module.", "");
      if (setting.value === "true") {
        modules.add(moduleSlug);
      } else if (setting.value === "false") {
        modules.delete(moduleSlug);
      }
    }

    return [...modules];
  }

  async isModuleEnabled(businessId: string, moduleSlug: string): Promise<boolean> {
    const modules = await this.getEnabledModules(businessId);
    return modules.includes(moduleSlug);
  }

  async getEnabledModuleDetails(businessId: string) {
    const industry = await this.getIndustryForBusiness(businessId);
    const enabledSlugs = await this.getEnabledModules(businessId);

    if (!industry) {
      return enabledSlugs.map((slug) => ({ slug, name: slug, enabled: true }));
    }

    return enabledSlugs.map((slug) => {
      const module = industry.modules.find((m) => m.slug === slug);
      return {
        slug,
        name: module?.name ?? slug,
        icon: module?.icon ?? "Package",
        isRequired: module?.isRequired ?? false,
        enabled: true,
      };
    });
  }

  private async getIndustryForBusiness(businessId: string) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { businessTypeId: true },
    });
    if (!business?.businessTypeId) return null;

    const bt = await prisma.businessType.findUnique({
      where: { id: business.businessTypeId },
      select: { slug: true },
    });
    if (!bt) return null;

    return getIndustry(bt.slug);
  }
}

export const moduleResolver = new ModuleResolver();
