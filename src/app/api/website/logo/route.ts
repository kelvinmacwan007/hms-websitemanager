import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { isManagerHost } from "@/lib/manager/session";
import { allowRequest } from "@/lib/api/rateLimit";
import { getHmsWebsiteIntegration, getHmsConnection } from "@/services/patelHms/websiteIntegration";
import { hmsImageUrl } from "@/services/patelHms/roomMapping";

/** Re-read the authenticated property's HMS profile; never accept a client-supplied logo URL. */
export async function POST(request: Request) {
  if (!isManagerHost(request.headers.get("host")))
    return Response.json({ error: "Sign into Website Studio to sync your logo." }, { status: 403 });
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Logo sync access denied." }, { status: 403 });
  }
  if (!allowRequest(`logo-sync:${tenant.id}`, 10))
    return Response.json({ error: "Please try again shortly." }, { status: 429 });
  try {
    const connection = getHmsConnection(tenant);
    const profile = await getHmsWebsiteIntegration(tenant).refreshPropertyProfile();
    return Response.json(
      {
        logoUrl: profile.propertyLogoPath
          ? hmsImageUrl(profile.propertyLogoPath, connection.baseUrl)
          : undefined,
        syncedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "HMS logo could not be synced. Please try again." },
      { status: 502 },
    );
  }
}
