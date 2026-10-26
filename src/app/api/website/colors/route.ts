import { readLimitedText } from "@/lib/api/body";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { getOperationalProvider } from "@/lib/api/provider";
import { saveWebsiteColors, validateWebsiteColors } from "@/lib/website/colors";

export async function PUT(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Local website access required." }, { status: 403 });
  }
  let colors;
  try {
    const raw = await readLimitedText(request, 1024);
    if (raw.length > 1024) throw new Error();
    colors = validateWebsiteColors(JSON.parse(raw));
  } catch {
    return Response.json(
      { error: "Use six-digit hex codes for all three colors." },
      { status: 400 },
    );
  }
  try {
    const hotel = await getOperationalProvider().getHotel(tenant);
    await saveWebsiteColors(tenant.id, hotel.id, colors);
    return Response.json({ saved: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Colors could not be saved. Please retry." }, { status: 500 });
  }
}
