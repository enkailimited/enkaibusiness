import type {
  Contact,
  Organization,
  Address,
  CommunicationLog,
} from "@/types/models";

export type { Contact, Organization, Address, CommunicationLog };

export interface ContactWithRelations extends Contact {
  organization?: Organization | null;
  addresses?: Address[];
  communicationLogs?: CommunicationLog[];
}

export interface OrganizationWithContacts extends Organization {
  contacts?: Contact[];
}

export interface CreateContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  title?: string;
  organizationId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string | null;
  email?: string;
  phone?: string;
  title?: string | null;
  organizationId?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateOrganizationInput {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  website?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CreateAddressInput {
  contactId?: string;
  businessId?: string;
  type?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

export interface CreateCommunicationLogInput {
  contactId: string;
  type: string;
  subject?: string;
  body?: string;
  direction?: string;
  status?: string;
  referenceId?: string;
}
