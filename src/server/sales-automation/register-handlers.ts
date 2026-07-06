import "server-only";

export function registerSalesAutomation(): void {
  const { registerLeadAutomation } = require("./handlers/lead-handlers");
  const { registerCommissionAutomation } = require("./handlers/commission-handlers");
  const { registerCustomerSuccessAutomation } = require("./handlers/customer-success-handlers");
  const { registerInstallationAutomation } = require("./handlers/installation-handlers");
  const { registerIndustryAutomation } = require("./handlers/industry-handlers");
  const { registerReportingAutomation } = require("./handlers/reporting-handlers");

  registerLeadAutomation();
  registerCommissionAutomation();
  registerCustomerSuccessAutomation();
  registerInstallationAutomation();
  registerIndustryAutomation();
  registerReportingAutomation();
}

registerSalesAutomation();
