import "server-only";
import { cache } from "react";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { getWebsiteProvider } from "@/lib/api/provider";

/** Shared within this server request only, including the authenticated tenant binding. */
export const getBookingContext = cache(async () => {
  const tenant = await resolveTenant();
  const provider = getWebsiteProvider();
  const hotel = await provider.getHotel(tenant);
  return { tenant, provider, hotel };
});
