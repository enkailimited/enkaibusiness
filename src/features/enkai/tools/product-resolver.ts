import "server-only";

import { prisma } from "@/server/db";

export interface ResolvedProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  costPrice: number | null;
  stockOnHand: number;
}

export interface ProductMatch {
  product: ResolvedProduct;
  score: number;
  matchType: "exact" | "fuzzy" | "contains" | "alias";
}

const COMMON_ALIASES: Record<string, string[]> = {
  "coca cola": ["coke", "cola", "cocacola", "cola cola"],
  "pepsi": ["pepe"],
  "sprite": ["spr"],
  "fanta": ["fan"],
  "stoney": ["tangi"],
  "konyagi": ["kony"],
  "coca cola 500ml": ["coke 500", "cocacola 500", "cola 500"],
  "coca cola 300ml": ["coke 300", "cocacola 300", "cola 300"],
  "water": ["maji", "aqua", "kioo"],
  "beer": ["bia", "pombe"],
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0) as number[]);
  for (let i = 0; i <= m; i++) (dp[i] as number[])[0] = i;
  for (let j = 0; j <= n; j++) (dp[0] as number[])[j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const above = (dp[i - 1] as number[])[j] as number;
      const left = (dp[i] as number[])[j - 1] as number;
      const diag = (dp[i - 1] as number[])[j - 1] as number;
      (dp[i] as number[])[j] = cost + Math.min(above, left, diag);
    }
  }
  return (dp[m] as number[])[n] as number;
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

function expandAliases(input: string): string[] {
  const candidates: string[] = [input];
  const normalizedInput = normalize(input);
  for (const [product, aliases] of Object.entries(COMMON_ALIASES)) {
    for (const alias of aliases) {
      if (normalizedInput.includes(alias) || alias.includes(normalizedInput)) {
        candidates.push(product);
      }
    }
  }
  return [...new Set(candidates)];
}

export async function resolveProduct(
  query: string,
  businessId: string,
  branchId?: string,
): Promise<{ matches: ProductMatch[]; exact?: ResolvedProduct }> {
  const normalized = normalize(query);
  if (!normalized) return { matches: [] };

  const searchTerms = expandAliases(normalized);

  const catalogItems = await prisma.catalogItem.findMany({
    where: {
      businessId,
      isActive: true,
    },
    include: {
      balances: branchId
        ? { where: { location: { branchId } } }
        : { include: { location: true } },
    },
  });

  const results: ProductMatch[] = [];

  for (const item of catalogItems) {
    const itemName = normalize(item.name);
    const itemSku = normalize(item.sku || "");

    let bestScore = 0;
    let matchType: ProductMatch["matchType"] = "contains";

    if (itemName === normalized || itemSku === normalized) {
      bestScore = 1.0;
      matchType = "exact";
    } else {
      for (const term of searchTerms) {
        const termNorm = normalize(term);

        if (itemName === termNorm) {
          bestScore = 1.0;
          matchType = "exact";
          break;
        }

        if (itemName.includes(termNorm) || termNorm.includes(itemName)) {
          bestScore = Math.max(bestScore, 0.85);
          matchType = "contains";
        }

        const sim = similarity(itemName, termNorm);
        if (sim > bestScore) {
          bestScore = sim;
          matchType = bestScore > 0.7 ? "fuzzy" : "contains";
        }
      }
    }

    if (bestScore >= 0.4) {
      const totalStock = item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0);
      results.push({
        product: {
          id: item.id,
          name: item.name,
          sku: item.sku,
          price: Number(item.price),
          costPrice: item.costPrice ? Number(item.costPrice) : null,
          stockOnHand: totalStock,
        },
        score: bestScore,
        matchType,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);

  const exact = results.find((r) => r.matchType === "exact" || r.score >= 0.95);
  return { matches: results.slice(0, 10), exact: exact?.product };
}

export async function searchCatalog(
  query: string,
  businessId: string,
): Promise<ResolvedProduct[]> {
  if (!query.trim()) return [];

  const normalized = normalize(query);

  const items = await prisma.catalogItem.findMany({
    where: {
      businessId,
      isActive: true,
      OR: [
        { name: { contains: normalized, mode: "insensitive" } },
        { sku: { contains: normalized, mode: "insensitive" } },
        { barcode: { contains: normalized, mode: "insensitive" } },
      ],
    },
    include: { balances: true },
    take: 20,
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    price: Number(item.price),
    costPrice: item.costPrice ? Number(item.costPrice) : null,
    stockOnHand: item.balances.reduce((s, b) => s + Number(b.quantityOnHand), 0),
  }));
}

export function formatProductSuggestion(products: ResolvedProduct[]): string {
  if (products.length === 0) return "";
  if (products.length === 1 && products[0]) return products[0].name;
  return products.map((p, i) => `  ${i + 1}. ${p.name}${p.sku ? ` (${p.sku})` : ""}`).join("\n");
}

export function formatProductList(products: ResolvedProduct[]): string {
  return products.map((p) =>
    `• ${p.name}${p.sku ? ` (${p.sku})` : ""} - Stock: ${p.stockOnHand} - Bei: TZS ${p.price.toLocaleString("sw-TZ")}`
  ).join("\n");
}
