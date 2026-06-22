import "server-only";

import { prisma } from "@/server/db";

export interface DebtAccount {
  customerId: string;
  customerName: string;
  phone?: string;
  balance: number;
  dueDate: Date;
  daysOverdue: number;
  totalCredit: number;
  lastPayment: Date | null;
  risk: "low" | "medium" | "high" | "critical";
}

export interface CollectionReminder {
  customerId: string;
  customerName: string;
  phone?: string;
  amount: number;
  daysOverdue: number;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
}

export class DebtCollectionEngine {
  async getOverdueAccounts(businessId: string): Promise<DebtAccount[]> {
    const now = new Date();

    const credits = await prisma.customerCredit.findMany({
      where: { businessId, balance: { gt: 0 } },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
        transactions: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
      },
      orderBy: { balance: "desc" },
    });

    return credits.map((c) => {
      const daysOverdue = c.dueDate ? Math.ceil((now.getTime() - c.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      let risk: DebtAccount["risk"] = "low";
      if (daysOverdue > 90) risk = "critical";
      else if (daysOverdue > 60) risk = "high";
      else if (daysOverdue > 30) risk = "medium";

      return {
        customerId: c.customer?.id || "",
        customerName: c.customer ? `${c.customer.firstName} ${c.customer.lastName || ""}`.trim() : "Unknown",
        phone: c.customer?.phone || undefined,
        balance: Number(c.balance),
        dueDate: c.dueDate || new Date(),
        daysOverdue: Math.max(0, daysOverdue),
        totalCredit: Number(c.creditLimit || c.balance),
        lastPayment: c.transactions[0]?.createdAt || null,
        risk,
      };
    }).filter((d) => d.balance > 0);
  }

  async generateReminders(businessId: string): Promise<CollectionReminder[]> {
    const overdueAccounts = await this.getOverdueAccounts(businessId);
    const reminders: CollectionReminder[] = [];

    const templates: Record<string, (name: string, amount: number, days: number) => string> = {
      low: (name, amount, days) =>
        `${name}, deni lako la Tsh ${amount.toLocaleString()} lina siku ${days} limechelewa. Tafadhali lipa mapema.`,
      medium: (name, amount, days) =>
        `${name}, deni lako la Tsh ${amount.toLocaleString()} limechelewa siku ${days}. Tafadhali lipa ili kuepuka hatua za kisheria.`,
      high: (name, amount, days) =>
        `${name}, deni lako la Tsh ${amount.toLocaleString()} limechelewa siku ${days}. Hatua za kisheria zitachukuliwa kama hutilipa ndani ya siku 7.`,
      urgent: (name, amount, days) =>
        `${name}, deni lako la Tsh ${amount.toLocaleString()} limechelewa siku ${days}. Tumeshaanza hatua za kisheria. Wasiliana nasi haraka.`,
    };

    for (const account of overdueAccounts.filter((a) => a.daysOverdue >= 7)) {
      const template = templates[account.risk] || templates.low;
      let priority: CollectionReminder["priority"] = "low";
      if (account.risk === "critical") priority = "urgent";
      else if (account.risk === "high") priority = "high";
      else if (account.risk === "medium") priority = "medium";

      reminders.push({
        customerId: account.customerId,
        customerName: account.customerName,
        phone: account.phone,
        amount: account.balance,
        daysOverdue: account.daysOverdue,
        message: template(account.customerName, account.balance, account.daysOverdue),
        priority,
      });
    }

    reminders.sort((a, b) => {
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority] || 99) - (order[b.priority] || 99);
    });

    return reminders;
  }

  async getCollectionSummary(businessId: string): Promise<{
    totalOverdue: number;
    countOverdue: number;
    criticalCount: number;
    highRiskAmount: number;
    topDebtor: { name: string; amount: number } | null;
  }> {
    const accounts = await this.getOverdueAccounts(businessId);
    const totalOverdue = accounts.reduce((sum, a) => sum + a.balance, 0);
    const critical = accounts.filter((a) => a.risk === "critical");
    const highRisk = accounts.filter((a) => a.risk === "high");

    return {
      totalOverdue,
      countOverdue: accounts.length,
      criticalCount: critical.length,
      highRiskAmount: highRisk.reduce((sum, a) => sum + a.balance, 0),
      topDebtor: accounts.length > 0
        ? { name: accounts[0].customerName, amount: accounts[0].balance }
        : null,
    };
  }
}

export const debtCollectionEngine = new DebtCollectionEngine();
