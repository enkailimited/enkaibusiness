import "server-only";

import type { FullIndustryDefinition } from "./types";

export const INDUSTRY_REGISTRY: Record<string, FullIndustryDefinition> = {
  commerce: {
    slug: "commerce",
    enum: "COMMERCE",
    name: "Commerce",
    description: "Retail, wholesale, distribution, trading, and ecommerce businesses",
    icon: "ShoppingCart",
    color: "#3B82F6",
    modes: [
      { slug: "retail", name: "Retail", description: "Physical store-based retail business" },
      { slug: "wholesale", name: "Wholesale", description: "Bulk sales to other businesses" },
      { slug: "retail-wholesale", name: "Retail + Wholesale", description: "Hybrid retail and wholesale" },
      { slug: "distribution", name: "Distribution", description: "Product distribution to retailers" },
      { slug: "trading", name: "Trading", description: "Import/export and commodity trading" },
      { slug: "ecommerce", name: "Ecommerce", description: "Online-only retail business" },
    ],
    defaultMode: "retail",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "pos", name: "Point of Sale", description: "POS system for in-store sales", icon: "CreditCard", isRequired: false },
      { slug: "inventory", name: "Inventory", description: "Stock and warehouse management", icon: "Package", isRequired: false },
      { slug: "customers", name: "Customers", description: "Customer relationship management", icon: "UserCheck", isRequired: false },
      { slug: "sales", name: "Sales", description: "Sales order processing", icon: "TrendingUp", isRequired: false },
      { slug: "purchasing", name: "Purchasing", description: "Purchase order management", icon: "ShoppingBag", isRequired: false },
      { slug: "suppliers", name: "Suppliers", description: "Supplier management", icon: "Truck", isRequired: false },
      { slug: "pricing", name: "Pricing", description: "Price list and discount management", icon: "Tag", isRequired: false },
      { slug: "promotions", name: "Promotions", description: "Sales promotions and campaigns", icon: "Megaphone", isRequired: false },
      { slug: "barcode", name: "Barcode", description: "Barcode scanning and labels", icon: "Scan", isRequired: false },
      { slug: "qr-ordering", name: "QR Ordering", description: "QR code based ordering", icon: "QrCode", isRequired: false },
      { slug: "delivery", name: "Delivery", description: "Delivery management", icon: "Truck", isRequired: false },
      { slug: "returns", name: "Returns", description: "Product returns and refunds", icon: "RotateCcw", isRequired: false },
      { slug: "payments", name: "Payments", description: "Payment processing", icon: "Wallet", isRequired: false },
      { slug: "crm", name: "CRM", description: "Customer relationship management", icon: "Users", isRequired: false },
      { slug: "commerce-ai", name: "Commerce AI", description: "AI-powered commerce tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "commerce",
      name: "Commerce AI Knowledge",
      layers: ["general", "business", "erp", "financial", "inventory", "sales", "customer"],
      prompt: "You are a commerce AI assistant. Help with retail operations, inventory management, sales, and customer relationships.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  restaurant: {
    slug: "restaurant",
    enum: "RESTAURANT",
    name: "Restaurant & Hospitality",
    description: "Restaurants, cafes, bakeries, bars, and food service businesses",
    icon: "UtensilsCrossed",
    color: "#EF4444",
    modes: [
      { slug: "restaurant", name: "Restaurant", description: "Full-service restaurant" },
      { slug: "cafe", name: "Cafe", description: "Cafe and coffee shop" },
      { slug: "bakery", name: "Bakery", description: "Bakery and pastry shop" },
      { slug: "bar", name: "Bar", description: "Bar and pub" },
      { slug: "hotel-restaurant", name: "Hotel Restaurant", description: "Hotel dining service" },
      { slug: "food-truck", name: "Food Truck", description: "Mobile food service" },
      { slug: "fast-food", name: "Fast Food", description: "Quick service restaurant" },
      { slug: "cloud-kitchen", name: "Cloud Kitchen", description: "Delivery-only kitchen" },
    ],
    defaultMode: "restaurant",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "menu", name: "Menu", description: "Menu and item management", icon: "Book", isRequired: false },
      { slug: "kitchen", name: "Kitchen", description: "Kitchen display and order management", icon: "ChefHat", isRequired: false },
      { slug: "tables", name: "Tables", description: "Table layout and management", icon: "Grid", isRequired: false },
      { slug: "reservations", name: "Reservations", description: "Table reservations", icon: "Calendar", isRequired: false },
      { slug: "qr-ordering", name: "QR Ordering", description: "QR code menu and ordering", icon: "QrCode", isRequired: false },
      { slug: "pos", name: "Point of Sale", description: "POS system", icon: "CreditCard", isRequired: false },
      { slug: "delivery", name: "Delivery", description: "Delivery and takeaway", icon: "Truck", isRequired: false },
      { slug: "inventory", name: "Inventory", description: "Food and supply inventory", icon: "Package", isRequired: false },
      { slug: "recipes", name: "Recipes", description: "Recipe and ingredient management", icon: "FileText", isRequired: false },
      { slug: "ingredients", name: "Ingredients", description: "Ingredient tracking", icon: "List", isRequired: false },
      { slug: "restaurant-ai", name: "Restaurant AI", description: "AI-powered restaurant tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "restaurant",
      name: "Restaurant AI Knowledge",
      layers: ["general", "business", "erp", "financial", "inventory", "menu", "kitchen"],
      prompt: "You are a restaurant AI assistant. Help with menu management, kitchen operations, table reservations, and food service.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  education: {
    slug: "education",
    enum: "EDUCATION",
    name: "Education",
    description: "Schools, colleges, universities, and training centers",
    icon: "GraduationCap",
    color: "#8B5CF6",
    modes: [
      { slug: "nursery", name: "Nursery", description: "Nursery and preschool" },
      { slug: "day-care", name: "Day Care", description: "Day care center" },
      { slug: "primary", name: "Primary", description: "Primary school" },
      { slug: "secondary", name: "Secondary", description: "Secondary school" },
      { slug: "college", name: "College", description: "College and high school" },
      { slug: "university", name: "University", description: "University institution" },
      { slug: "training-center", name: "Training Center", description: "Vocational training center" },
    ],
    defaultMode: "primary",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee and teacher management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "admissions", name: "Admissions", description: "Student enrollment and admissions", icon: "DoorOpen", isRequired: false },
      { slug: "parents", name: "Parents", description: "Parent communication portal", icon: "Heart", isRequired: false },
      { slug: "students", name: "Students", description: "Student records management", icon: "Users", isRequired: false },
      { slug: "teachers", name: "Teachers", description: "Teacher management", icon: "ChalkboardTeacher", isRequired: false },
      { slug: "attendance", name: "Attendance", description: "Student attendance tracking", icon: "ClipboardCheck", isRequired: false },
      { slug: "transport", name: "Transport", description: "School transport management", icon: "Bus", isRequired: false },
      { slug: "meals", name: "Meals", description: "Meal planning and tracking", icon: "Apple", isRequired: false },
      { slug: "medical", name: "Medical", description: "Student health records", icon: "Stethoscope", isRequired: false },
      { slug: "homework", name: "Homework", description: "Homework assignments", icon: "Book", isRequired: false },
      { slug: "examinations", name: "Examinations", description: "Exam management and grading", icon: "FileText", isRequired: false },
      { slug: "finance", name: "Finance", description: "School fee management", icon: "DollarSign", isRequired: false },
      { slug: "library", name: "Library", description: "Library management", icon: "Book", isRequired: false },
      { slug: "ai-teacher", name: "AI Teacher", description: "AI-powered teaching assistant", icon: "Bot", isRequired: false },
      { slug: "ai-storytelling", name: "AI Storytelling", description: "AI story generation for children", icon: "BookOpen", isRequired: false },
      { slug: "ai-reading", name: "AI Reading", description: "AI reading tutor", icon: "Book", isRequired: false },
      { slug: "ai-pronunciation", name: "AI Pronunciation", description: "AI pronunciation coach", icon: "Mic", isRequired: false },
      { slug: "ai-singing", name: "AI Singing", description: "AI singing tutor", icon: "Music", isRequired: false },
      { slug: "ai-games", name: "AI Games", description: "AI educational games", icon: "Gamepad", isRequired: false },
      { slug: "education-ai", name: "Education AI", description: "AI-powered education tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "education",
      name: "Education AI Knowledge",
      layers: ["general", "business", "erp", "financial", "education", "pedagogy", "curriculum"],
      prompt: "You are an education AI assistant. Help with student management, teaching, examinations, and school operations.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  healthcare: {
    slug: "healthcare",
    enum: "HEALTHCARE",
    name: "Healthcare",
    description: "Clinics, hospitals, pharmacies, laboratories, and dental practices",
    icon: "Stethoscope",
    color: "#10B981",
    modes: [
      { slug: "clinic", name: "Clinic", description: "Medical clinic" },
      { slug: "hospital", name: "Hospital", description: "Hospital facility" },
      { slug: "pharmacy", name: "Pharmacy", description: "Pharmacy and drug store" },
      { slug: "laboratory", name: "Laboratory", description: "Medical laboratory" },
      { slug: "dental", name: "Dental", description: "Dental clinic" },
      { slug: "veterinary", name: "Veterinary", description: "Veterinary clinic" },
    ],
    defaultMode: "clinic",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Staff and doctor management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "patients", name: "Patients", description: "Patient records management", icon: "Users", isRequired: false },
      { slug: "appointments", name: "Appointments", description: "Appointment scheduling", icon: "Calendar", isRequired: false },
      { slug: "doctors", name: "Doctors", description: "Doctor management", icon: "UserCheck", isRequired: false },
      { slug: "pharmacy", name: "Pharmacy", description: "Pharmacy and dispensing", icon: "Pill", isRequired: false },
      { slug: "laboratory", name: "Laboratory", description: "Lab test management", icon: "Flask", isRequired: false },
      { slug: "billing", name: "Billing", description: "Medical billing and insurance", icon: "DollarSign", isRequired: false },
      { slug: "medical-records", name: "Medical Records", description: "Electronic health records", icon: "FileText", isRequired: false },
      { slug: "healthcare-ai", name: "Healthcare AI", description: "AI-powered healthcare tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "healthcare",
      name: "Healthcare AI Knowledge",
      layers: ["general", "business", "erp", "financial", "healthcare", "medical", "patient"],
      prompt: "You are a healthcare AI assistant. Help with patient management, appointments, medical records, and healthcare operations.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  manufacturing: {
    slug: "manufacturing",
    enum: "MANUFACTURING",
    name: "Manufacturing",
    description: "Food processing, textile, furniture, chemical, and general manufacturing",
    icon: "Factory",
    color: "#F59E0B",
    modes: [
      { slug: "food-processing", name: "Food Processing", description: "Food and beverage processing" },
      { slug: "textile", name: "Textile", description: "Textile and garment manufacturing" },
      { slug: "furniture", name: "Furniture", description: "Furniture manufacturing" },
      { slug: "chemical", name: "Chemical", description: "Chemical manufacturing" },
      { slug: "general", name: "General Manufacturing", description: "General purpose manufacturing" },
    ],
    defaultMode: "general",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "production", name: "Production", description: "Production planning and tracking", icon: "Factory", isRequired: false },
      { slug: "bom", name: "Bill of Materials", description: "BOM management", icon: "List", isRequired: false },
      { slug: "mrp", name: "MRP", description: "Material requirements planning", icon: "ClipboardList", isRequired: false },
      { slug: "work-orders", name: "Work Orders", description: "Work order management", icon: "FileText", isRequired: false },
      { slug: "quality-control", name: "Quality Control", description: "Quality inspection and testing", icon: "CheckCircle", isRequired: false },
      { slug: "warehouse", name: "Warehouse", description: "Warehouse management", icon: "Package", isRequired: false },
      { slug: "inventory", name: "Inventory", description: "Raw material and finished goods inventory", icon: "Package", isRequired: false },
      { slug: "purchasing", name: "Purchasing", description: "Raw material procurement", icon: "ShoppingBag", isRequired: false },
      { slug: "suppliers", name: "Suppliers", description: "Supplier management", icon: "Truck", isRequired: false },
      { slug: "manufacturing-ai", name: "Manufacturing AI", description: "AI-powered manufacturing tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "manufacturing",
      name: "Manufacturing AI Knowledge",
      layers: ["general", "business", "erp", "financial", "inventory", "production", "supply-chain"],
      prompt: "You are a manufacturing AI assistant. Help with production planning, BOM, quality control, and supply chain management.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  agriculture: {
    slug: "agriculture",
    enum: "AGRICULTURE",
    name: "Agriculture",
    description: "Farms, livestock, poultry, dairy, and agro-dealer businesses",
    icon: "Sprout",
    color: "#22C55E",
    modes: [
      { slug: "farm", name: "Farm", description: "Crop farming" },
      { slug: "livestock", name: "Livestock", description: "Livestock rearing" },
      { slug: "poultry", name: "Poultry", description: "Poultry farming" },
      { slug: "dairy", name: "Dairy", description: "Dairy farming" },
      { slug: "agro-dealer", name: "Agro Dealer", description: "Agricultural inputs dealer" },
    ],
    defaultMode: "farm",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Worker management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "livestock", name: "Livestock", description: "Livestock management", icon: "Cow", isRequired: false },
      { slug: "crops", name: "Crops", description: "Crop management and planning", icon: "Sprout", isRequired: false },
      { slug: "feeds", name: "Feeds", description: "Feed and nutrition management", icon: "Package", isRequired: false },
      { slug: "farm-inventory", name: "Farm Inventory", description: "Farm supplies and equipment", icon: "Warehouse", isRequired: false },
      { slug: "harvest", name: "Harvest", description: "Harvest planning and tracking", icon: "Calendar", isRequired: false },
      { slug: "sales", name: "Sales", description: "Produce sales", icon: "TrendingUp", isRequired: false },
      { slug: "agriculture-ai", name: "Agriculture AI", description: "AI-powered agriculture tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "agriculture",
      name: "Agriculture AI Knowledge",
      layers: ["general", "business", "erp", "financial", "agriculture", "livestock", "crops"],
      prompt: "You are an agriculture AI assistant. Help with farm management, crop planning, livestock care, and agricultural operations.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  services: {
    slug: "services",
    enum: "SERVICES",
    name: "Services",
    description: "Salon, laundry, repair, consultancy, agency, and construction services",
    icon: "Wrench",
    color: "#EC4899",
    modes: [
      { slug: "salon", name: "Salon", description: "Salon and barbershop" },
      { slug: "laundry", name: "Laundry", description: "Laundry and dry cleaning" },
      { slug: "repair-shop", name: "Repair Shop", description: "Electronics and equipment repair" },
      { slug: "consultancy", name: "Consultancy", description: "Professional consultancy" },
      { slug: "agency", name: "Agency", description: "Service agency" },
      { slug: "construction", name: "Construction", description: "Construction and contracting" },
    ],
    defaultMode: "salon",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "appointments", name: "Appointments", description: "Appointment scheduling", icon: "Calendar", isRequired: false },
      { slug: "projects", name: "Projects", description: "Project management", icon: "ClipboardList", isRequired: false },
      { slug: "staff", name: "Staff", description: "Staff management", icon: "Users", isRequired: false },
      { slug: "invoices", name: "Invoices", description: "Service invoicing", icon: "FileText", isRequired: false },
      { slug: "payments", name: "Payments", description: "Payment processing", icon: "Wallet", isRequired: false },
      { slug: "service-ai", name: "Service AI", description: "AI-powered service tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "services",
      name: "Services AI Knowledge",
      layers: ["general", "business", "erp", "financial", "services", "appointments", "projects"],
      prompt: "You are a service industry AI assistant. Help with appointment scheduling, project management, and service delivery.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  logistics: {
    slug: "logistics",
    enum: "LOGISTICS",
    name: "Logistics",
    description: "Courier, transport, fleet, and delivery companies",
    icon: "Truck",
    color: "#6366F1",
    modes: [
      { slug: "courier", name: "Courier", description: "Courier and parcel delivery" },
      { slug: "transport", name: "Transport", description: "Passenger and goods transport" },
      { slug: "fleet", name: "Fleet", description: "Fleet management" },
      { slug: "delivery-company", name: "Delivery Company", description: "Last-mile delivery company" },
    ],
    defaultMode: "courier",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee and driver management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "fleet", name: "Fleet", description: "Vehicle fleet management", icon: "Truck", isRequired: false },
      { slug: "drivers", name: "Drivers", description: "Driver management", icon: "User", isRequired: false },
      { slug: "routes", name: "Routes", description: "Route planning and optimization", icon: "Map", isRequired: false },
      { slug: "deliveries", name: "Deliveries", description: "Delivery tracking and management", icon: "Package", isRequired: false },
      { slug: "tracking", name: "Tracking", description: "Real-time shipment tracking", icon: "MapPin", isRequired: false },
      { slug: "fuel", name: "Fuel", description: "Fuel consumption tracking", icon: "Fuel", isRequired: false },
      { slug: "logistics-ai", name: "Logistics AI", description: "AI-powered logistics tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "logistics",
      name: "Logistics AI Knowledge",
      layers: ["general", "business", "erp", "financial", "logistics", "fleet", "routes"],
      prompt: "You are a logistics AI assistant. Help with fleet management, route optimization, delivery tracking, and transport operations.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  "real-estate": {
    slug: "real-estate",
    enum: "REAL_ESTATE",
    name: "Real Estate",
    description: "Property management, rental, agency, and real estate development",
    icon: "Building2",
    color: "#14B8A6",
    modes: [
      { slug: "property-management", name: "Property Management", description: "Property management company" },
      { slug: "rental", name: "Rental", description: "Rental property business" },
      { slug: "agency", name: "Agency", description: "Real estate agency" },
      { slug: "developer", name: "Developer", description: "Property developer" },
    ],
    defaultMode: "property-management",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Employee management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting", icon: "BookOpen", isRequired: true },
      { slug: "properties", name: "Properties", description: "Property listings and management", icon: "Building2", isRequired: false },
      { slug: "tenants", name: "Tenants", description: "Tenant management", icon: "Users", isRequired: false },
      { slug: "rent", name: "Rent", description: "Rent collection and tracking", icon: "DollarSign", isRequired: false },
      { slug: "maintenance", name: "Maintenance", description: "Property maintenance", icon: "Wrench", isRequired: false },
      { slug: "contracts", name: "Contracts", description: "Lease and contract management", icon: "FileText", isRequired: false },
      { slug: "real-estate-ai", name: "Real Estate AI", description: "AI-powered real estate tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "real-estate",
      name: "Real Estate AI Knowledge",
      layers: ["general", "business", "erp", "financial", "real-estate", "property", "legal"],
      prompt: "You are a real estate AI assistant. Help with property management, tenant relations, rent tracking, and lease management.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },

  "non-profit": {
    slug: "non-profit",
    enum: "NON_PROFIT",
    name: "Non-Profit",
    description: "NGOs, foundations, religious organizations, and associations",
    icon: "Heart",
    color: "#F43F5E",
    modes: [
      { slug: "ngo", name: "NGO", description: "Non-governmental organization" },
      { slug: "foundation", name: "Foundation", description: "Charitable foundation" },
      { slug: "religious", name: "Religious Organization", description: "Religious institution" },
      { slug: "association", name: "Association", description: "Membership association" },
    ],
    defaultMode: "ngo",
    requiredModules: ["core", "settings", "staff", "accounting"],
    modules: [
      { slug: "core", name: "Core", description: "Core business operations", icon: "LayoutDashboard", isRequired: true },
      { slug: "settings", name: "Settings", description: "Business configuration", icon: "Settings", isRequired: true },
      { slug: "staff", name: "Staff", description: "Staff and volunteer management", icon: "Users", isRequired: true },
      { slug: "accounting", name: "Accounting", description: "Financial accounting and fund tracking", icon: "BookOpen", isRequired: true },
      { slug: "members", name: "Members", description: "Member management", icon: "Users", isRequired: false },
      { slug: "donations", name: "Donations", description: "Donation tracking and management", icon: "Gift", isRequired: false },
      { slug: "projects", name: "Projects", description: "Project management and tracking", icon: "ClipboardList", isRequired: false },
      { slug: "events", name: "Events", description: "Event management", icon: "Calendar", isRequired: false },
      { slug: "accounting", name: "Accounting", description: "Fund accounting", icon: "BookOpen", isRequired: false },
      { slug: "nonprofit-ai", name: "Nonprofit AI", description: "AI-powered nonprofit tools", icon: "Brain", isRequired: false },
    ],
    permissions: [],
    aiKnowledge: {
      slug: "non-profit",
      name: "Non-Profit AI Knowledge",
      layers: ["general", "business", "erp", "financial", "nonprofit", "fundraising", "community"],
      prompt: "You are a non-profit AI assistant. Help with member management, donations, project tracking, and community engagement.",
    },
    reports: [],
    dashboards: [],
    workflows: [],
  },
};

export function getIndustry(slug: string): FullIndustryDefinition | undefined {
  return INDUSTRY_REGISTRY[slug];
}

export function getIndustryByEnum(enumVal: string): FullIndustryDefinition | undefined {
  return Object.values(INDUSTRY_REGISTRY).find((i) => i.enum === enumVal);
}

export function getAllIndustries(): FullIndustryDefinition[] {
  return Object.values(INDUSTRY_REGISTRY);
}

export function getIndustryModes(slug: string): string[] {
  return getIndustry(slug)?.modes.map((m) => m.slug) ?? [];
}

export function getIndustryModules(slug: string): string[] {
  return getIndustry(slug)?.modules.map((m) => m.slug) ?? [];
}

export function getModulesForMode(industrySlug: string, modeSlug: string): string[] {
  const industry = getIndustry(industrySlug);
  if (!industry) return [];

  const modules = [...industry.requiredModules];

  switch (industrySlug) {
    case "commerce":
      switch (modeSlug) {
        case "retail":
          modules.push("pos", "inventory", "customers", "sales", "pricing", "barcode", "payments", "returns", "crm");
          break;
        case "wholesale":
          modules.push("inventory", "customers", "sales", "purchasing", "suppliers", "pricing", "promotions", "delivery", "crm");
          break;
        case "retail-wholesale":
          modules.push("pos", "inventory", "customers", "sales", "purchasing", "suppliers", "pricing", "promotions", "barcode", "payments", "delivery", "returns", "crm");
          break;
        case "distribution":
          modules.push("inventory", "sales", "purchasing", "suppliers", "pricing", "delivery", "payments");
          break;
        case "trading":
          modules.push("inventory", "sales", "purchasing", "suppliers", "pricing", "payments");
          break;
        case "ecommerce":
          modules.push("inventory", "customers", "sales", "pricing", "promotions", "payments", "delivery", "returns", "crm");
          break;
      }
      break;
    case "restaurant":
      switch (modeSlug) {
        case "restaurant":
          modules.push("menu", "kitchen", "tables", "reservations", "qr-ordering", "pos", "inventory", "recipes", "ingredients", "delivery");
          break;
        case "cafe":
        case "bakery":
          modules.push("menu", "pos", "inventory", "recipes", "ingredients", "qr-ordering");
          break;
        case "bar":
          modules.push("menu", "tables", "pos", "inventory", "recipes");
          break;
        case "hotel-restaurant":
          modules.push("menu", "kitchen", "tables", "reservations", "pos", "inventory", "recipes", "ingredients");
          break;
        case "food-truck":
        case "fast-food":
          modules.push("menu", "pos", "inventory", "recipes", "ingredients");
          break;
        case "cloud-kitchen":
          modules.push("menu", "kitchen", "inventory", "recipes", "ingredients", "delivery", "qr-ordering");
          break;
      }
      break;
    case "education":
      modules.push("admissions", "students", "teachers", "attendance", "examinations", "finance", "library");
      switch (modeSlug) {
        case "nursery":
        case "day-care":
          modules.push("meals", "medical", "parents");
          break;
        case "primary":
        case "secondary":
          modules.push("parents", "transport", "meals", "medical", "homework", "ai-reading", "ai-pronunciation");
          break;
        case "college":
          modules.push("transport", "homework", "ai-teacher");
          break;
        case "university":
          modules.push("transport", "ai-teacher");
          break;
        case "training-center":
          modules.push("ai-teacher");
          break;
      }
      break;
    case "healthcare":
      modules.push("patients", "appointments", "doctors", "billing", "medical-records");
      switch (modeSlug) {
        case "pharmacy":
          modules.push("pharmacy");
          break;
        case "laboratory":
          modules.push("laboratory");
          break;
        case "dental":
          break;
        case "veterinary":
          break;
      }
      break;
    case "manufacturing":
      modules.push("production", "bom", "mrp", "work-orders", "quality-control", "warehouse", "inventory", "purchasing", "suppliers");
      break;
    case "agriculture":
      switch (modeSlug) {
        case "farm":
          modules.push("crops", "farm-inventory", "harvest", "sales");
          break;
        case "livestock":
          modules.push("livestock", "feeds", "farm-inventory", "sales");
          break;
        case "poultry":
          modules.push("livestock", "feeds", "farm-inventory", "sales");
          break;
        case "dairy":
          modules.push("livestock", "feeds", "farm-inventory", "sales");
          break;
        case "agro-dealer":
          modules.push("inventory", "sales", "purchasing", "suppliers");
          break;
      }
      break;
    case "services":
      modules.push("appointments", "invoices", "payments");
      switch (modeSlug) {
        case "construction":
          modules.push("projects", "staff");
          break;
        case "consultancy":
        case "agency":
          modules.push("projects");
          break;
      }
      break;
    case "logistics":
      modules.push("fleet", "drivers", "routes", "deliveries", "tracking", "fuel");
      break;
    case "real-estate":
      modules.push("properties", "tenants", "rent", "maintenance", "contracts");
      break;
    case "non-profit":
      modules.push("members", "donations", "projects", "events");
      break;
  }

  return [...new Set(modules)];
}
