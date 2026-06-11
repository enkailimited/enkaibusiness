// Types
export type {
  Customer,
  CustomerWithGroup,
  CustomerWithRelations,
  CustomerFilter,
  CreateCustomerInput,
  CustomerType,
} from "./types";

// Constants
export {
  CUSTOMER_TYPES,
  CUSTOMER_TYPE_LABELS,
  CUSTOMER_SORT_OPTIONS,
  DEFAULT_PAGE_SIZE,
} from "./constants";

// Schemas
export {
  createCustomerSchema,
  updateCustomerSchema,
  customerFilterSchema,
  customerTypeEnum,
} from "./schemas";
export type {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerFilterSchema,
} from "./schemas";

// Services
export {
  createCustomer,
  updateCustomer,
  getCustomer,
  listCustomers,
  deleteCustomer,
} from "./services/customer-service";

// Actions
export {
  createCustomerAction,
  updateCustomerAction,
  getCustomerAction,
  listCustomersAction,
  deleteCustomerAction,
} from "./actions";

// Components
export { CustomerList } from "./components/customer-list";
export { CustomerForm } from "./components/customer-form";
