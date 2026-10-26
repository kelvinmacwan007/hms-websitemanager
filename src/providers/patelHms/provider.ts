import { fetchHotelContext } from "@/services/patelHms/hotel";
import { fetchRoomBySlug, fetchRooms } from "@/services/patelHms/rooms";
import { searchAvailability } from "@/services/patelHms/availability";
import type { AvailabilitySearch, Tenant } from "@/types/hotel";

export const patelHmsProvider = {
  getHotel: fetchHotelContext,
  getRooms: fetchRooms,
  getRoomBySlug: fetchRoomBySlug,
  searchAvailability: (tenant: Tenant, search: AvailabilitySearch) =>
    searchAvailability(tenant, search),
};
