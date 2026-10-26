import "server-only";
import {
  ExternalDependencyError,
  type BookingScope,
  type AuthoritativeQuote,
} from "../booking/backend";

export type PaymentSession = BookingScope & {
  id: string;
  hostedUrl: string;
  quoteId: string;
  expiresAt: string;
};
export type VerifiedPayment = BookingScope & {
  id: string;
  quoteId: string;
  amount: number;
  currency: string;
  status: "pending" | "authorized" | "captured" | "failed" | "refunded" | "voided";
  verified: true;
};
export interface PaymentGateway {
  createPaymentSession(quote: AuthoritativeQuote, idempotencyKey: string): Promise<PaymentSession>;
  verifyPayment(scope: BookingScope, sessionId: string): Promise<VerifiedPayment>;
  handleWebhook(
    rawBody: Uint8Array,
    headers: Headers,
  ): Promise<{ eventId: string; payment: VerifiedPayment }>;
  capturePayment(payment: VerifiedPayment, idempotencyKey: string): Promise<VerifiedPayment>;
  refundPayment(payment: VerifiedPayment, idempotencyKey: string): Promise<VerifiedPayment>;
  voidPayment(payment: VerifiedPayment, idempotencyKey: string): Promise<VerifiedPayment>;
}
export function getPaymentGateway(): PaymentGateway {
  const unavailable = async (): Promise<never> => {
    throw new ExternalDependencyError("hosted/tokenized payment gateway and signed webhook");
  };
  return {
    createPaymentSession: unavailable,
    verifyPayment: unavailable,
    handleWebhook: unavailable,
    capturePayment: unavailable,
    refundPayment: unavailable,
    voidPayment: unavailable,
  };
}
