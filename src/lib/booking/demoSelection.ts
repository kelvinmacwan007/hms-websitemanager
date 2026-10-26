import { cartQuery, cartSubtotal, resolveCart, type CartLine } from "@/lib/booking/cart";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import type { Hotel, HotelRoom } from "@/types/hotel";
import { selectedAddOnRequests } from "./addOnRequests";
import { stayQuery } from "./party.ts";

type Params = Record<string, string | string[] | undefined>;

export function resolveDemoSelection(params: Params, hotel: Hotel, rooms: HotelRoom[]) {
  const { search } = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone);
  if (!search) return null;
  const isCart = params.item !== undefined;
  let lines: CartLine[] | null;
  if (isCart) {
    lines = resolveCart(search, rooms, params);
  } else {
    const roomSlug = typeof params.room === "string" ? params.room : "";
    const rateId = typeof params.rate === "string" ? params.rate : "";
    lines = resolveCart(search, rooms, { item: JSON.stringify([roomSlug, rateId, search.rooms]) });
  }
  if (!lines) return null;
  const nights =
    (Date.parse(`${search.checkOut}T00:00:00Z`) - Date.parse(`${search.checkIn}T00:00:00Z`)) /
    86400000;
  const selectedIds = new Set(
    Array.isArray(params.extra)
      ? params.extra
      : typeof params.extra === "string"
        ? [params.extra]
        : [],
  );
  const currency = lines[0].rate.price.currency;
  const allIncludeBreakfast = lines.every((line) => /breakfast/i.test(line.rate.mealPlan ?? ""));
  const extras = (hotel.extras ?? []).filter(
    (extra) =>
      selectedIds.has(extra.id) &&
      extra.price.currency === currency &&
      !(extra.id === "breakfast" && allIncludeBreakfast),
  );
  const addOnRequests = selectedAddOnRequests(hotel.addOns ?? [], params.addon).filter(
    ({ item }) => item.price.currency === currency,
  );
  const estimate =
    cartSubtotal(lines, nights) +
    addOnRequests.reduce((sum, { item, quantity }) => sum + item.price.amount * quantity, 0) +
    extras.reduce(
      (sum, extra) => sum + extra.price.amount * (extra.charge === "per-night" ? nights : 1),
      0,
    );
  const query = isCart
    ? cartQuery(search, lines)
    : new URLSearchParams({
        ...Object.fromEntries(stayQuery(search)),
        room: lines[0].room.slug,
        rate: lines[0].rate.id,
      });
  extras.forEach((extra) => query.append("extra", extra.id));
  addOnRequests.forEach(({ item, quantity }) =>
    query.append("addon", JSON.stringify([item.id, quantity])),
  );
  return { search, lines, nights, extras, estimate, currency, query, isCart };
}
