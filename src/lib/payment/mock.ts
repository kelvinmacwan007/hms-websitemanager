import type { PaymentSummary, PaymentStatus } from "./types";

export function simulatePayment(
  amount: number,
  currency: string,
  status: PaymentStatus,
): PaymentSummary {
  if (!Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Invalid demo payment amount.");
  }
  return { amount, currency, status, simulated: true };
}
