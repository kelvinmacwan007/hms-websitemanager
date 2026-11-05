import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete("x-website-preview");
  const local =
    request.nextUrl.hostname === "localhost" || request.nextUrl.hostname.endsWith(".localhost");
  const manager = Boolean(
    process.env.WEBSITE_MANAGER_HOST &&
    request.headers.get("host")?.toLowerCase().replace(/:\d+$/, "") ===
      process.env.WEBSITE_MANAGER_HOST.toLowerCase(),
  );
  if ((process.env.NODE_ENV !== "production" && local) || manager) {
    let token = request.nextUrl.searchParams.get("__website_preview");
    if (!token) {
      try {
        const referrer = new URL(request.headers.get("referer") || "");
        if (
          referrer.origin === request.nextUrl.origin &&
          request.headers.get("sec-fetch-dest") !== "document"
        )
          token = referrer.searchParams.get("__website_preview");
      } catch {}
    }
    if (token && /^[a-f0-9-]{36}$/.test(token)) headers.set("x-website-preview", token);
  }
  return NextResponse.next({ request: { headers } });
}
export const config = {
  matcher: [
    "/",
    "/about",
    "/rooms/:path*",
    "/dining",
    "/menu",
    "/gallery",
    "/offers",
    "/contact",
    "/experiences",
    "/reviews",
    "/faq",
    "/policies",
    "/booking/:path*",
  ],
};
