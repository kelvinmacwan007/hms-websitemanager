import type { CheckoutGuest } from "./p98pay";

const key = (hotel: string, query: string) => {
  const params = new URLSearchParams(query);
  params.sort();
  return `hms-checkout-guest:${hotel}:${params.toString()}`;
};
const MAX_AGE = 30 * 60 * 1000;

/** Only payment-prefill fields stay in this tab; never store card or payment response data. */
export function saveCheckoutGuest(hotel: string, query: string, guest: CheckoutGuest): void {
  try {
    sessionStorage.setItem(
      key(hotel, query),
      JSON.stringify({
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        savedAt: Date.now(),
      }),
    );
  } catch {
    /* The hosted widget can request missing guest fields directly. */
  }
}
export function readCheckoutGuest(hotel: string, query: string): CheckoutGuest {
  const empty = { firstName: "", lastName: "", email: "" };
  try {
    const stored = sessionStorage.getItem(key(hotel, query));
    if (!stored) return empty;
    const value = JSON.parse(stored);
    if (
      !value ||
      !Number.isFinite(value.savedAt) ||
      Date.now() - value.savedAt > MAX_AGE ||
      value.savedAt > Date.now()
    ) {
      sessionStorage.removeItem(key(hotel, query));
      return empty;
    }
    if (
      ![value.firstName, value.lastName, value.email].every(
        (item) => typeof item === "string" && item.length <= 254,
      )
    )
      return empty;
    return { firstName: value.firstName, lastName: value.lastName, email: value.email };
  } catch {
    return empty;
  }
}
