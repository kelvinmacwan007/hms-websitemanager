import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { getHmsConnection, getHmsWebsiteIntegration } from "@/services/patelHms/websiteIntegration";
import { catalogAmenities } from "@/services/patelHms/amenities";

export async function POST(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Amenities access denied." }, { status: 403 });
  }
  try {
    const rooms = await getHmsWebsiteIntegration(tenant).getRoomCatalog();
    return Response.json(
      { amenities: catalogAmenities(rooms, getHmsConnection(tenant).baseUrl) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not fetch amenities from Patel HMS. Please try again." },
      { status: 502 },
    );
  }
}
