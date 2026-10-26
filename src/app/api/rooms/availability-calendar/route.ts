import { readLimitedText } from "@/lib/api/body";
import { requestOrigin } from "@/lib/api/origin";
import { getWebsiteProvider } from "@/lib/api/provider";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { parseAvailabilitySearch } from "@/lib/booking/search";

type Body = { slug?: unknown; month?: unknown };
const iso = (date: Date) => date.toISOString().slice(0, 10);

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
  if (
    typeof body.slug !== "string" ||
    !/^[a-z0-9-]{1,100}$/.test(body.slug) ||
    typeof body.month !== "string" ||
    !/^\d{4}-\d{2}$/.test(body.month)
  )
    return Response.json({ error: "Invalid request." }, { status: 400 });
  const first = new Date(`${body.month}-01T00:00:00Z`);
  if (Number.isNaN(first.getTime()) || iso(first).slice(0, 7) !== body.month)
    return Response.json({ error: "Invalid month." }, { status: 400 });
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 2, 0));

  try {
    const tenant = await resolveTenant();
    const provider = getWebsiteProvider();
    const hotel = await provider.getHotel(tenant);
    const dates: string[] = [];
    for (let cursor = new Date(first); cursor <= last; cursor.setUTCDate(cursor.getUTCDate() + 1))
      dates.push(iso(cursor));
    const available: string[] = [];
    for (let index = 0; index < dates.length; index += 6) {
      const results = await Promise.all(
        dates.slice(index, index + 6).map(async (checkIn) => {
          const checkOutDate = new Date(`${checkIn}T00:00:00Z`);
          checkOutDate.setUTCDate(
            checkOutDate.getUTCDate() + (hotel.bookingSettings?.minStay ?? 1),
          );
          const parsed = parseAvailabilitySearch(
            { checkIn, checkOut: iso(checkOutDate), guests: "1", rooms: "1" },
            hotel.bookingSettings,
            hotel.timeZone,
          );
          if (!parsed.search) return null;
          const rooms = await provider.searchAvailability(tenant, parsed.search);
          const room = rooms.find(
            (item) =>
              item.slug === body.slug &&
              item.visible !== false &&
              item.availabilityStatus !== "sold-out",
          );
          return room?.ratePlans.some(
            (rate) => rate.visible !== false && rate.available && (rate.inventoryCount ?? 1) > 0,
          )
            ? checkIn
            : null;
        }),
      );
      available.push(...results.filter((date): date is string => Boolean(date)));
    }
    return Response.json({ available }, { headers: { "cache-control": "private, max-age=30" } });
  } catch {
    return Response.json({ error: "Availability calendar could not be loaded." }, { status: 502 });
  }
}
