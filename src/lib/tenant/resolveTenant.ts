import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isMockMode } from "@/lib/api/mode";
import { tenantFromHost } from "./hostname";
import { isManagerHost, managerSession } from "../manager/session";
import { registeredTenant } from "./domains";
import type { Tenant } from "@/types/hotel";
import { bindManagerConnection } from "../manager/connections";

const LOCAL_TENANT = "demo-hotel";

export async function resolveTenant(): Promise<Tenant> {
  const headerList = await headers();
  const host = headerList.get("host");
  if (isManagerHost(host)) {
    const session = await managerSession();
    if (!session) notFound();
    const tenant = { id: session.tenantId, hostname: host! };
    if (session.auth === "hms" && session.id) bindManagerConnection(tenant, session.id);
    return tenant;
  }
  const tenant = tenantFromHost(headerList.get("host"), {
    rootDomain: process.env.PATEL_HMS_ROOT_DOMAIN ?? "patelhms.com",
    allowLocal:
      isMockMode() ||
      (process.env.NODE_ENV !== "production" && Boolean(process.env.PATEL_HMS_LOCAL_TENANT_ID)),
    localTenant:
      process.env.PATEL_HMS_LOCAL_TENANT_ID ?? process.env.DEMO_TENANT_ID ?? LOCAL_TENANT,
  });
  if (!tenant) notFound();
  if (!isMockMode()) {
    const mapped = await registeredTenant(tenant.id);
    const local =
      tenant.hostname === "localhost" ||
      tenant.hostname === "127.0.0.1" ||
      tenant.hostname.endsWith(".localhost");
    if (!local && !mapped) notFound();
    if (mapped) tenant.id = mapped;
  }
  return tenant;
}
