import type { AvailabilitySearch, BookingSettings } from "@/types/hotel";
import { DEFAULT_BOOKING_SETTINGS, bookingSettingsIssues, propertyDate } from "./settings.ts";

type SearchParams = Record<string, string | string[] | undefined>;

export function parseAvailabilitySearch(
  params: SearchParams,
  settings: BookingSettings = DEFAULT_BOOKING_SETTINGS,
  timeZone = "UTC",
  now = new Date(),
): { search?: AvailabilitySearch; error?: string } {
  const value = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : "");
  if (!["checkIn", "checkOut", "guests", "rooms"].some((key) => params[key] !== undefined))
    return {};

  const checkIn = value("checkIn");
  const checkOut = value("checkOut");
  const guests = Number(value("guests"));
  const rooms = Number(value("rooms"));
  const validDate = (input: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return false;
    const parsed = new Date(`${input}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === input;
  };
  if (bookingSettingsIssues(settings).length)
    return { error: "Booking settings are unavailable. Please contact the hotel." };
  let today: string;
  try {
    today = propertyDate(timeZone, now);
  } catch {
    return { error: "The hotel timezone is unavailable. Please contact the hotel." };
  }
  const nights =
    validDate(checkIn) && validDate(checkOut)
      ? (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000
      : 0;

  if (
    !validDate(checkIn) ||
    !validDate(checkOut) ||
    checkIn < today ||
    nights < 1 ||
    nights > 30 ||
    !Number.isInteger(guests) ||
    guests < 1 ||
    guests > 20 ||
    !Number.isInteger(rooms) ||
    rooms < 1 ||
    rooms > 10 ||
    guests < rooms
  ) {
    return { error: "Enter valid future dates and at least one guest per room." };
  }

  const advanceDays =
    (Date.parse(`${checkIn}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000;
  if (nights < settings.minStay || nights > settings.maxStay)
    return { error: `Choose a stay of ${settings.minStay} to ${settings.maxStay} nights.` };
  if (advanceDays < settings.minAdvanceDays || advanceDays > settings.advanceWindow)
    return {
      error: `Choose arrival ${settings.minAdvanceDays} to ${settings.advanceWindow} days in advance.`,
    };
  if (rooms > settings.maxRooms)
    return { error: `Choose no more than ${settings.maxRooms} rooms per booking.` };

  const party: Partial<AvailabilitySearch> = {};
  const keys = ["adults", "children", "pets"] as const;
  if (keys.some((key) => params[key] !== undefined)) {
    for (const key of keys) {
      const raw = params[key];
      const count = raw === undefined ? (key === "adults" ? guests : 0) : Number(value(key));
      if (
        (raw !== undefined && (typeof raw !== "string" || !/^\d+$/.test(raw))) ||
        !Number.isInteger(count) ||
        count < 0 ||
        count > (key === "pets" ? 10 : 20)
      )
        return { error: "Choose valid adult, child and pet counts." };
      party[key] = count;
    }
    if (party.adults! < rooms || party.adults! + party.children! !== guests)
      return {
        error:
          "Include one adult per room and make sure the adult and child counts match the guest total.",
      };
  }

  return { search: { checkIn, checkOut, guests, rooms, ...party } };
}
