import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/server/db";
import { PrismaSearchAdapter, SearchAdapter, type SearchResults, type SearchDocument } from "./adapter";

export type { SearchAdapter, SearchResults } from "./adapter";

export interface SearchOptions {
  query?: string;
  businessId?: string;
  workspaceId?: string;
  branchId?: string;
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

export class SearchService {
  private adapter: SearchAdapter;

  constructor(adapter?: SearchAdapter) {
    this.adapter = adapter ?? new PrismaSearchAdapter();
  }

  private async search<T extends SearchDocument>(
    model: string,
    fields: string[],
    options: SearchOptions,
  ): Promise<SearchResults<T>> {
    const where: Record<string, unknown> = { ...(options.where || {}) };
    if (options.businessId) where.businessId = options.businessId;
    if (options.workspaceId) where.workspaceId = options.workspaceId;
    if (options.branchId) where.branchId = options.branchId;

    return this.adapter.search<T>({
      q: options.query || "",
      fields,
      where,
      include: options.include,
      orderBy: options.orderBy,
      skip: options.offset,
      take: options.limit,
      model,
    });
  }

  async customers<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("customer", ["firstName", "lastName", "email", "phone"], options);
  }

  async catalogItems<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("catalogItem", ["name", "sku", "barcode"], options);
  }

  async suppliers<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("supplier", ["name", "email", "phone", "city"], options);
  }

  async users<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("user", ["firstName", "lastName", "email"], options);
  }

  async sales<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("sale", ["reference", "notes"], options);
  }

  async purchases<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("purchase", ["reference", "supplier.name"], options);
  }

  async purchaseOrders<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("purchaseOrder", ["supplier.name", "notes"], options);
  }

  async expenses<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("expense", ["description", "paidTo", "reference"], options);
  }

  async invoices<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("invoice", ["invoiceNumber", "customer.firstName", "customer.lastName"], options);
  }

  async returns<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("return", ["reference", "reason"], options);
  }

  async goodsReceived<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("goodsReceived", ["reference"], options);
  }

  async quotations<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("quotation", ["notes"], options);
  }

  async supportTickets<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("supportTicket", ["title", "description"], options);
  }

  async leads<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("lead", ["firstName", "lastName", "email", "phone", "businessName"], options);
  }

  async campaigns<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("distributionCampaign", ["name", "slug"], options);
  }

  async uploads<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("upload", ["fileName"], options);
  }

  async cashRegisters<T extends SearchDocument>(options: SearchOptions): Promise<SearchResults<T>> {
    return this.search<T>("cashRegister", ["name"], options);
  }

  async findByUsername(username: string): Promise<{ id: string } | null> {
    return (prisma as PrismaClient).user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });
  }
}

export const searchService = new SearchService();
