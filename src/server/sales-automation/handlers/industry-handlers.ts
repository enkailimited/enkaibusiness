import "server-only";
import { prisma } from "@/server/db";
import { firdausEventBus } from "@/modules/ai/events/event-bus";
import { getModulesForMode } from "@/server/industry/registry";

const INDUSTRY_CHECKLISTS: Record<string, Record<string, string[]>> = {
  COMMERCE: {
    qualification: ["Business type (retail/wholesale/distribution)", "Estimated monthly transaction volume", "Current POS system", "Number of products/SKUs", "Number of employees", "Multiple branches?"],
    demo: ["POS walkthrough", "Inventory management", "Customer management", "Sales reporting", "QR menu ordering (if applicable)"],
    training: ["POS operations", "Inventory management", "Sales reports", "Customer management", "Basic troubleshooting"],
    installation: ["POS terminal setup", "Barcode scanner", "Receipt printer", "Network configuration", "Cash drawer setup"],
    compliance: [],
    goLive: ["Test transaction", "Verify receipt printing", "Check inventory sync", "Customer account creation"],
  },
  RESTAURANT: {
    qualification: ["Restaurant type (quick service/full service)", "Number of tables/capacity", "Current order system", "Menu size", "Delivery partners", "Kitchen setup"],
    demo: ["Table management", "Order entry flow", "Kitchen display", "Menu management", "QR ordering", "Payment processing"],
    training: ["Table management", "Order taking", "Kitchen ticket system", "Menu updates", "Payment processing"],
    installation: ["Kitchen display setup", "POS terminal(s)", "Receipt printers", "QR code table setup", "Network configuration"],
    compliance: ["Food safety display requirements", "Tax configuration for food items"],
    goLive: ["Place test order", "Verify kitchen ticket", "Check QR menu", "Process test payment"],
  },
  HEALTHCARE: {
    qualification: ["Practice type (clinic/hospital/pharmacy)", "Number of patients/day", "Current EMR system", "Insurance providers", "Compliance requirements", "Staff size"],
    demo: ["Patient registration", "Appointment scheduling", "Billing/insurance", "Pharmacy integration", "Lab results management"],
    training: ["Patient records", "Appointment management", "Insurance billing", "Pharmacy operations", "Compliance protocols"],
    installation: ["Server/workstation setup", "Network security configuration", "Printer/device setup", "Backup system configuration"],
    compliance: ["HIPAA/data protection verification", "Patient privacy protocols", "Data backup verification", "Audit trail configuration"],
    goLive: ["Register test patient", "Process test appointment", "Generate test invoice", "Verify insurance claim"],
  },
  EDUCATION: {
    qualification: ["Institution type (school/college/training)", "Number of students", "Current SIS system", "Fee structure", "Academic calendar", "Parent communication needs"],
    demo: ["Student management", "Fee tracking", "Academic records", "Parent portal", "Timetable management"],
    training: ["Student enrollment", "Fee collection", "Grade entry", "Report generation", "Parent communication"],
    installation: ["Workstation setup", "Network configuration", "Printer/ID card setup", "Server configuration"],
    compliance: ["Data protection for minors", "Records retention policy", "Parental consent protocols"],
    goLive: ["Enroll test student", "Process test fee", "Generate report card", "Test parent portal access"],
  },
  MANUFACTURING: {
    qualification: ["Production type (make-to-order/make-to-stock)", "Product categories", "Number of raw materials", "Production capacity", "Quality control needs", "Current ERP"],
    demo: ["BOM management", "Production planning", "Quality control", "Inventory tracking", "Order management"],
    training: ["BOM setup", "Production order processing", "Quality inspection", "Inventory management", "Reporting"],
    installation: ["Workstation setup", "Scanner/printer setup", "Network infrastructure", "Integration setup"],
    compliance: ["Quality standards verification", "Safety compliance", "Traceability requirements"],
    goLive: ["Create test production order", "Process quality check", "Verify inventory update", "Test reporting"],
  },
  AGRICULTURE: {
    qualification: ["Farm type (crops/livestock/mixed)", "Farm size/hectares", "Number of products", "Current record-keeping method", "Distribution channels"],
    demo: ["Crop management", "Livestock tracking", "Harvest recording", "Sales management", "Inventory tracking"],
    training: ["Farm data entry", "Harvest recording", "Sales processing", "Inventory management"],
    installation: ["Mobile device setup", "Field data collection tools", "Network/offline configuration"],
    compliance: ["Organic certification tracking", "Pesticide usage recording", "Traceability setup"],
    goLive: ["Record test harvest", "Process test sale", "Verify inventory update"],
  },
  SERVICES: {
    qualification: ["Service type", "Number of service providers", "Appointment volume", "Current booking system", "Service catalog size"],
    demo: ["Appointment scheduling", "Service provider management", "Payment processing", "Customer management"],
    training: ["Scheduling", "Service delivery tracking", "Payment processing", "Reporting"],
    installation: ["Workstation setup", "Mobile app configuration", "Payment terminal setup"],
    compliance: ["Service level agreement tracking", "Consumer protection compliance"],
    goLive: ["Create test appointment", "Process test service", "Generate invoice"],
  },
  LOGISTICS: {
    qualification: ["Fleet size", "Delivery volume/day", "Service area", "Current tracking system", "Warehouse capacity"],
    demo: ["Fleet management", "Route optimization", "Delivery tracking", "Warehouse management", "Driver management"],
    training: ["Dispatch operations", "Driver app usage", "Warehouse operations", "Customer tracking portal"],
    installation: ["Dispatch center setup", "Driver mobile app", "GPS/telematics setup", "Warehouse scanners"],
    compliance: ["Vehicle compliance", "Driver certification tracking", "Insurance verification"],
    goLive: ["Process test dispatch", "Track test delivery", "Verify proof of delivery"],
  },
  REAL_ESTATE: {
    qualification: ["Property type (residential/commercial)", "Portfolio size", "Current CRM", "Number of agents", "Rental/ Sales mix"],
    demo: ["Property listing management", "Tenant management", "Rent collection", "Maintenance tracking", "Agent management"],
    training: ["Listing management", "Tenant onboarding", "Rent processing", "Maintenance requests"],
    installation: ["Office setup", "Mobile app configuration", "Payment terminal setup"],
    compliance: ["Tenancy agreement compliance", "Property licensing verification", "Data protection"],
    goLive: ["Add test property", "Process test rent", "Generate lease document"],
  },
  NON_PROFIT: {
    qualification: ["Organization type", "Number of beneficiaries", "Funding sources", "Current database", "Reporting requirements"],
    demo: ["Donor management", "Beneficiary tracking", "Fund accounting", "Grant management", "Volunteer coordination"],
    training: ["Donor records", "Fund tracking", "Reporting", "Volunteer management"],
    installation: ["Workstation setup", "Database migration support", "Network setup"],
    compliance: ["Donor privacy compliance", "Fund reporting requirements", "Audit trail configuration"],
    goLive: ["Register test donor", "Record test donation", "Generate fund report"],
  },
};

const DEFAULT_CHECKLIST: Record<string, string[]> = {
  qualification: ["Business name", "Contact information", "Business size", "Location"],
  demo: ["Platform overview", "Core feature walkthrough", "Q&A session"],
  training: ["Basic platform navigation", "Core feature training"],
  installation: ["Account setup", "Basic configuration"],
  compliance: [],
  goLive: ["Account verification", "Test transaction"],
};

function getChecklist(industry: string, type: string): string[] {
  return INDUSTRY_CHECKLISTS[industry]?.[type] ?? DEFAULT_CHECKLIST[type] ?? [];
}

export function getIndustryChecklist(industry: string, type: "qualification" | "demo" | "training" | "installation" | "compliance" | "goLive"): string[] {
  return getChecklist(industry.toUpperCase(), type);
}

export function getIndustryModules(industry: string, mode: string): string[] {
  try {
    const modules = getModulesForMode(industry, mode);
    return modules ?? [];
  } catch {
    return [];
  }
}

export function registerIndustryAutomation(): void {
  firdausEventBus.on("BusinessCreated", async (event) => {
    try {
      const { industry, modes } = event.data as { industry?: string; modes?: string[] };

      if (!industry) return;
      const industryKey = industry.toUpperCase();

      const qualificationChecklist = getChecklist(industryKey, "qualification");
      if (qualificationChecklist.length > 0) {
        await prisma.leadActivity.create({
          data: {
            leadId: event.entityId,
            action: "INDUSTRY_CHECKLIST",
            detail: `Industry: ${industry}. Qualification checklist: ${qualificationChecklist.join(", ")}`,
            createdById: event.userId,
          },
        }).catch(() => {});
      }

      if (modes && modes.length > 0) {
        for (const mode of modes) {
          try {
            const modules = getIndustryModules(industry, mode);
            if (modules.length > 0) {
              await prisma.leadActivity.create({
                data: {
                  leadId: event.entityId,
                  action: "INDUSTRY_MODULES",
                  detail: `Mode: ${mode}. Required modules: ${modules.join(", ")}`,
                  createdById: event.userId,
                },
              }).catch(() => {});
            }
          } catch {}
        }
      }
    } catch {}
  });

  firdausEventBus.on("DistributorAssigned", async (event) => {
    try {
      const modes = await prisma.businessMode.findMany({
        where: { businessId: event.businessId },
        select: { industry: true },
        take: 1,
      });
      const industry = modes[0]?.industry;
      if (!industry) return;

      const industryKey = industry.toUpperCase();
      const installChecklist = getChecklist(industryKey, "installation");
      const trainingChecklist = getChecklist(industryKey, "training");
      const complianceChecklist = getChecklist(industryKey, "compliance");

      const ticket = await prisma.installationTicket.findUnique({
        where: { id: event.entityId },
        select: { id: true },
      });
      if (!ticket) return;

      const existingTasks = await prisma.installationTask.count({
        where: { ticketId: ticket.id, category: { in: ["setup", "training"] } },
      });
      if (existingTasks > 0) return;

      const tasks: Array<{ ticketId: string; name: string; category: string; sortOrder: number; isCompleted: boolean; notes?: string }> = [
        ...installChecklist.map((item, idx) => ({
          ticketId: ticket.id,
          name: item,
          category: "setup" as const,
          sortOrder: idx + 100,
          isCompleted: false,
        })),
        ...trainingChecklist.map((item, idx) => ({
          ticketId: ticket.id,
          name: item,
          category: "training" as const,
          sortOrder: idx + 200,
          isCompleted: false,
        })),
      ];

      if (tasks.length > 0) {
        await prisma.installationTask.createMany({ data: tasks as any }).catch(() => {});
      }

      if (complianceChecklist.length > 0) {
        await prisma.installationTask.create({
          data: {
            ticketId: ticket.id,
            name: "Compliance Checks",
            category: "testing",
            sortOrder: 300,
            isCompleted: false,
            notes: complianceChecklist.join(", "),
          },
        }).catch(() => {});
      }
    } catch {}
  });
}
