import type { WebsiteProvider } from "../api/types";
import type { Hotel, HotelRoom, Tenant } from "../../types/hotel";
import { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate } from "./settings";

/** Catalogue photos/copy stay intact; display prices come from a real stay search. */
export async function roomDisplayRates(
  provider: WebsiteProvider,
  tenant: Tenant,
  hotel: Hotel,
  rooms: HotelRoom[] = hotel.rooms,
) {
  const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
  const checkIn = offsetDate(propertyDate(hotel.timeZone), settings.minAdvanceDays);
  const checkOut = offsetDate(checkIn, settings.minStay);
  const rateDates = { checkIn, checkOut };
  try {
    const available = await provider.searchAvailability(tenant, {
      ...rateDates,
      guests: 1,
      rooms: 1,
    });
    const prices = new Map(available.map((room) => [room.id, room.startingPrice]));
    return {
      rooms: rooms.map((room) => ({
        ...room,
        startingPrice: prices.get(room.id) ?? room.startingPrice,
      })),
      rateDates,
      rateError: false,
    };
  } catch {
    return { rooms, rateDates, rateError: true };
  }
}
