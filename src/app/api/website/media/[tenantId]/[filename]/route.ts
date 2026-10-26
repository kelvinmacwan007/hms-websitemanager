import { readFile } from "node:fs/promises";
import { websiteDataRoot } from "@/lib/website/storage";
import { join } from "node:path";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; filename: string }> },
) {
  const { tenantId, filename } = await params;
  const tenant = await resolveTenant();
  if (
    !websiteDataRoot() ||
    tenant.id !== tenantId ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId) ||
    !/^[a-f0-9-]{36}\.(png|jpe?g|webp|gif)$/.test(filename)
  )
    return new Response(null, { status: 404 });
  try {
    const bytes = await readFile(join(websiteDataRoot()!, "media", tenantId, filename));
    const extension = filename.split(".").pop()!;
    return new Response(bytes, {
      headers: {
        "Content-Type":
          extension === "jpg" || extension === "jpeg" ? "image/jpeg" : `image/${extension}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
