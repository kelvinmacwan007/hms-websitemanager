import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { fetchAddOns } from "@/services/patelHms/addOns";

export async function POST(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Add-ons access denied." }, { status: 403 });
  }
  try {
    return Response.json(
      { items: await fetchAddOns(tenant) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not fetch add-ons from Patel HMS. Please try again." },
      { status: 502 },
    );
  }
}
