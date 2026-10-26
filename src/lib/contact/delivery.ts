import "server-only";
import type { Hotel } from "../../types/hotel";
import { ExternalDependencyError } from "../booking/backend";
export type ContactEnquiry = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  enquiry: string;
  message: string;
};
export interface ContactDelivery {
  deliver(
    tenantId: string,
    recipient: string,
    enquiry: ContactEnquiry,
  ): Promise<{ messageId: string }>;
}
export function validateEnquiry(input: unknown): ContactEnquiry {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid enquiry.");
  const result = {} as ContactEnquiry;
  for (const key of ["firstName", "lastName", "email", "phone", "enquiry", "message"] as const) {
    const value = (input as Record<string, unknown>)[key];
    if (
      typeof value !== "string" ||
      value.length > (key === "message" ? 5000 : 200) ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
    )
      throw new Error("Invalid enquiry field.");
    result[key] = value.trim();
  }
  if (
    !result.firstName ||
    !result.lastName ||
    !result.message ||
    !/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(result.email) ||
    /[\r\n]/.test(result.firstName + result.lastName + result.phone) ||
    !["", "reservation", "dining", "groups", "special", "other"].includes(result.enquiry)
  )
    throw new Error("Please check your enquiry details.");
  return result;
}
export function enquiryRecipient(hotel: Hotel) {
  const email = hotel.contact.enquiryEmail || hotel.contact.email;
  if (!email || !/^[^\s@\r\n]+@[^\s@\r\n]+\.[^\s@\r\n]+$/.test(email))
    throw new Error("Hotel enquiry recipient unavailable.");
  return email;
}
export function getContactDelivery(): ContactDelivery {
  return {
    async deliver() {
      throw new ExternalDependencyError("email delivery provider");
    },
  };
}
