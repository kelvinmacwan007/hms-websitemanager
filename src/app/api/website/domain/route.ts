import { readLimitedText } from "@/lib/api/body";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { getOperationalProvider } from "@/lib/api/provider";
import { chooseHotelDomain, publicHotelUrl, unpublishHotelDomain } from "@/lib/tenant/domains";
import { isManagerHost } from "@/lib/manager/session";
import { getHmsConnection } from "@/services/patelHms/websiteIntegration";

export async function PUT(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Manager access denied." }, { status: 403 });
  }
  try {
    const raw = await readLimitedText(request, 1024);
    if (raw.length > 1024) throw new Error("Invalid website address request.");
    const body = JSON.parse(raw);
    if (typeof body?.subdomain !== "string") throw new Error("Enter a website subdomain.");
    const hotel = await getOperationalProvider().getHotel(tenant);
    const record = await chooseHotelDomain(tenant.id, hotel.id, body.subdomain);
    return Response.json(
      { ...record, url: publicHotelUrl(record.subdomain) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Website address could not be saved." },
      { status: 422 },
    );
  }
}

export async function DELETE(request: Request) {
  if (!isManagerHost(request.headers.get("host")))
    return Response.json({ error: "Use the authenticated Website Manager." }, { status: 403 });
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Manager access denied." }, { status: 403 });
  }
  try {
    const record = await unpublishHotelDomain(tenant.id, getHmsConnection(tenant).propertyId);
    return Response.json(record, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Website could not be taken offline. Please retry." },
      { status: 422 },
    );
  }
}
