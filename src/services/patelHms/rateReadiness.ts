import "server-only";
import type { Hotel, Tenant } from "@/types/hotel";
import { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate } from "@/lib/booking/settings";
import { getHmsStayTimes } from "./propertyContext";
import { getHmsWebsiteIntegration } from "./websiteIntegration";

export const HMS_RATES_REQUIRED =
  "Verified HMS rates are required to publish. Check room prices and the selected rate plan in Patel HMS, then reload and try again.";

/** null means HMS could not be checked; false means no matching positive rate. */
export async function hmsRateReadiness(tenant: Tenant, hotel: Hotel): Promise<boolean | null> {
  try {
    const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
    const checkIn = offsetDate(propertyDate(hotel.timeZone), settings.minAdvanceDays);
    const rooms = await getHmsWebsiteIntegration(tenant).getRoomTypes(
      getHmsStayTimes(tenant, {
        checkIn,
        checkOut: offsetDate(checkIn, settings.minStay),
        guests: 1,
        rooms: 1,
      }),
    );
    const ids = new Set(hotel.rooms.map((room) => room.id));
    return rooms.some((room) => {
      const amount = room.averageRate ?? room.roomRateByRateType ?? room.baseRate;
      return ids.has(room.id) && Number.isFinite(amount) && amount > 0;
    });
  } catch {
    return null;
  }
}
