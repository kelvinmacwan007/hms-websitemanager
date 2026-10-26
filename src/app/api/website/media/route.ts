import { readLimitedBytes } from "@/lib/api/body";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { developmentAuthorization } from "@/lib/website/authorization";
import { developmentMediaStorage } from "@/lib/website/media";
import { allowRequest } from "@/lib/api/rateLimit";
export async function POST(request: Request) {
  const tenant = await resolveTenant();
  try {
    await developmentAuthorization.authorize(request, tenant, "");
  } catch {
    return Response.json({ error: "Upload access denied." }, { status: 403 });
  }
  if (!allowRequest(`upload:${tenant.id}`, 40))
    return Response.json({ error: "Upload limit reached." }, { status: 429 });
  if (Number(request.headers.get("content-length")) > 2_200_000)
    return Response.json({ error: "Image too large." }, { status: 413 });
  try {
    const bytes = await readLimitedBytes(request, 2_200_000);
    const form = await new Response(bytes as BodyInit, {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Select an image.");
    return Response.json({
      url: await developmentMediaStorage.uploadMedia(tenant.id, file),
      environment: "development",
    });
  } catch {
    return Response.json(
      { error: "Image upload failed. Check type, extension and 2 MB size limit." },
      { status: 422 },
    );
  }
}
