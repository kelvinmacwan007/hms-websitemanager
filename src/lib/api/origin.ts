/** Preserve the public host; hosted manager traffic uses HTTPS even behind an HTTP proxy. */
export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (host) {
    if (!/^[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(host)) throw new Error("Invalid request host.");
    url.port = "";
    url.host = host;
    if (
      process.env.NODE_ENV === "production" &&
      host.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "") ===
        process.env.WEBSITE_MANAGER_HOST?.toLowerCase()
    )
      url.protocol = "https:";
  }
  return url.origin;
}
