import "server-only";
import { cookies, headers } from "next/headers";
import { MANAGER_COOKIE, verifySession, type ManagerUser } from "./credentials";
import { websiteDataRoot } from "../website/storage";
import { activeSession } from "./sessionStore";
import { hmsWebsiteAccess, sessionPolicy } from "./access";
import { readConnection } from "./connections";

export function isManagerHost(host: string | null) {
  const hostname = host?.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(hostname || ""))
    return true;
  return Boolean(
    process.env.WEBSITE_MANAGER_HOST &&
    host?.toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "") ===
      process.env.WEBSITE_MANAGER_HOST.toLowerCase(),
  );
}
export function managerUsers(): ManagerUser[] {
  try {
    const users = JSON.parse(process.env.WEBSITE_MANAGER_USERS_JSON || "[]");
    const tenants = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
    if (!Array.isArray(users)) return [];
    return users.filter(
      (u) =>
        u &&
        typeof u.username === "string" &&
        /^[a-zA-Z0-9_.@-]{1,100}$/.test(u.username) &&
        typeof u.passwordHash === "string" &&
        typeof u.tenantId === "string" &&
        Object.hasOwn(tenants, u.tenantId),
    );
  } catch {
    return [];
  }
}
export async function managerSession() {
  if (!isManagerHost((await headers()).get("host"))) return null;
  const token = (await cookies()).get(MANAGER_COOKIE)?.value;
  const users = managerUsers();
  const session = verifySession(
    token,
    process.env.WEBSITE_MANAGER_SESSION_SECRET || "",
    process.env.WEBSITE_MANAGER_AUTH === "hms" ? [] : managerUsers(),
    Date.now(),
    process.env.WEBSITE_MANAGER_AUTH === "hms" ? configuredHmsProperties(token) : {},
  );
  const root = websiteDataRoot();
  if (!session || !root || !token) return null;
  if (session.auth === "hms" && !hmsWebsiteAccess(session.username, session.tenantId, true))
    return null;
  const user = users.find(
    (u) => u.username === session.username && u.tenantId === session.tenantId,
  );
  const policy = sessionPolicy(
    session.username,
    session.tenantId,
    session.auth === "hms" ? undefined : user?.passwordHash,
  );
  return (await activeSession(root, session.id, token, policy)) ? session : null;
}

function configuredHmsProperties(token?: string): Record<string, string> {
  try {
    const configs = JSON.parse(process.env.PATEL_HMS_TENANTS_JSON || "{}");
    const properties = Object.fromEntries(
      Object.entries(configs).flatMap(([tenant, value]) => {
        const propertyId = (value as { propertyId?: string })?.propertyId;
        return typeof propertyId === "string" ? [[tenant, propertyId]] : [];
      }),
    );
    if (token) {
      const claims = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8"));
      if (
        typeof claims.tenantId === "string" &&
        typeof claims.id === "string" &&
        /^[a-f0-9]{64}$/.test(claims.id)
      ) {
        const connection = readConnection(`session-${claims.id}`);
        if (connection) properties[claims.tenantId] = connection.propertyId;
      }
    }
    return properties;
  } catch {
    return {};
  }
}
