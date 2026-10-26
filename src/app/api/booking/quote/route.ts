import { readLimitedText } from "@/lib/api/body";
import { requestOrigin } from "@/lib/api/origin";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getWebsiteProvider } from "@/lib/api/provider";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { parseCartItems, resolveCart } from "@/lib/booking/cart";
import { getBookingBackend, ExternalDependencyError, validateQuote } from "@/lib/booking/backend";
import { validatePromotion } from "@/lib/booking/promotions";
import { pageEnabled } from "@/lib/website/pages";
import { allowRequest } from "@/lib/api/rateLimit";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== requestOrigin(request))
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const tenant = await resolveTenant();
  if (!allowRequest(`quote:${tenant.id}`, 60))
    return Response.json({ error: "Please wait before retrying." }, { status: 429 });
  let input;
  try {
    const raw = await readLimitedText(request, 8000);
    if (raw.length > 8000) throw new Error();
    input = JSON.parse(raw);
    if (
      !input ||
      typeof input.query !== "string" ||
      (input.promotionCode !== undefined && typeof input.promotionCode !== "string")
    )
      throw new Error();
  } catch {
    return Response.json({ error: "Invalid quote request." }, { status: 400 });
  }
  try {
    const provider = getWebsiteProvider();
    const hotel = await provider.getHotel(tenant);
    if (!hotel.configured || !pageEnabled(hotel, "booking"))
      return Response.json({ error: "Booking unavailable." }, { status: 404 });
    const query = new URLSearchParams(input.query);
    const params = Object.fromEntries(query.entries()) as Record<string, string | string[]>;
    params.item = query.getAll("item");
    const search = parseAvailabilitySearch(params, hotel.bookingSettings, hotel.timeZone).search;
    const items = parseCartItems(params);
    if (!search || !items?.length)
      return Response.json({ error: "Invalid stay or room selection." }, { status: 422 });
    const rooms = await provider.searchAvailability(tenant, search);
    const cart = resolveCart(search, rooms, params);
    if (!cart)
      return Response.json({ error: "Room selection is no longer available." }, { status: 409 });
    const selected = items.map((item) => {
      const room = rooms.find((room) => room.slug === item.roomSlug)!;
      return { roomTypeId: room.id, rateId: item.rateId, quantity: item.quantity };
    });
    const extraIds = query.getAll("extra");
    if (extraIds.some((id) => !hotel.extras?.some((extra) => extra.id === id)))
      return Response.json({ error: "Invalid extra." }, { status: 422 });
    if (input.promotionCode)
      validatePromotion(
        hotel.website?.promotions ?? [],
        input.promotionCode,
        search.checkIn,
        selected.map((room) => room.roomTypeId),
        Math.round((Date.parse(search.checkOut) - Date.parse(search.checkIn)) / 86400000),
      );
    const scope = { tenantId: tenant.id, propertyId: hotel.id };
    const quote = validateQuote(
      await getBookingBackend().quote({
        ...scope,
        search,
        rooms: selected,
        extraIds,
        promotionCode: input.promotionCode,
      }),
      scope,
    );
    return Response.json({ quote }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ExternalDependencyError
            ? error.message
            : "Quote unavailable. Please retry or contact the hotel.",
      },
      { status: 503 },
    );
  }
}
