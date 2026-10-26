import type { HotelRoom, Tenant } from "@/types/hotel";
import { getHmsConnection, getHmsWebsiteIntegration } from "./websiteIntegration";
import { mapHmsCatalogRooms } from "./roomMapping";

export async function fetchRooms(tenant: Tenant): Promise<HotelRoom[]> {
  return mapHmsCatalogRooms(
    await getHmsWebsiteIntegration(tenant).getRoomCatalog(),
    getHmsConnection(tenant).baseUrl,
  );
}

export async function fetchRoomBySlug(tenant: Tenant, slug: string): Promise<HotelRoom | null> {
  return (await fetchRooms(tenant)).find((room) => room.slug === slug) ?? null;
}
