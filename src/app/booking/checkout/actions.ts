"use server";

import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getWebsiteProvider } from "@/lib/api/provider";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { getCheckoutWidgetConfig } from "@/lib/payment/p98payConfig";
import { pageEnabled } from "@/lib/website/pages";
import { allowRequest } from "@/lib/api/rateLimit";

/** Recheck the selected stay without sending guest or card details to HMS. */
export async function prepareTestPayment(
  query: string,
): Promise<{ amount: number; currency: string } | { error: string }> {
  if (!getCheckoutWidgetConfig()) return { error: "Test checkout is unavailable." };
  if (typeof query !== "string" || query.length > 8000) return { error: "Invalid stay selection." };
  const tenant = await resolveTenant();
  if (!allowRequest(`test-payment:${tenant.id}`, 30))
    return { error: "Please wait a moment before trying again." };
  try {
    const provider = getWebsiteProvider();
    const hotel = await provider.getHotel(tenant);
    if (!hotel.configured || !pageEnabled(hotel, "booking"))
      return { error: "Booking is unavailable for this hotel." };
    const input = new URLSearchParams(query);
    const params: Record<string, string | string[]> = Object.fromEntries(input);
    for (const key of ["item", "extra", "addon"])
      if (input.has(key)) params[key] = input.getAll(key);
    const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
    const rooms = search ? await provider.searchAvailability(tenant, search) : [];
    const selection = resolveDemoSelection(params, hotel, rooms);
    if (!selection)
      return {
        error: "Your selected rooms are no longer available. Please choose your stay again.",
      };
    if (
      selection.currency !== "USD" ||
      !Number.isFinite(selection.estimate) ||
      selection.estimate <= 0
    )
      return { error: "This UAT merchant supports positive USD amounts only." };
    return { amount: selection.estimate, currency: selection.currency };
  } catch {
    return { error: "We could not recheck your stay. Please try again." };
  }
}
