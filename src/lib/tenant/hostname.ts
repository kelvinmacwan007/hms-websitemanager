const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Resolve only direct hotel subdomains; this is routing, not PMS authorization. */
export function tenantFromHost(
  host: string | null,
  { rootDomain = "patelhms.com", allowLocal = false, localTenant = "demo-hotel" } = {},
): { id: string; hostname: string } | null {
  if (!host) return null;
  const match = /^([a-z0-9.-]+)(?::([0-9]{1,5}))?$/i.exec(host);
  if (!match || (match[2] && (Number(match[2]) < 1 || Number(match[2]) > 65535))) return null;
  const hostname = match[1].toLowerCase().replace(/\.$/, "");
  const root = rootDomain.toLowerCase().replace(/\.$/, "");
  if (hostname.length > 253 || !hostname.split(".").every((label) => LABEL.test(label)))
    return null;
  if (!root.includes(".") || !root.split(".").every((label) => LABEL.test(label))) return null;

  if (allowLocal && (hostname === "localhost" || hostname === "127.0.0.1")) {
    return LABEL.test(localTenant) ? { id: localTenant, hostname } : null;
  }
  const suffix = allowLocal && hostname.endsWith(".localhost") ? ".localhost" : `.${root}`;
  if (!hostname.endsWith(suffix)) return null;
  const id = hostname.slice(0, -suffix.length);
  return LABEL.test(id) ? { id, hostname } : null;
}
