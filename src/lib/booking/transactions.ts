export type TransactionState =
  | "PENDING"
  | "QUOTED"
  | "HELD"
  | "RESERVATION_PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";
export type BookingTransaction = {
  id: string;
  tenantId: string;
  propertyId: string;
  idempotencyKey: string;
  state: TransactionState;
  quoteId?: string;
  holdId?: string;
  reservationReference?: string;
  verifiedReservation?: boolean;
  verifiedPayment?: boolean;
  paymentRequired: boolean;
};
const transitions: Record<TransactionState, TransactionState[]> = {
  PENDING: ["QUOTED", "FAILED"],
  QUOTED: ["HELD", "FAILED"],
  HELD: ["RESERVATION_PENDING", "FAILED"],
  RESERVATION_PENDING: ["PAYMENT_PENDING", "CONFIRMED", "FAILED", "REFUND_PENDING"],
  PAYMENT_PENDING: ["CONFIRMED", "FAILED", "REFUND_PENDING"],
  CONFIRMED: ["REFUND_PENDING"],
  FAILED: ["REFUND_PENDING"],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
};
export function transitionTransaction(transaction: BookingTransaction, state: TransactionState) {
  if (!transitions[transaction.state].includes(state))
    throw new Error("Invalid transaction transition.");
  if (
    state === "CONFIRMED" &&
    (!transaction.verifiedReservation ||
      !transaction.reservationReference ||
      (transaction.paymentRequired && !transaction.verifiedPayment))
  )
    throw new Error("Verified reservation/payment required for confirmation.");
  if (state === "FAILED" && transaction.verifiedPayment) state = "REFUND_PENDING";
  return { ...transaction, state };
}
/** Production implementation must atomically scope unique idempotency keys and webhook event IDs per tenant. */
export interface BookingTransactionStore {
  begin(transaction: BookingTransaction): Promise<BookingTransaction>;
  compareAndSet(
    tenantId: string,
    id: string,
    expected: TransactionState,
    next: BookingTransaction,
  ): Promise<boolean>;
  claimWebhook(tenantId: string, gatewayEventId: string): Promise<boolean>;
}
