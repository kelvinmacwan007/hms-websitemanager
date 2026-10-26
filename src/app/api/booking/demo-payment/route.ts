import { readLimitedText } from "@/lib/api/body";
import { requestOrigin } from "@/lib/api/origin";
import { getWebsiteProvider } from "@/lib/api/provider";
import { isDemoPaymentMode } from "@/lib/payment/demoMode";
import { resolveDemoSelection } from "@/lib/booking/demoSelection";
import { parseAvailabilitySearch } from "@/lib/booking/search";
import { simulatePayment } from "@/lib/payment/mock";
import type { PaymentStatus } from "@/lib/payment/types";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

type RequestBody = { query?: unknown; outcome?: unknown };

export async function POST(request: Request) {
  if (!isDemoPaymentMode()) return Response.json({ error: "Not found." }, { status: 404 });
  const origin = request.headers.get("origin");
  if (origin && origin !== requestOrigin(request)) {
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  }

  let body: RequestBody;
  try {
    body = JSON.parse(await readLimitedText(request, 8000)) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return Response.json({ error: "Invalid request." }, { status: 400 });
  const outcome = body.outcome;
  if (
    typeof body.query !== "string" ||
    body.query.length > 4000 ||
    (outcome !== "approved" && outcome !== "declined" && outcome !== "pending")
  ) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const params = new URLSearchParams(body.query);
  const raw: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    raw[key] = values.length === 1 ? values[0] : values;
  }
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  if (!hotel.configured) return Response.json({ error: "Hotel unavailable." }, { status: 404 });
  const { search } = parseAvailabilitySearch(raw, hotel.bookingSettings, hotel.timeZone);
  if (!search) return Response.json({ error: "Invalid stay." }, { status: 400 });

  const selection = resolveDemoSelection(
    raw,
    hotel,
    await provider.searchAvailability(tenant, search),
  );
  if (!selection)
    return Response.json({ error: "Stay unavailable. Search again." }, { status: 409 });

  const result = simulatePayment(selection.estimate, selection.currency, outcome as PaymentStatus);
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}
