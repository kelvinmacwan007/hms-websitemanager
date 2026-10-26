export type PaymentStatus = "approved" | "declined" | "pending";

export type PaymentSummary = {
  amount: number;
  currency: string;
  status: PaymentStatus;
  simulated: true;
};
