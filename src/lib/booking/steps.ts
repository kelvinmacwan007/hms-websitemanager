export const BOOKING_STEPS = [
  "Cart",
  "Extras",
  "Guest details",
  "Payment",
  "Confirmation",
] as const;
export type BookingStep = 1 | 2 | 3 | 4 | 5;

export function bookingStepHref(step: BookingStep, query: string) {
  const params = new URLSearchParams(query);
  const route =
    step === 1
      ? params.has("item")
        ? "cart"
        : "preview"
      : step === 2
        ? "extras"
        : step === 3
          ? "checkout"
          : step === 4
            ? "payment"
            : "confirmation";
  return `/booking/${route}${params.size ? `?${params}` : ""}`;
}
