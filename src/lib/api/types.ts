import type { AvailabilitySearch, Hotel, HotelRoom, Tenant } from "@/types/hotel";

export interface WebsiteProvider {
  getHotel(tenant: Tenant): Promise<Hotel>;
  getRooms(tenant: Tenant): Promise<HotelRoom[]>;
  getRoomBySlug(tenant: Tenant, slug: string): Promise<HotelRoom | null>;
  searchAvailability(tenant: Tenant, search: AvailabilitySearch): Promise<HotelRoom[]>;
}
