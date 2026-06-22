"use client";

import { QuickActionCard } from "@/components/ui/quick-action-card";
import {
  GitBranch, Store, Users, Package, ShoppingCart, Truck,
  ClipboardList, Wallet, CircleUser, FileText, CreditCard, PiggyBank,
  FolderTree, Tag, Ruler,
} from "lucide-react";

const actions = [
  { title: "Branches", id: "branches", icon: GitBranch, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Stores", id: "stores", icon: Store, color: "text-teal-600", bg: "bg-teal-100" },
  { title: "Staff", id: "staff", icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
  { title: "Products", id: "catalog/products", icon: Package, color: "text-purple-600", bg: "bg-purple-100" },
  { title: "Categories", id: "catalog/categories", icon: FolderTree, color: "text-pink-600", bg: "bg-pink-100" },
  { title: "Brands", id: "catalog/brands", icon: Tag, color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Units", id: "catalog/units", icon: Ruler, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "Sales", id: "sales", icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Purchases", id: "purchases", icon: Truck, color: "text-orange-600", bg: "bg-orange-100" },
  { title: "Inventory", id: "inventory", icon: ClipboardList, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "Expenses", id: "expenses", icon: Wallet, color: "text-rose-600", bg: "bg-rose-100" },
  { title: "Customers", id: "customers", icon: CircleUser, color: "text-violet-600", bg: "bg-violet-100" },
  { title: "Suppliers", id: "suppliers", icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
  { title: "Invoices", id: "invoices", icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },
  { title: "Quotations", id: "quotations", icon: FileText, color: "text-pink-600", bg: "bg-pink-100" },
  { title: "Subscription", id: "subscriptions", icon: CreditCard, color: "text-green-600", bg: "bg-green-100" },
  { title: "Wallet", id: "wallet", icon: PiggyBank, color: "text-yellow-600", bg: "bg-yellow-100" },
];

export function BusinessActions({ businessId }: { businessId: string }) {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">
        Business Operations
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {actions.map((action) => (
          <QuickActionCard
            key={action.id}
            title={action.title}
            href={`/workspaces/businesses/${businessId}/${action.id}`}
            icon={action.icon}
            color={action.color}
            bg={action.bg}
          />
        ))}
      </div>
    </div>
  );
}
