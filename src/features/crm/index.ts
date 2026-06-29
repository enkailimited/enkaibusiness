export type {
  Contact,
  Organization,
  Address,
  CommunicationLog,
  ContactWithRelations,
  OrganizationWithContacts,
  CreateContactInput,
  UpdateContactInput,
  CreateOrganizationInput,
  CreateAddressInput,
  CreateCommunicationLogInput,
} from "./types";

export {
  CONTACT_TYPES,
  ADDRESS_TYPES,
  COMMUNICATION_TYPES,
  COMMUNICATION_DIRECTIONS,
  DEFAULT_COUNTRY,
} from "./constants";
export type {
  ContactType,
  AddressType,
  CommunicationType,
  CommunicationDirection,
} from "./constants";

export {
  createContactSchema,
  updateContactSchema,
  createOrganizationSchema,
  createAddressSchema,
  createCommunicationLogSchema,
} from "./schemas";
export type {
  CreateContactSchema,
  UpdateContactSchema,
  CreateOrganizationSchema,
  CreateAddressSchema,
  CreateCommunicationLogSchema,
} from "./schemas";

export {
  createContact,
  updateContact,
  getContact,
  listContacts,
  deleteContact,
} from "./services/contact-service";
