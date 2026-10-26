import { readLimitedText } from "@/lib/api/body";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { getOperationalProvider } from "@/lib/api/provider";
import { validatePresentation } from "@/lib/website/presentation";
import { loadPreview, savePreview } from "@/lib/website/preview";
import { isManagerHost, managerSession } from "@/lib/manager/session";

export async function POST(request: Request) {
  if (isManagerHost(request.headers.get("host")) && !(await managerSession()))
    return Response.json(
      { error: "Your Website Studio session has expired. Sign in again to continue." },
      { status: 401 },
    );
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Preview access denied." }, { status: 403 });
  }
  try {
    const raw = await readLimitedText(request, 20000000);
    if (raw.length > 20_000_000)
      return Response.json({ error: "Preview document too large." }, { status: 413 });
    const body = JSON.parse(raw);
    const existing = typeof body?.token === "string" ? loadPreview(body.token, tenant.id) : null;
    const hotel = existing?.hotel ?? (await getOperationalProvider().getHotel(tenant));
    const document = validatePresentation(hotel, body?.document);
    const token = savePreview(tenant.id, hotel, document, existing ? body.token : undefined);
    return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Could not prepare the website preview. Please retry." },
      { status: 422 },
    );
  }
}
