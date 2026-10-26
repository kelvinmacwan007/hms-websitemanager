import assert from "node:assert/strict";
import test from "node:test";
import { parseAvailabilitySearch } from "../src/lib/booking/search.ts";
import { allocateParty, guestParty, stayQuery, partySummary } from "../src/lib/booking/party.ts";
import { validateReservationRooms } from "../src/lib/booking/hmsValidation.ts";
import { reservationFormData } from "../src/services/patelHms/reservationForm.ts";

const stay = {
  checkIn: "2026-10-22",
  checkOut: "2026-10-24",
  guests: 5,
  rooms: 2,
  adults: 3,
  children: 2,
  pets: 2,
};
const parse = (values) =>
  parseAvailabilitySearch(
    Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)])),
    undefined,
    "UTC",
    new Date("2026-10-21T12:00:00Z"),
  );

test("guest composition round-trips without counting pets as extra guests", () => {
  assert.deepEqual(parse(Object.fromEntries(stayQuery(stay))).search, stay);
  assert.deepEqual(guestParty({ guests: 2 }), {
    adults: 2,
    children: 0,
    pets: 0,
  });
  assert.match(partySummary(stay), /3 adults, 2 children, 2 pets requested/);
});

test("guest search rejects impossible, duplicate, negative and fractional counts", () => {
  for (const invalid of [
    { adults: 1, children: 4 },
    { children: 3 },

    { pets: 11 },
    { children: -1 },
    { adults: 2.5 },
    { guests: 21 },
  ])
    assert.ok(parse({ ...stay, ...invalid }).error, JSON.stringify(invalid));
  assert.ok(
    parseAvailabilitySearch(
      { ...Object.fromEntries(stayQuery(stay)), adults: ["3", "4"] },
      undefined,
      "UTC",
      new Date("2026-10-21"),
    ).error,
  );
});

test("allocation respects capacity, an adult per room and known pet restrictions", () => {
  assert.deepEqual(allocateParty([{ occupancy: 3, petsAllowed: false }, { occupancy: 2 }], stay), [
    { adults: 2, children: 1, pets: 0 },
    { adults: 1, children: 1, pets: 2 },
  ]);
  assert.throws(() => allocateParty([{ occupancy: 2 }, { occupancy: 2 }], stay));
  assert.throws(() =>
    allocateParty(
      [
        { occupancy: 3, petsAllowed: false },
        { occupancy: 2, petsAllowed: false },
      ],
      stay,
    ),
  );
});

test("reservation validation rejects mismatched child and pet allocations", () => {
  const rooms = [
    { totalAdult: 2, totalChild: 1, requestedPets: 0 },
    { totalAdult: 1, totalChild: 1, requestedPets: 2 },
  ];
  validateReservationRooms(rooms, 5, 2, stay);
  assert.throws(() =>
    validateReservationRooms([{ ...rooms[0], totalChild: 0 }, rooms[1]], 5, 2, stay),
  );
  assert.throws(() =>
    validateReservationRooms([rooms[0], { ...rooms[1], requestedPets: 3 }], 5, 2, stay),
  );
});

test("HMS multipart carries children and pet requests without inventing guest-type enums", () => {
  const form = reservationFormData({
    propertyId: "hotel-a",
    checkInDateTime: stay.checkIn,
    checkOutDateTime: stay.checkOut,
    reservationNotes: `Website booking: ${partySummary(stay)}.`,
    rooms: [
      {
        roomTypeMasterId: "room-a",
        totalAdult: 3,
        totalChild: 2,
        requestedPets: 2,
        isPetAllowed: false,
        specialRequest: "2 pets requested; requires hotel confirmation.",
        guests: [],
      },
    ],
  });
  assert.equal(form.get("ReservationRoomTxns[0].TotalChild"), "2");
  assert.equal(form.get("ReservationRoomTxns[0].IsPetAllowed"), "0");
  assert.match(form.get("ReservationNotes"), /3 adults/);
  assert.match(form.get("ReservationRoomTxns[0].SpecialRequest"), /requires hotel confirmation/);
  assert.equal(form.has("ReservationRoomTxns[0].requestedPets"), false);
});
