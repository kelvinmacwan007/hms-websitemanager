import type { WebsiteProvider } from "./types";
import { visibleRooms } from "../booking/visibility.ts";
import { parseAvailabilitySearch } from "../booking/search.ts";
import type { HotelRoom } from "../../types/hotel";

import { mergeRoomPresentation, normalizeHotel } from "../website/presentation";
import type { WebsitePresentationPayload } from "../../../Portal/content";
function applyVisibility(rooms: HotelRoom[], published: HotelRoom[]) {
  return visibleRooms(mergeRoomPresentation(rooms, published));
}

/** Public reads apply presentation visibility and rules to every entry point. */
export function publicProvider(
  source: WebsiteProvider,
  loadPublished?: (tenantId: string) => Promise<WebsitePresentationPayload | null>,
): WebsiteProvider {
  async function context(tenant: Parameters<WebsiteProvider["getHotel"]>[0]) {
    return normalizeHotel(
      await source.getHotel(tenant),
      (await loadPublished?.(tenant.id)) ?? null,
    );
  }
  return {
    async getHotel(tenant) {
      const hotel = await context(tenant);
      return {
        ...hotel,
        amenities: hotel.amenities.filter((amenity) => amenity.enabled !== false),
        rooms: visibleRooms(hotel.rooms),
      };
    },
    async getRooms(tenant) {
      const [hotel, rooms] = await Promise.all([context(tenant), source.getRooms(tenant)]);
      return hotel.configured ? applyVisibility(rooms, hotel.rooms) : [];
    },
    async getRoomBySlug(tenant, slug) {
      const rooms = await this.getRooms(tenant);
      return rooms.find((room) => room.slug === slug) ?? null;
    },
    async searchAvailability(tenant, search) {
      const hotel = await context(tenant);
      if (!hotel.configured) return [];
      const validated = parseAvailabilitySearch(
        {
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          guests: String(search.guests),
          rooms: String(search.rooms),
        },
        hotel.bookingSettings,
        hotel.timeZone,
      );
      if (!validated.search) return [];
      const available = await source.searchAvailability(tenant, validated.search);
      return applyVisibility(available, hotel.rooms).filter(
        (room) => room.ratePlans.length > 0 && room.availabilityStatus !== "sold-out",
      );
    },
  };
}
