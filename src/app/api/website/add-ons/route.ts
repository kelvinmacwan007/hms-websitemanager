import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { fetchAddOns } from "@/services/patelHms/addOns";

export async function POST(request: Request) {
  let tenant: Awaited<ReturnType<typeof resolveTenant>>;
  try {
    tenant = await resolveTenant();
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json(
      { error: "Add-ons access denied. Please sign in to the website manager and try again." },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
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
