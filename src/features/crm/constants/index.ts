export const CONTACT_TYPES = ["individual", "organization"] as const;

export const ADDRESS_TYPES = ["billing", "shipping", "physical", "postal"] as const;

export const COMMUNICATION_TYPES = ["email", "sms", "call", "note", "meeting"] as const;

export const COMMUNICATION_DIRECTIONS = ["inbound", "outbound"] as const;

export const DEFAULT_COUNTRY = "Tanzania";

export type ContactType = (typeof CONTACT_TYPES)[number];
export type AddressType = (typeof ADDRESS_TYPES)[number];
export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export type CommunicationDirection = (typeof COMMUNICATION_DIRECTIONS)[number];
