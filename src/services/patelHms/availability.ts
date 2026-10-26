import type { AvailabilitySearch, HotelRoom, Tenant } from "@/types/hotel";
import { getHmsConnection, getHmsWebsiteIntegration } from "./websiteIntegration";
import { mapHmsRooms } from "./roomMapping";
import { getHmsStayTimes } from "./propertyContext";
import { fetchRooms } from "./rooms";

export async function searchAvailability(
  tenant: Tenant,
  search: AvailabilitySearch,
): Promise<HotelRoom[]> {
  const [rooms, catalogue] = await Promise.all([
    getHmsWebsiteIntegration(tenant).getRoomTypes(getHmsStayTimes(tenant, search)),
    fetchRooms(tenant),
  ]);
  const connection = getHmsConnection(tenant);
  return mapHmsRooms(rooms, connection.currency, connection.baseUrl).map((room) => {
    const details = catalogue.find((entry) => entry.id === room.id);
    return {
      ...room,
      description: details?.description ?? "",
      shortDescription: details?.shortDescription ?? "",
      amenities: details?.amenities ?? [],
      images: details?.images.length ? details.images : room.images,
    };
  });
}
