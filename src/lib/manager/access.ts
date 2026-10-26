import { createHash } from "node:crypto";

/** Verified HMS membership grants access unless an explicit editor list restricts it. */
export function hmsWebsiteAccess(username: string, tenantId: string, verifiedHmsProperty = false) {
  try {
    const tenants = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
    const grants = JSON.parse(process.env.WEBSITE_MANAGER_EDITORS_JSON || "{}");
    if (!Object.hasOwn(grants, tenantId) && verifiedHmsProperty) return true;
    if (!Object.hasOwn(tenants, tenantId) && !verifiedHmsProperty) return false;
    // Preserve the configured property's administrator; other HMS staff require an explicit grant.
    const allowed = Object.hasOwn(grants, tenantId)
      ? grants[tenantId]
      : [tenants[tenantId]?.userIdentity];
    return (
      Array.isArray(allowed) &&
      allowed.some((value) => typeof value === "string" && value === username)
    );
  } catch {
    return false;
  }
}

/** Permission/credential changes invalidate sessions on their next request. */
export function sessionPolicy(username: string, tenantId: string, passwordHash?: string) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        username,
        tenantId,
        passwordHash,
        tenants: process.env.PATEL_HMS_TENANTS_JSON || "{}",
        editors: process.env.WEBSITE_MANAGER_EDITORS_JSON || "{}",
        auth: process.env.WEBSITE_MANAGER_AUTH || "local",
      }),
    )
    .digest("hex");
}
