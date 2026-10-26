import { getWebsitePersistence } from "../website/persistence";
import { mockProvider } from "@/providers/mock/provider";
import { patelHmsProvider } from "@/providers/patelHms/provider";
import { isMockMode } from "./mode";
import type { WebsiteProvider } from "./types";
import { publicProvider } from "./publicProvider";
import { loadWebsiteColors } from "../website/colors";
import { headers } from "next/headers";
import { managerSession } from "../manager/session";
import { loadPreview } from "../website/preview";

export function getOperationalProvider(): WebsiteProvider {
  return isMockMode() ? mockProvider : patelHmsProvider;
}

export function getWebsiteProvider(): WebsiteProvider {
  const persistence = getWebsitePersistence();
  const preview = async (tenantId: string) => {
    if (process.env.NODE_ENV === "production" && (await managerSession())?.tenantId !== tenantId)
      return null;
    return loadPreview((await headers()).get("x-website-preview"), tenantId);
  };
  const operational = getOperationalProvider();
  const source = {
    ...operational,
    async getHotel(tenant: Parameters<WebsiteProvider["getHotel"]>[0]) {
      return (await preview(tenant.id))?.hotel ?? operational.getHotel(tenant);
    },
    async getRooms(tenant: Parameters<WebsiteProvider["getRooms"]>[0]) {
      return (await preview(tenant.id))?.hotel.rooms ?? operational.getRooms(tenant);
    },
  };
  const provider = publicProvider(
    source,
    async (tenantId) =>
      (await preview(tenantId))?.document ?? (await persistence?.loadPublished(tenantId)) ?? null,
  );
  return {
    ...provider,
    async getHotel(tenant) {
      const hotel = await provider.getHotel(tenant);
      if (await preview(tenant.id)) return hotel;
      // A hosted website uses the palette in its published document, not a separately saved draft.
      if (process.env.NODE_ENV === "production" && (await persistence?.loadPublished(tenant.id)))
        return hotel;
      const colors = await loadWebsiteColors(tenant.id, hotel.id);
      return colors ? { ...hotel, branding: { ...hotel.branding, ...colors } } : hotel;
    },
  };
}
