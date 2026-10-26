import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getPropertyContext } from "@/services/patelHms/propertyContext";
import { getHmsConnection } from "@/services/patelHms/websiteIntegration";
import { hmsFetch } from "@/services/patelHms/client";
import { isMockMode } from "@/lib/api/mode";
import { allowRequest } from "@/lib/api/rateLimit";

/** Only the current property's backend-owned logos can be read, never arbitrary URLs. */
export async function GET(request: Request) {
  if (isMockMode()) return Response.json({ error: "No live logo configured." }, { status: 404 });
  const variant = new URL(request.url).searchParams.get("variant");
  const field =
    variant === "primary"
      ? "logoUrl"
      : variant === "light"
        ? "logoLightUrl"
        : variant === "dark"
          ? "logoDarkUrl"
          : null;
  if (!field) return Response.json({ error: "Invalid logo." }, { status: 400 });
  try {
    const tenant = await resolveTenant();
    if (!allowRequest(`logo:${tenant.id}`, 20))
      return Response.json({ error: "Please try again shortly." }, { status: 429 });
    const hotel = await getPropertyContext(tenant);
    const logo = hotel.branding[field];
    if (!logo) return Response.json({ error: "No logo configured." }, { status: 404 });
    const target = new URL(logo);
    const allowedHosts = [new URL(getHmsConnection(tenant).baseUrl).hostname, "dev.patelhms.com"];
    if (
      target.protocol !== "https:" ||
      !allowedHosts.includes(target.hostname) ||
      target.username ||
      target.password
    )
      return Response.json({ error: "Upload this logo locally to analyze it." }, { status: 422 });
    const response = await hmsFetch(target, { cache: "no-store" });
    const mime = response.headers.get("content-type")?.split(";")[0].trim();
    if (
      !response.ok ||
      !mime ||
      !["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"].includes(mime)
    )
      throw new Error();
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2 * 1024 * 1024) {
        await reader.cancel();
        return Response.json({ error: "Logo exceeds 2 MB." }, { status: 413 });
      }
      chunks.push(value);
    }
    return new Response(Buffer.concat(chunks), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Disposition": "attachment",
      },
    });
  } catch {
    return Response.json({ error: "Logo could not be loaded." }, { status: 502 });
  }
}
