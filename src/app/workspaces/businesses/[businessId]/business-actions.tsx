"use client";

import { QuickActionCard } from "@/components/ui/quick-action-card";
import { useEffect, useState } from "react";
import {
  GitBranch, Store, Users, Package, ShoppingCart, Truck,
  ClipboardList, Wallet, CircleUser, FileText, CreditCard, PiggyBank,
  FolderTree, Tag, Ruler, QrCode, LayoutGrid, BarChart3, Send, TrendingDown, LayoutDashboard, Settings,
} from "lucide-react";
import { getAdvancedProcurementAction } from "@/features/procurement/actions";

const baseActions = [
  { title: "Overview", id: "overview", icon: LayoutDashboard, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Branches", id: "branches", icon: GitBranch, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Branch Perf", id: "branch-performance", icon: BarChart3, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "Stores", id: "stores", icon: Store, color: "text-teal-600", bg: "bg-teal-100" },
  { title: "Staff", id: "staff", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
  { title: "Catalog", id: "catalog", icon: LayoutGrid, color: "text-purple-600", bg: "bg-purple-100" },
  { title: "Categories", id: "catalog/categories", icon: FolderTree, color: "text-pink-600", bg: "bg-pink-100" },
  { title: "Brands", id: "catalog/brands", icon: Tag, color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Units", id: "catalog/units", icon: Ruler, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "POS", id: "pos", icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Sales", id: "sales", icon: ClipboardList, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Purchases", id: "purchases", icon: Truck, color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Inventory", id: "inventory", icon: ClipboardList, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "Inventory Value", id: "inventory-valuation", icon: Package, color: "text-cyan-700", bg: "bg-cyan-100" },
  { title: "Expenses", id: "expenses", icon: Wallet, color: "text-rose-600", bg: "bg-rose-100" },
  { title: "Customers", id: "customers", icon: CircleUser, color: "text-violet-600", bg: "bg-violet-100" },
  { title: "Suppliers", id: "suppliers", icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
  { title: "Invoices", id: "invoices", icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },
  { title: "Receivables", id: "receivables", icon: CreditCard, color: "text-amber-600", bg: "bg-amber-100" },
  { title: "Payables", id: "payables", icon: TrendingDown, color: "text-red-600", bg: "bg-red-100" },
  { title: "Quotations", id: "quotations", icon: FileText, color: "text-pink-600", bg: "bg-pink-100" },
  { title: "Subscription", id: "subscriptions", icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
  { title: "QR Menu", id: "qr-ordering", icon: QrCode, color: "text-violet-600", bg: "bg-violet-100" },
  { title: "Wallet", id: "wallet", icon: PiggyBank, color: "text-yellow-600", bg: "bg-yellow-100" },
  { title: "Reports", id: "reports", icon: BarChart3, color: "text-sky-600", bg: "bg-sky-100" },
  { title: "Settings", id: "settings", icon: Settings, color: "text-muted-foreground", bg: "bg-muted" },
];

const advancedActions = [
  { title: "Purchase Orders", id: "purchase-orders", icon: Send, color: "text-orange-700", bg: "bg-orange-100" },
  { title: "Goods Received", id: "goods-received", icon: Package, color: "text-teal-700", bg: "bg-teal-100" },
];

export function BusinessActions({ businessId }: { businessId: string }) {
  const [isAdvanced, setIsAdvanced] = useState<boolean | null>(null);

  useEffect(() => {
    getAdvancedProcurementAction(businessId).then(setIsAdvanced);
  }, [businessId]);

  const actions = isAdvanced === null
    ? baseActions
    : isAdvanced
      ? [...baseActions, ...advancedActions]
      : baseActions;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
        Commerce
      </h2>
      <div className="grid grid-cols-4 gap-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            href={`/workspaces/businesses/${businessId}/commerce/${action.id}`}
            icon={action.icon}
            color={action.color}
            bg={action.bg}
          />
        ))}
      </div>
    </div>
  );
}
