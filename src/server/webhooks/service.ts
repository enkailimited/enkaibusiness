import "server-only";
import crypto from "crypto";
import { prisma } from "@/server/db";

export interface WebhookInput {
  businessId: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  retryCount?: number;
  timeoutMs?: number;
}

export class WebhookService {
  async register(input: WebhookInput) {
    const secret = input.secret || crypto.randomBytes(32).toString("hex");
    return prisma.webhook.create({
      data: {
        businessId: input.businessId,
        name: input.name,
        url: input.url,
        secret,
        events: input.events,
        headers: input.headers || {},
        retryCount: input.retryCount || 3,
        timeoutMs: input.timeoutMs || 5000,
      },
    });
  }

  async list(businessId: string) {
    return prisma.webhook.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, businessId: string, input: Partial<WebhookInput>) {
    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.url !== undefined) data.url = input.url;
    if (input.events !== undefined) data.events = input.events;
    if (input.headers !== undefined) data.headers = input.headers;
    if (input.retryCount !== undefined) data.retryCount = input.retryCount;
    if (input.timeoutMs !== undefined) data.timeoutMs = input.timeoutMs;
    return prisma.webhook.update({ where: { id, businessId }, data });
  }

  async delete(id: string, businessId: string): Promise<void> {
    await prisma.webhook.delete({ where: { id, businessId } });
  }

  async toggle(id: string, businessId: string, isActive: boolean) {
    return prisma.webhook.update({ where: { id, businessId }, data: { isActive } });
  }

  async findMatching(businessId: string, event: string) {
    return prisma.webhook.findMany({
      where: { businessId, isActive: true, events: { has: event } },
    });
  }

  async deliver(webhookId: string, event: string, payload: Record<string, unknown>) {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) return;

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeoutMs);

    const startTime = Date.now();
    let status: string, statusCode: number | null, responseBody: string | null, error: string | null;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
        ...(webhook.headers as Record<string, string> || {}),
      };

      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      statusCode = response.status;
      responseBody = await response.text().catch(() => null);
      status = statusCode >= 200 && statusCode < 300 ? "success" : "failed";
      error = status === "success" ? null : `HTTP ${statusCode}`;
    } catch (err) {
      status = "failed";
      statusCode = null;
      responseBody = null;
      error = err instanceof Error ? err.message : String(err);
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        event,
        payload: payload as Record<string, unknown>,
        status,
        statusCode,
        responseBody,
        durationMs,
        error,
      },
    });

    await prisma.webhook.update({
      where: { id: webhookId },
      data: { lastTriggeredAt: new Date(), lastDeliveryStatus: status },
    });

    if (status === "failed" && webhook.retryCount > 1) {
      await this.scheduleRetry(webhookId, event, payload, 2);
    }

    return { status, statusCode, durationMs };
  }

  private async scheduleRetry(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
    attempt: number,
  ) {
    const delays = [0, 5000, 15000, 60000];
    const delay = delays[attempt - 1] || 60000;
    setTimeout(async () => {
      try {
        const delivery = await prisma.webhookDelivery.findFirst({
          where: { webhookId, event, attempt },
          orderBy: { createdAt: "desc" },
        });
        if (delivery?.status === "success") return;
        await this.deliverWithRetry(webhookId, event, payload, attempt);
      } catch {
        // silent
      }
    }, delay);
  }

  private async deliverWithRetry(
    webhookId: string,
    event: string,
    payload: Record<string, unknown>,
    attempt: number,
  ) {
    const webhook = await prisma.webhook.findUnique({ where: { id: webhookId } });
    if (!webhook || !webhook.isActive) return;

    const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
    const signature = crypto
      .createHmac("sha256", webhook.secret)
      .update(body)
      .digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), webhook.timeoutMs);
    const startTime = Date.now();
    let status: string, statusCode: number | null, responseBody: string | null, error: string | null;

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": event,
      };
      const response = await fetch(webhook.url, { method: "POST", headers, body, signal: controller.signal });
      statusCode = response.status;
      responseBody = await response.text().catch(() => null);
      status = statusCode >= 200 && statusCode < 300 ? "success" : "failed";
      error = status === "success" ? null : `HTTP ${statusCode}`;
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      statusCode = null;
      responseBody = null;
    } finally {
      clearTimeout(timeout);
    }

    const durationMs = Date.now() - startTime;

    await prisma.webhookDelivery.create({
      data: { webhookId, event, payload: payload as Record<string, unknown>, status, statusCode, responseBody, durationMs, error, attempt },
    });

    if (status === "failed" && attempt < webhook.retryCount) {
      await this.scheduleRetry(webhookId, event, payload, attempt + 1);
    }
  }

  async getDeliveries(webhookId: string, limit = 20) {
    return prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}

export const webhookService = new WebhookService();
