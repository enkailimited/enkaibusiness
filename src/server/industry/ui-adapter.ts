import "server-only";

import { moduleResolver } from "./module-resolver";
import { reportResolver } from "./report-resolver";
import { dashboardResolver } from "./dashboard-resolver";
import { workflowResolver } from "./workflow-resolver";
import { industryAIResolver } from "./ai-resolver";

export interface NavigationItem {
  slug: string;
  label: string;
  icon: string;
  path: string;
  module: string;
  children?: NavigationItem[];
}

const ALL_NAV_ITEMS: NavigationItem[] = [
  { slug: "dashboard", label: "Dashboard", icon: "LayoutDashboard", path: "/dashboard", module: "core" },
  { slug: "pos", label: "POS", icon: "CreditCard", path: "/pos", module: "pos" },
  { slug: "sales", label: "Sales", icon: "TrendingUp", path: "/sales", module: "sales" },
  { slug: "purchases", label: "Purchases", icon: "ShoppingBag", path: "/purchases", module: "purchasing" },
  { slug: "purchase-orders", label: "Purchase Orders", icon: "FileText", path: "/purchase-orders", module: "purchasing" },
  { slug: "inventory", label: "Inventory", icon: "Package", path: "/inventory", module: "inventory" },
  { slug: "customers", label: "Customers", icon: "Users", path: "/customers", module: "customers" },
  { slug: "suppliers", label: "Suppliers", icon: "Truck", path: "/suppliers", module: "suppliers" },
  { slug: "invoices", label: "Invoices", icon: "FileText", path: "/invoices", module: "accounting" },
  { slug: "returns", label: "Returns", icon: "RotateCcw", path: "/returns", module: "returns" },
  { slug: "expenses", label: "Expenses", icon: "DollarSign", path: "/expenses", module: "accounting" },
  { slug: "payments", label: "Payments", icon: "Wallet", path: "/payments", module: "payments" },
  { slug: "pricing", label: "Pricing", icon: "Tag", path: "/pricing", module: "pricing" },
  { slug: "promotions", label: "Promotions", icon: "Megaphone", path: "/promotions", module: "promotions" },
  { slug: "menu", label: "Menu", icon: "Book", path: "/menu", module: "menu" },
  { slug: "kitchen", label: "Kitchen", icon: "ChefHat", path: "/kitchen", module: "kitchen" },
  { slug: "tables", label: "Tables", icon: "Grid", path: "/tables", module: "tables" },
  { slug: "reservations", label: "Reservations", icon: "Calendar", path: "/reservations", module: "reservations" },
  { slug: "qr-ordering", label: "QR Ordering", icon: "QrCode", path: "/qr-ordering", module: "qr-ordering" },
  { slug: "delivery", label: "Delivery", icon: "Truck", path: "/delivery", module: "delivery" },
  { slug: "students", label: "Students", icon: "Users", path: "/students", module: "students" },
  { slug: "teachers", label: "Teachers", icon: "ChalkboardTeacher", path: "/teachers", module: "teachers" },
  { slug: "attendance", label: "Attendance", icon: "ClipboardCheck", path: "/attendance", module: "attendance" },
  { slug: "examinations", label: "Examinations", icon: "FileText", path: "/examinations", module: "examinations" },
  { slug: "admissions", label: "Admissions", icon: "DoorOpen", path: "/admissions", module: "admissions" },
  { slug: "patients", label: "Patients", icon: "Users", path: "/patients", module: "patients" },
  { slug: "appointments", label: "Appointments", icon: "Calendar", path: "/appointments", module: "appointments" },
  { slug: "doctors", label: "Doctors", icon: "UserCheck", path: "/doctors", module: "doctors" },
  { slug: "pharmacy", label: "Pharmacy", icon: "Pill", path: "/pharmacy", module: "pharmacy" },
  { slug: "laboratory", label: "Laboratory", icon: "Flask", path: "/laboratory", module: "laboratory" },
  { slug: "billing", label: "Billing", icon: "DollarSign", path: "/billing", module: "billing" },
  { slug: "medical-records", label: "Medical Records", icon: "FileText", path: "/medical-records", module: "medical-records" },
  { slug: "production", label: "Production", icon: "Factory", path: "/production", module: "production" },
  { slug: "work-orders", label: "Work Orders", icon: "ClipboardList", path: "/work-orders", module: "work-orders" },
  { slug: "quality-control", label: "Quality Control", icon: "CheckCircle", path: "/quality-control", module: "quality-control" },
  { slug: "bom", label: "Bill of Materials", icon: "List", path: "/bom", module: "bom" },
  { slug: "properties", label: "Properties", icon: "Building2", path: "/properties", module: "properties" },
  { slug: "tenants", label: "Tenants", icon: "Users", path: "/tenants", module: "tenants" },
  { slug: "rent", label: "Rent", icon: "DollarSign", path: "/rent", module: "rent" },
  { slug: "maintenance", label: "Maintenance", icon: "Wrench", path: "/maintenance", module: "maintenance" },
  { slug: "fleet", label: "Fleet", icon: "Truck", path: "/fleet", module: "fleet" },
  { slug: "drivers", label: "Drivers", icon: "User", path: "/drivers", module: "drivers" },
  { slug: "routes", label: "Routes", icon: "Map", path: "/routes", module: "routes" },
  { slug: "tracking", label: "Tracking", icon: "MapPin", path: "/tracking", module: "tracking" },
  { slug: "fuel", label: "Fuel", icon: "Fuel", path: "/fuel", module: "fuel" },
  { slug: "donations", label: "Donations", icon: "Gift", path: "/donations", module: "donations" },
  { slug: "members", label: "Members", icon: "Users", path: "/members", module: "members" },
  { slug: "projects", label: "Projects", icon: "ClipboardList", path: "/projects", module: "projects" },
  { slug: "events", label: "Events", icon: "Calendar", path: "/events", module: "events" },
  { slug: "staff", label: "Staff", icon: "Users", path: "/staff", module: "staff" },
  { slug: "settings", label: "Settings", icon: "Settings", path: "/settings", module: "settings" },
  { slug: "reports", label: "Reports", icon: "BarChart", path: "/reports", module: "core" },
  { slug: "workflows", label: "Workflows", icon: "GitBranch", path: "/workflows", module: "core" },
];

export class UIAdapter {
  async getNavigation(businessId: string): Promise<NavigationItem[]> {
    const enabledModules = await moduleResolver.getEnabledModules(businessId);
    return ALL_NAV_ITEMS.filter((item) => enabledModules.includes(item.module));
  }

  async getIndustryConfig(businessId: string) {
    const [modules, nav, reports, dashboard, workflows, aiKnowledge] = await Promise.all([
      moduleResolver.getEnabledModuleDetails(businessId),
      this.getNavigation(businessId),
      reportResolver.getAvailableReports(businessId),
      dashboardResolver.getDashboard(businessId),
      workflowResolver.getAvailableWorkflows(businessId),
      industryAIResolver.getSystemPrompt(businessId),
    ]);

    return {
      modules,
      navigation: nav,
      reports,
      dashboard,
      workflows,
      aiKnowledge,
    };
  }
}

export const uiAdapter = new UIAdapter();
