import "server-only";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  industry: string;
  modes: string[];
  modules: string[];
  dependencies: string[];
  permissions: Array<{ slug: string; name: string; module: string; description: string }>;
  navigation: Array<{ slug: string; label: string; icon: string; path: string; module: string }>;
  events: string[];
  tables: string[];
  aiKnowledge: { layers: string[]; prompt: string };
  reports: Array<{ slug: string; name: string; description: string; category: string }>;
  dashboardWidgets: Array<{ id: string; name: string; type: string; module: string }>;
  workflows: Array<{ slug: string; name: string; triggers: string[]; actions: string[] }>;
}

const PLUGIN_REGISTRY = new Map<string, PluginManifest>();

export class PluginEngine {
  register(manifest: PluginManifest): void {
    if (PLUGIN_REGISTRY.has(manifest.id)) {
      throw new Error(`Plugin "${manifest.id}" is already registered`);
    }
    PLUGIN_REGISTRY.set(manifest.id, manifest);
  }

  unregister(pluginId: string): void {
    PLUGIN_REGISTRY.delete(pluginId);
  }

  getPlugin(pluginId: string): PluginManifest | undefined {
    return PLUGIN_REGISTRY.get(pluginId);
  }

  getAllPlugins(): PluginManifest[] {
    return Array.from(PLUGIN_REGISTRY.values());
  }

  getPluginsByIndustry(industry: string): PluginManifest[] {
    return this.getAllPlugins().filter((p) => p.industry === industry || p.industry === "*");
  }

  getPluginsByMode(mode: string): PluginManifest[] {
    return this.getAllPlugins().filter(
      (p) => p.modes.includes(mode) || p.modes.includes("*"),
    );
  }

  getPluginsForBusiness(industry: string, modes: string[]): PluginManifest[] {
    return this.getAllPlugins().filter((p) => {
      const industryMatch = p.industry === industry || p.industry === "*";
      const modeMatch = p.modes.includes("*") || modes.some((m) => p.modes.includes(m));
      return industryMatch && modeMatch;
    });
  }

  getModulePlugins(moduleSlug: string): PluginManifest[] {
    return this.getAllPlugins().filter((p) => p.modules.includes(moduleSlug));
  }

  getDependencyChain(pluginId: string): string[] {
    const plugin = PLUGIN_REGISTRY.get(pluginId);
    if (!plugin) return [];

    const deps: string[] = [];
    const visit = (id: string) => {
      const p = PLUGIN_REGISTRY.get(id);
      if (!p || deps.includes(id)) return;
      deps.push(id);
      for (const dep of p.dependencies) visit(dep);
    };

    for (const dep of plugin.dependencies) visit(dep);
    return deps;
  }

  validateDependencies(pluginId: string): { valid: boolean; missing: string[] } {
    const plugin = PLUGIN_REGISTRY.get(pluginId);
    if (!plugin) return { valid: false, missing: [pluginId] };

    const missing: string[] = [];
    for (const dep of plugin.dependencies) {
      if (!PLUGIN_REGISTRY.has(dep)) missing.push(dep);
    }

    return { valid: missing.length === 0, missing };
  }

  getPermissionsForPlugin(pluginId: string): Array<{ slug: string; name: string; module: string; description: string }> {
    return PLUGIN_REGISTRY.get(pluginId)?.permissions ?? [];
  }

  getNavigationForPlugin(pluginId: string): Array<{ slug: string; label: string; icon: string; path: string; module: string }> {
    return PLUGIN_REGISTRY.get(pluginId)?.navigation ?? [];
  }
}

export const pluginEngine = new PluginEngine();

export function definePlugin(manifest: PluginManifest): PluginManifest {
  return manifest;
}
