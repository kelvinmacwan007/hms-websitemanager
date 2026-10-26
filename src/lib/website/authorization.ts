import "server-only";
import type { Tenant } from "../../types/hotel";
import { isMockMode } from "../api/mode";
import { isManagerHost, managerSession } from "../manager/session";
import { requestOrigin } from "../api/origin";

export interface PortalAuthorization {
  authorize(request: Request, tenant: Tenant, propertyId: string): Promise<{ subject: string }>;
}

/** Explicit localhost development privilege. Host routing is never production authentication. */
export const developmentAuthorization: PortalAuthorization = {
  async authorize(request, tenant) {
    if (isManagerHost(request.headers.get("host"))) {
      const session = await managerSession();
      if (
        !session ||
        session.tenantId !== tenant.id ||
        request.headers.get("origin") !== requestOrigin(request)
      )
        throw new Error("Manager access denied.");
      return { subject: session.username };
    }
    const host = new URL(request.url).hostname;
    if (
      process.env.NODE_ENV === "production" ||
      (!isMockMode() &&
        ![
          "/api/website/colors",
          "/api/website/document",
          "/api/website/preview",
          "/api/website/amenities",
          "/api/website/add-ons",
          "/api/website/media",
        ].includes(new URL(request.url).pathname)) ||
      !(host === "localhost" || host.endsWith(".localhost")) ||
      !(
        tenant.hostname.split(":")[0] === "localhost" ||
        tenant.hostname.split(":")[0].endsWith(".localhost")
      )
    )
      throw new Error("Portal authorization unavailable.");
    if (request.headers.get("origin") !== requestOrigin(request))
      throw new Error("Same-origin Portal request required.");
    return { subject: "localhost-development-admin" };
  },
};
