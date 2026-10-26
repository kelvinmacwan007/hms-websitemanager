import { readLimitedText } from "@/lib/api/body";
import { requestOrigin } from "@/lib/api/origin";
import { getWebsiteProvider } from "@/lib/api/provider";
import { isMockMode } from "@/lib/api/mode";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { enquiryRecipient, getContactDelivery, validateEnquiry } from "@/lib/contact/delivery";
import { allowRequest } from "@/lib/api/rateLimit";
import { pageEnabled } from "@/lib/website/pages";

export async function POST(request: Request) {
  if (request.headers.get("origin") !== requestOrigin(request))
    return Response.json({ error: "Invalid origin." }, { status: 403 });
  const tenant = await resolveTenant();
  if (!allowRequest(`contact:${tenant.id}`, 20))
    return Response.json({ error: "Please wait before retrying." }, { status: 429 });
  let enquiry;
  try {
    const raw = await readLimitedText(request, 10000);
    if (raw.length > 10_000) throw new Error();
    enquiry = validateEnquiry(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Please check your enquiry details." }, { status: 400 });
  }
  try {
    const hotel = await getWebsiteProvider().getHotel(tenant);
    if (!hotel.configured || !pageEnabled(hotel, "contact"))
      return Response.json({ error: "Contact unavailable." }, { status: 404 });
    const recipient = enquiryRecipient(hotel);
    if (isMockMode())
      return Response.json(
        {
          delivered: false,
          message: "Details checked. Enquiry not sent: this demo has no email delivery provider.",
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    await getContactDelivery().deliver(tenant.id, recipient, enquiry);
    return Response.json(
      { delivered: true, message: "Your enquiry has been sent." },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Enquiry delivery is unavailable. Please call or email the hotel." },
      { status: 503 },
    );
  }
}
