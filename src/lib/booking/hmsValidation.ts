import type {
  HmsReservationGuest,
  HmsReservationRoom,
} from "../../services/patelHms/integrationTypes";
import type { AvailabilitySearch } from "../../types/hotel";
import { guestParty } from "./party.ts";
import { guestFieldError } from "./guestValidation.ts";

export function parseHmsGuest(value: unknown): HmsReservationGuest {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid guest details.");
  const guest = value as Record<string, unknown>;
  for (const key of ["firstName", "lastName", "mobile", "email", "zipCode"])
    if (
      typeof guest[key] !== "string" ||
      !(guest[key] as string).trim() ||
      (guest[key] as string).length > 150
    )
      throw new Error("Complete all required guest details.");
  for (const key of ["firstName", "lastName", "email", "zipCode"]) {
    const error = guestFieldError(key, guest[key] as string, true);
    if (error) throw new Error(error);
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email as string) ||
    !/^[+0-9 ()-]{7,30}$/.test(guest.mobile as string) ||
    !/^\d{7,15}$/.test((guest.mobile as string).replace(/\D/g, ""))
  )
    throw new Error("Invalid email or phone number.");
  for (const key of ["countryId", "stateId", "cityId"])
    if (!Number.isSafeInteger(guest[key]) || Number(guest[key]) <= 0)
      throw new Error("Select country, state and city.");
  if (![0, 1, 2, 3].includes(Number(guest.gender))) throw new Error("Invalid gender.");
  return {
    firstName: (guest.firstName as string).trim(),
    lastName: (guest.lastName as string).trim(),
    mobile: (guest.mobile as string).trim(),
    email: (guest.email as string).trim(),
    zipCode: (guest.zipCode as string).trim(),
    countryId: Number(guest.countryId),
    stateId: Number(guest.stateId),
    cityId: Number(guest.cityId),
    gender: Number(guest.gender) as HmsReservationGuest["gender"],
    guestType: 1,
    isPrimaryGuest: true,
    isChild: false,
  };
}

export function validateReservationRooms(
  rooms: HmsReservationRoom[],
  expectedGuests: number,
  expectedRooms: number,
  search?: AvailabilitySearch,
) {
  const party = guestParty(search ?? { guests: expectedGuests });
  if (
    !Array.isArray(rooms) ||
    rooms.length !== expectedRooms ||
    rooms.some(
      (room) =>
        !Number.isInteger(room.totalAdult) ||
        room.totalAdult < 1 ||
        !Number.isInteger(room.totalChild) ||
        room.totalChild < 0 ||
        !Number.isInteger(room.requestedPets ?? 0) ||
        (room.requestedPets ?? 0) < 0,
    ) ||
    rooms.reduce((sum, room) => sum + room.totalAdult, 0) !== party.adults ||
    rooms.reduce((sum, room) => sum + room.totalChild, 0) !== party.children ||
    rooms.reduce((sum, room) => sum + (room.requestedPets ?? 0), 0) !== party.pets
  )
    throw new Error(
      "Assign the selected adults, children and pet requests to the rooms, with one adult per room.",
    );
}
