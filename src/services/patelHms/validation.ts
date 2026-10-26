import type { Hotel, HotelRoom, Tenant } from "@/types/hotel";
import { createWebsiteDocument, parseWebsiteDocument } from "../../../Portal/content";
export function validatePmsHotel(input: Hotel, tenant: Tenant): Hotel {
  if (
    !input ||
    input.tenantId !== tenant.id ||
    typeof input.id !== "string" ||
    !input.id ||
    typeof input.configured !== "boolean"
  )
    throw new Error("Invalid PMS property context.");
  return parseWebsiteDocument(createWebsiteDocument(input)).hotel;
}
export function validatePmsRooms(input: HotelRoom[]): HotelRoom[] {
  if (!Array.isArray(input)) throw new Error("Invalid PMS room response.");
  const document = createWebsiteDocument();
  document.hotel.rooms = input;
  const rooms = parseWebsiteDocument(document).hotel.rooms;
  if (
    rooms.some(
      (room) =>
        room.occupancy < 1 ||
        room.ratePlans.some(
          (rate) =>
            rate.price.amount < 0 ||
            !/^[A-Z]{3}$/.test(rate.price.currency) ||
            (rate.inventoryCount !== undefined &&
              (!Number.isInteger(rate.inventoryCount) || rate.inventoryCount < 0)),
        ),
    )
  )
    throw new Error("Invalid PMS operational room values.");
  return rooms;
}
