// Backward-compatibility re-exports from feature modules
export {
  loginAction,
  registerAction,
  logoutAction,
} from "@/features/auth/actions";

export {
  createWorkspaceAction,
  updateWorkspaceAction,
  getWorkspaceAction,
  listWorkspacesAction,
  deleteWorkspaceAction,
  addWorkspaceMemberAction,
  updateMemberRoleAction,
  removeWorkspaceMemberAction,
} from "@/features/workspaces/actions";

export {
  createBusinessAction,
  updateBusinessAction,
  getBusinessAction,
  getBusinessesAction,
  deleteBusinessAction,
} from "@/features/businesses/actions";

export {
  createBranchAction,
  updateBranchAction,
  getBranchAction,
  listBranchesAction,
  deleteBranchAction,
} from "@/features/branches/actions";

export {
  createStoreAction,
  updateStoreAction,
  getStoreAction,
  listStoresAction,
  deleteStoreAction,
} from "@/features/stores/actions";

export {
  createCatalogItemAction,
  updateCatalogItemAction,
  getCatalogItemAction,
  listCatalogItemsAction,
  deleteCatalogItemAction,
} from "@/features/catalog/actions";

export {
  createRoleAction,
  updateRoleAction,
  deleteRoleAction,
  assignRoleToUserAction,
  removeRoleFromUserAction,
  assignPermissionToRoleAction,
  removePermissionFromRoleAction,
} from "@/features/roles/actions";

export {
  createPermissionAction,
  updatePermissionAction,
  deletePermissionAction,
} from "@/features/permissions/actions";

export {
  getSalesHierarchyAction,
  createSalesHierarchyAction,
  deleteSalesHierarchyAction,
  getSalesProfilesAction,
  createSalesProfileAction,
  updateSalesProfileAction,
  getTeamTreeAction,
} from "@/features/sales-network/actions";

export {
  createLeadAction,
  updateLeadAction,
  getLeadAction,
  listLeadsAction,
  deleteLeadAction,
  assignLeadAction,
  addLeadActivityAction,
  convertLeadAction,
} from "@/features/leads/actions";

export {
  createRuleAction,
  updateRuleAction,
  deleteRuleAction,
  getRulesAction,
  createPayoutAction,
  getPayoutsAction,
  approveEntryAction,
} from "@/features/commissions/actions";

export {
  createCampaignAction,
  updateCampaignAction,
  getCampaignAction,
  listCampaignsAction,
  deleteCampaignAction,
  launchCampaignAction,
  completeCampaignAction,
  cancelCampaignAction,
} from "@/features/qr-ordering/qr-campaigns/actions";

export {
  createPlanAction,
  updatePlanAction,
  getPlanAction,
  listPlansAction,
  deletePlanAction,
  togglePlanActiveAction,
  subscribeAction,
  cancelSubscriptionAction,
  recordPaymentAction,
} from "@/features/subscriptions/actions";

export {
  createTicketAction,
  updateTicketAction,
  getTicketAction,
  listTicketsAction,
  deleteTicketAction,
  assignTicketAction,
  resolveTicketAction,
  closeTicketAction,
} from "@/features/support-tickets/actions";
