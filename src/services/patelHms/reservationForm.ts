import type { HmsReservationRequest } from "./integrationTypes";

export function reservationFormData(input: HmsReservationRequest): FormData {
  const form = new FormData();
  form.set("PropertyId", input.propertyId);
  form.set("CheckInDateTime", input.checkInDateTime);
  form.set("CheckOutDateTime", input.checkOutDateTime);
  if (input.reservationNotes) form.set("ReservationNotes", input.reservationNotes);
  input.rooms.forEach((room, index) => {
    const prefix = `ReservationRoomTxns[${index}]`;
    form.set(`${prefix}.TotalAdult`, String(room.totalAdult));
    form.set(`${prefix}.TotalChild`, String(room.totalChild));
    form.set(`${prefix}.IsPetAllowed`, room.isPetAllowed ? "1" : "0");
    form.set(`${prefix}.RoomTypeMasterId`, room.roomTypeMasterId);
    if (room.specialRequest) form.set(`${prefix}.SpecialRequest`, room.specialRequest);
    room.guests.forEach((guest, guestIndex) => {
      for (const [key, value] of Object.entries(guest)) {
        if (value === undefined) continue;
        const field = key[0].toUpperCase() + key.slice(1);
        form.set(
          `${prefix}.ReservationGuestInfos[${guestIndex}].${field}`,
          typeof value === "boolean" ? (value ? "1" : "0") : String(value),
        );
      }
    });
  });
  return form;
}
