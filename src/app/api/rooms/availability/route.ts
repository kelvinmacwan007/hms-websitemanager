import { readLimitedText } from "@/lib/api/body";
import { requestOrigin } from "@/lib/api/origin";
import { getWebsiteProvider } from "@/lib/api/provider";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

type Body = {
  slug?: unknown;
  checkIn?: unknown;
  checkOut?: unknown;
  guests?: unknown;
  rooms?: unknown;
  adults?: unknown;
  children?: unknown;
  pets?: unknown;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin(request))
    return Response.json({ error: "Invalid origin." }, { status: 403 });

  let body: Body;
  try {
    body = JSON.parse(await readLimitedText(request, 8000)) as Body;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Invalid request." }, { status: 400 });
  if (typeof body.slug !== "string" || !/^[a-z0-9-]{1,100}$/.test(body.slug))
    return Response.json({ error: "Invalid room." }, { status: 400 });
  if (
    (["adults", "children", "pets"] as const).some(
      (key) => body[key] !== undefined && !["number", "string"].includes(typeof body[key]),
    )
  )
    return Response.json({ error: "Invalid guest counts." }, { status: 400 });
  try {
    const tenant = await resolveTenant();
    const provider = getWebsiteProvider();
    const hotel = await provider.getHotel(tenant);
    const { search, error } = parseAvailabilitySearch(
      {
        checkIn: typeof body.checkIn === "string" ? body.checkIn : "",
        checkOut: typeof body.checkOut === "string" ? body.checkOut : "",
        guests: String(body.guests ?? ""),
        rooms: String(body.rooms ?? ""),
        ...Object.fromEntries(
          (["adults", "children", "pets"] as const)
            .filter((key) => body[key] !== undefined)
            .map((key) => [key, String(body[key])]),
        ),
      },
      hotel.bookingSettings,
      hotel.timeZone,
    );
    if (!search) return Response.json({ error: error ?? "Invalid stay." }, { status: 400 });

    const availableRooms = await provider.searchAvailability(tenant, search);
    const room = availableRooms.find(
      (item) =>
        item.slug === body.slug && item.visible !== false && item.availabilityStatus !== "sold-out",
    );
    const rates =
      room?.ratePlans
        .filter(
          (rate) =>
            rate.visible !== false &&
            rate.available &&
            (rate.inventoryCount ?? Number.POSITIVE_INFINITY) >= search.rooms,
        )
        .map((rate) => ({ id: rate.id, name: rate.name, price: rate.price })) ?? [];
    return Response.json(
      {
        available: Boolean(
          room &&
          rates.length &&
          room.occupancy * search.rooms >= search.guests &&
          (!search.pets || room.petsAllowed !== false),
        ),
        rates,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Availability could not be checked. Please try again." },
      { status: 502 },
    );
  }
}
