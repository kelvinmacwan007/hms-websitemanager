import "server-only";
import type { AvailabilitySearch, Money } from "../../types/hotel";

export class ExternalDependencyError extends Error {
  constructor(capability: string) {
    super(`BLOCKED EXTERNAL DEPENDENCY: verified ${capability} service is not configured.`);
  }
}
export type BookingScope = { tenantId: string; propertyId: string };
export type QuoteRequest = BookingScope & {
  search: AvailabilitySearch;
  rooms: { roomTypeId: string; rateId: string; quantity: number }[];
  extraIds: string[];
  promotionCode?: string;
};
export type AuthoritativeQuote = BookingScope & {
  id: string;
  expiresAt: string;
  search: AvailabilitySearch;
  lines: { roomTypeId: string; rateId: string; quantity: number; nightly: Money[] }[];
  subtotal: Money;
  taxes: Money;
  fees: Money;
  extras: Money;
  discount: Money;
  total: Money;
  authoritative: true;
};
export type InventoryHold = BookingScope & {
  id: string;
  quoteId: string;
  expiresAt: string;
  status: "held" | "released" | "expired";
};
export type ReservationGuest = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
};
export type VerifiedReservation = BookingScope & {
  reference: string;
  quoteId: string;
  status: "confirmed";
  verified: true;
  guest: ReservationGuest;
  quote: AuthoritativeQuote;
  paymentState: "paid" | "pay-at-property";
};
export interface BookingBackend {
  quote(request: QuoteRequest): Promise<AuthoritativeQuote>;
  createHold(scope: BookingScope, quoteId: string, idempotencyKey: string): Promise<InventoryHold>;
  getHold(scope: BookingScope, holdId: string): Promise<InventoryHold>;
  releaseHold(scope: BookingScope, holdId: string, idempotencyKey: string): Promise<void>;
  expireHold(scope: BookingScope, holdId: string): Promise<void>;
  createReservation(
    input: BookingScope & {
      quoteId: string;
      holdId: string;
      guest: ReservationGuest;
      idempotencyKey: string;
    },
  ): Promise<VerifiedReservation>;
  getReservation(
    scope: BookingScope,
    reference: string,
    accessToken: string,
  ): Promise<VerifiedReservation | null>;
}

/** Deliberately fails closed. There are no verified quote/hold/write contracts in this repository. */
export function getBookingBackend(): BookingBackend {
  const unavailable = async (): Promise<never> => {
    throw new ExternalDependencyError("PMS quote, inventory hold and reservation");
  };
  return {
    quote: unavailable,
    createHold: unavailable,
    getHold: unavailable,
    releaseHold: unavailable,
    expireHold: unavailable,
    createReservation: unavailable,
    getReservation: unavailable,
  };
}

export function validateQuote(quote: AuthoritativeQuote, scope: BookingScope, now = Date.now()) {
  if (
    !quote ||
    quote.authoritative !== true ||
    quote.tenantId !== scope.tenantId ||
    quote.propertyId !== scope.propertyId ||
    !quote.id ||
    !Number.isFinite(Date.parse(quote.expiresAt)) ||
    Date.parse(quote.expiresAt) <= now ||
    !quote.lines.length
  )
    throw new Error("Invalid or expired authoritative quote.");
  const currency = quote.total.currency;
  const amounts = [
    quote.subtotal,
    quote.taxes,
    quote.fees,
    quote.extras,
    quote.discount,
    quote.total,
    ...quote.lines.flatMap((line) => line.nightly),
  ];
  if (
    !/^[A-Z]{3}$/.test(currency) ||
    amounts.some(
      (money) => money.currency !== currency || !Number.isFinite(money.amount) || money.amount < 0,
    ) ||
    quote.lines.some(
      (line) =>
        !line.roomTypeId ||
        !line.rateId ||
        !Number.isInteger(line.quantity) ||
        line.quantity < 1 ||
        line.nightly.length < 1,
    ) ||
    Math.abs(
      quote.subtotal.amount +
        quote.taxes.amount +
        quote.fees.amount +
        quote.extras.amount -
        quote.discount.amount -
        quote.total.amount,
    ) > 0.005
  )
    throw new Error("Invalid quote amounts or room lines.");
  return quote;
}
