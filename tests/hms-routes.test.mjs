import { readLimitedText } from "../src/lib/api/body.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import ts from "typescript";
import { requestOrigin } from "../src/lib/api/origin.ts";
import { parseHmsGuest, validateReservationRooms } from "../src/lib/booking/hmsValidation.ts";
import { HMS_READ_ONLY } from "../src/lib/api/hmsPolicy.ts";
import { guestParty, partySummary } from "../src/lib/booking/party.ts";

const token = "a".repeat(64);
const guest = {
  firstName: "Test",
  lastName: "Guest",
  email: "test@example.com",
  mobile: "1234567890",
  gender: 0,
  countryId: 1,
  stateId: 2,
  cityId: 3,
  zipCode: "12345",
};
const stay = { checkIn: "2026-10-10", checkOut: "2026-10-12", guests: 2, rooms: 1 };
function fixture({
  balance = 120,
  paymentSuccess = true,
  failCreation = false,
  propertyId = "property-a",
  cookie = true,
  readOnly = false,
  staySearch = stay,
  occupancy = 2,
  petsAllowed,
  addOnRequests = [],
} = {}) {
  let session = null,
    creations = 0,
    charges = 0,
    forwardedPayment,
    forwardedReservation,
    scopedCookie;
  const api = {
    createReservation: async (value) => {
      creations++;
      forwardedReservation = value;
      if (failCreation) throw new Error("Timeout");
      return "reservation-a";
    },
    getReservationDetails: async () => ({
      propertyId,
      checkInDateTime: "2026-10-10T15:00:00",
      checkOutDateTime: "2026-10-12T12:00:00",
      totalRooms: 1,
      totalAdult: guestParty(staySearch).adults,
      totalChild: guestParty(staySearch).children,
      balanceAmount: balance,
      reservationStatus: 1,
      reservationRoomTxns: [{ roomTypeMasterId: "room-a" }],
    }),
    getPaymentDetails: async () => ({
      propertyId,
      reservationId: "reservation-a",
      totalPayable: 120,
    }),
    payByCard: async (value) => {
      charges++;
      forwardedPayment = value;
      if (paymentSuccess) balance = 0;
      return { success: paymentSuccess };
    },
  };
  const room = { id: "room-a", occupancy, petsAllowed };
  const deps = {
    "next/headers": {
      cookies: async () => ({
        get: () => (cookie ? { value: token } : undefined),
        set: (...args) => {
          scopedCookie = args;
        },
      }),
    },
    "node:crypto": { createHash },
    "@/lib/tenant/resolveTenant": { resolveTenant: async () => ({ id: "hotel-a" }) },
    "@/lib/api/origin": { requestOrigin },
    "@/lib/api/body": { readLimitedText },
    "@/lib/api/rateLimit": { allowRequest: () => true },
    "@/lib/website/pages": { pageEnabled: () => true },
    "@/lib/api/mode": { isMockMode: () => false },
    "@/lib/api/hmsPolicy": { HMS_READ_ONLY: readOnly },
    "@/lib/api/provider": {
      getWebsiteProvider: () => ({
        getHotel: async () => ({ configured: true }),
        searchAvailability: async () => [room],
      }),
    },
    "@/lib/booking/demoSelection": {
      resolveDemoSelection: () => ({ lines: [{ room, quantity: 1 }], addOnRequests }),
    },
    "@/lib/booking/search": { parseAvailabilitySearch: () => ({ search: staySearch }) },
    "@/lib/booking/hmsValidation": { parseHmsGuest, validateReservationRooms },
    "@/lib/booking/party": { guestParty, partySummary },
    "@/lib/booking/hmsSession": {
      HMS_COOKIE: "hms-booking",
      validBookingToken: (value) => /^[a-f0-9]{64}$/.test(value ?? ""),
      readHmsSession: async () => session && structuredClone(session),
      writeHmsSession: async (_, __, value) => {
        session = structuredClone(value);
      },
      withHmsSessionLock: async (_, __, operation) => operation(),
    },
    "@/services/patelHms/websiteIntegration": {
      getHmsConnection: () => ({ propertyId: "property-a", currency: "USD" }),
      getHmsWebsiteIntegration: () => api,
    },
    "@/services/patelHms/propertyContext": {
      getHmsStayTimes: () => ({
        checkInDateTime: "2026-10-10T15:00:00",
        checkOutDateTime: "2026-10-12T12:00:00",
      }),
    },
  };
  const source = readFileSync(
    new URL("../src/app/api/booking/hms/route.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    assert.ok(name in deps, name);
    return deps[name];
  }, exports);
  const post = (body, origin = "https://hotel-a.patelhms.com") =>
    exports.POST(
      new Request("https://hotel-a.patelhms.com/api/booking/hms", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  const reserve = () =>
    post({
      action: "reserve",
      accessToken: token,
      query: "item=test",
      rooms: [{ totalAdult: 2, guest }],
    });
  return {
    post,
    reserve,
    get: () =>
      exports.GET(new Request("https://hotel-a.patelhms.com/api/booking/hms?action=status")),
    stats: () => ({
      session,
      creations,
      charges,
      forwardedPayment,
      forwardedReservation,
      scopedCookie,
    }),
  };
}
const card = {
  cardHolderName: "Test Guest",
  cardNumber: "4111111111111111",
  expiryDate: "12/29",
  securityCode: "123",
  cardType: "VISA",
};

test("current testing policy blocks every public POST with zero writes", async () => {
  const app = fixture({ readOnly: HMS_READ_ONLY });
  for (const action of ["reserve", "pay", "resume"])
    assert.equal((await app.post({ action })).status, 403);
  assert.equal(app.stats().creations, 0);
  assert.equal(app.stats().charges, 0);
  assert.equal(app.stats().session, null);
});

test("live booking rejects cross-origin and malformed requests before writes", async () => {
  const app = fixture();
  assert.equal((await app.post({ action: "reserve" }, "https://evil.example")).status, 403);
  for (const body of [null, [], "text", false]) assert.equal((await app.post(body)).status, 400);
  assert.equal(app.stats().creations, 0);
});
test("live reservation is verified, cookie scoped, and duplicate submission returns the same ID", async () => {
  const app = fixture();
  assert.equal((await app.reserve()).status, 200);
  assert.equal((await app.reserve()).status, 200);
  assert.equal(app.stats().creations, 1);
  assert.equal(app.stats().session.state, "reserved");
  assert.equal(app.stats().scopedCookie[2].httpOnly, true);
  assert.equal(app.stats().scopedCookie[2].sameSite, "strict");
  assert.equal(JSON.stringify(app.stats().session).includes(guest.email), false);
});
test("a timeout records attention and cannot replay reservation creation", async () => {
  const app = fixture({ failCreation: true });
  assert.equal((await app.reserve()).status, 502);
  assert.equal((await app.reserve()).status, 409);
  assert.equal(app.stats().creations, 1);
  assert.equal(app.stats().session.state, "attention");
});
test("a cross-property reservation cannot authorize payment", async () => {
  const app = fixture({ propertyId: "property-b" });
  assert.equal((await app.reserve()).status, 502);
  assert.equal((await app.post({ action: "pay", amount: 120, card })).status, 409);
  assert.equal(app.stats().charges, 0);
});
test("payment ignores browser reservation IDs, rejects changed balances and prevents duplicate charges", async () => {
  const app = fixture();
  await app.reserve();
  assert.equal((await app.post({ action: "pay", amount: 1, card })).status, 409);
  assert.equal(app.stats().charges, 0);
  assert.equal(
    (await app.post({ action: "pay", amount: 120, reservationId: "attacker", card })).status,
    200,
  );
  assert.equal(app.stats().forwardedPayment.reservationId, "reservation-a");
  assert.equal(app.stats().session.state, "paid");
  assert.equal(JSON.stringify(app.stats().session).includes(card.cardNumber), false);
  assert.equal((await app.post({ action: "pay", amount: 120, card })).status, 409);
  assert.equal(app.stats().charges, 1);
});
test("reservation details require the opaque booking access cookie", async () => {
  const app = fixture({ cookie: false });
  await app.reserve();
  assert.equal((await app.get()).status, 502);
  assert.equal((await app.post({ action: "pay", amount: 120, card })).status, 502);
  assert.equal(app.stats().charges, 0);
});

test("an interrupted response restores the booking cookie without another write", async () => {
  const app = fixture({ cookie: false });
  await app.reserve();
  assert.equal((await app.post({ action: "resume", accessToken: token })).status, 200);
  assert.equal(app.stats().creations, 1);
  assert.equal(app.stats().scopedCookie[1], token);
  assert.equal((await app.post({ action: "resume", accessToken: "guess" })).status, 400);
});

test("family booking sends child counts and pet requests without granting unknown pet permission", async () => {
  const staySearch = { ...stay, guests: 4, adults: 3, children: 1, pets: 1 };
  const app = fixture({ staySearch, occupancy: 4 });
  const result = await app.post({
    action: "reserve",
    accessToken: token,
    query: "item=test",
    rooms: [{ totalAdult: 3, totalChild: 1, pets: 1, guest }],
  });
  assert.equal(result.status, 200);
  const request = app.stats().forwardedReservation;
  assert.equal(request.rooms[0].totalChild, 1);
  assert.equal(request.rooms[0].isPetAllowed, false);
  assert.match(request.rooms[0].specialRequest, /requires hotel confirmation/);
  assert.match(request.reservationNotes, /3 adults, 1 child/);
});

test("family booking rejects missing children, pet mismatches and known pet restrictions before writes", async () => {
  const staySearch = { ...stay, guests: 4, adults: 3, children: 1, pets: 1 };
  for (const [room, petsAllowed] of [
    [{ totalAdult: 3, totalChild: 0, pets: 1, guest }, undefined],
    [{ totalAdult: 3, totalChild: 1, pets: 0, guest }, undefined],
    [{ totalAdult: 3, totalChild: 1, pets: 1, guest }, false],
    [{ totalAdult: 4, totalChild: 1, pets: 1, guest }, undefined],
  ]) {
    const app = fixture({ staySearch, occupancy: 4, petsAllowed });
    assert.equal(
      (await app.post({ action: "reserve", accessToken: token, query: "item=test", rooms: [room] }))
        .status,
      400,
    );
    assert.equal(app.stats().creations, 0);
  }
});

test("validated service requests reach HMS notes without being recorded as paid charges", async () => {
  const app = fixture({
    addOnRequests: [{ item: { id: "parking", name: "Car parking" }, quantity: 2 }],
  });
  assert.equal((await app.reserve()).status, 200);
  assert.match(
    app.stats().forwardedReservation.reservationNotes,
    /Requested services \(subject to hotel confirmation\): 2 x Car parking/,
  );
  assert.equal(app.stats().charges, 0);
  assert.equal(app.stats().session.state, "reserved");
});
