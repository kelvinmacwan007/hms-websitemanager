import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { reservationFormData } from "../src/services/patelHms/reservationForm.ts";
import {
  mapHmsRooms,
  mapHmsCatalogRooms,
  hmsImageUrl,
} from "../src/services/patelHms/roomMapping.ts";
import { visibleRooms } from "../src/lib/booking/visibility.ts";
import { parseHmsGuest, validateReservationRooms } from "../src/lib/booking/hmsValidation.ts";
import { HMS_READ_ONLY } from "../src/lib/api/hmsPolicy.ts";
import { catalogAmenities, hmsAmenityIconUrl } from "../src/services/patelHms/amenities.ts";

test("HMS amenity icons use custom paths and ignore missing, placeholder and unsafe URLs", () => {
  const base = "https://hms.example.com";
  assert.equal(
    hmsAmenityIconUrl({ amenityIconPath: "/icons/wifi.svg" }, base),
    `${base}/icons/wifi.svg`,
  );
  assert.equal(
    hmsAmenityIconUrl({ amenityIcon: "https://cdn.example.com/pool.png" }, base),
    "https://cdn.example.com/pool.png",
  );
  for (const path of [
    undefined,
    "",
    " ",
    "/images/placeholders/amenity.svg",
    "javascript:alert(1)",
    "http://example.com/icon.svg",
    "https://user:pass@example.com/icon.svg",
  ])
    assert.equal(hmsAmenityIconUrl({ amenityIconPath: path }, base), undefined);
  const rooms = [
    {
      roomTypeStatus: 1,
      displayName: "Suite",
      roomTypeAmenities: [{ amenityMasterId: "wifi", amenityName: "Wi-Fi" }],
    },
    {
      roomTypeStatus: 1,
      displayName: "Deluxe",
      roomTypeAmenities: [
        { amenityMasterId: "wifi", amenityName: "Wi-Fi", amenityIconPath: "/icons/wifi.svg" },
      ],
    },
  ];
  assert.equal(catalogAmenities(rooms, base)[0].iconUrl, `${base}/icons/wifi.svg`);
  assert.deepEqual(catalogAmenities(rooms, base)[0].rooms, ["Suite", "Deluxe"]);
});

test("HMS room mapping preserves API amenity icons", () => {
  const [room] = mapHmsCatalogRooms(
    [
      {
        id: "suite",
        propertyId: "property",
        typeName: "Suite",
        displayName: "Suite",
        maxOccupancy: 2,
        roomTypeStatus: 1,
        roomTypeAmenities: [
          {
            amenityMasterId: "wifi",
            amenityName: "Wi-Fi",
            amenityIconPath: "/files/amenity/wifi.svg",
          },
          {
            amenityMasterId: "phone",
            amenityName: "Telephone",
            amenityIconPath: "/images/placeholders/amenity.svg",
          },
        ],
      },
    ],
    "https://hms.example.com",
  );
  assert.equal(room.amenities[0].iconUrl, "https://hms.example.com/files/amenity/wifi.svg");
  assert.equal(room.amenities[1].iconUrl, undefined);
});

test("HMS amenities include all active room amenities once with their room names", () => {
  const room = (id, name, amenities, status = 1) => ({
    id,
    typeName: name,
    displayName: name,
    roomTypeStatus: status,
    roomTypeAmenities: amenities,
  });
  const wifi = { amenityMasterId: "wifi", amenityName: "Wi-Fi" };
  const result = catalogAmenities([
    room("a", "Deluxe", [wifi, wifi]),
    room("b", "Suite", [
      wifi,
      { amenityMasterId: "ac", amenityName: "Air conditioning" },
      { amenityMasterId: "blank", amenityName: " " },
    ]),
    room("c", "Inactive", [{ amenityMasterId: "pool", amenityName: "Pool" }], 0),
    room("d", "Standard", undefined),
  ]);
  assert.deepEqual(result, [
    { id: "ac", label: "Air conditioning", rooms: ["Suite"] },
    { id: "wifi", label: "Wi-Fi", rooms: ["Deluxe", "Suite"] },
  ]);
  assert.deepEqual(catalogAmenities([]), []);
});

function loadAdapter(fetch, readOnly = false) {
  const source = readFileSync(
    new URL("../src/services/patelHms/websiteIntegration.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    if (name === "server-only") return {};
    if (name === "@/lib/manager/connections")
      return { managerConnection: () => undefined, readConnection: () => undefined };
    if (name === "@/lib/api/hmsPolicy") return { HMS_READ_ONLY: readOnly };
    if (name === "./client") return { hmsFetch: fetch };
    if (name === "./reservationForm") return { reservationFormData };
    throw new Error(`Unexpected dependency ${name}`);
  }, exports);
  return exports;
}

test("logo sync refreshes the authenticated profile instead of reusing a cached logo", async () => {
  let logins = 0;
  const { HmsWebsiteIntegration } = loadAdapter(async () =>
    Response.json({
      token: `token-${++logins}`,
      expiration: new Date(Date.now() + 3600000).toISOString(),
      user: {
        currentWorkProfile: {
          propertyId: "property-a",
          propertyName: "Hotel A",
          propertyLogoPath: `/logo-${logins}.png`,
        },
      },
    }),
  );
  const adapter = new HmsWebsiteIntegration({
    baseUrl: "https://hms.example.com",
    userIdentity: "manager",
    password: "password",
    customerCode: "customer",
    propertyId: "property-a",
    currency: "INR",
  });
  assert.equal((await adapter.getPropertyProfile()).propertyLogoPath, "/logo-1.png");
  assert.equal((await adapter.getPropertyProfile()).propertyLogoPath, "/logo-1.png");
  assert.equal((await adapter.refreshPropertyProfile()).propertyLogoPath, "/logo-2.png");
  assert.equal((await adapter.getPropertyProfile()).propertyLogoPath, "/logo-2.png");
  assert.equal(logins, 2);
});

test("HMS reads retry a timeout once and stop after a second timeout", async () => {
  for (const recovers of [true, false]) {
    let reads = 0;
    const { HmsWebsiteIntegration } = loadAdapter(async (url) => {
      if (String(url).endsWith("/login"))
        return respond({
          token: "token",
          expiration: new Date(Date.now() + 3600000).toISOString(),
        });
      reads++;
      if (reads === 1 || !recovers) throw new DOMException("Timed out", "TimeoutError");
      return respond({ response: 1, data: [] });
    });
    const api = new HmsWebsiteIntegration(connection);
    if (recovers) assert.deepEqual(await api.getCountries(), []);
    else await assert.rejects(api.getCountries(), { name: "TimeoutError" });
    assert.equal(reads, 2);
  }
});

test("HMS room photos resolve API-relative paths and preserve external image URLs", () => {
  const base = "https://dev-aiapi.patelhms.com";
  assert.equal(hmsImageUrl("/uploads/suite.jpg", base), `${base}/uploads/suite.jpg`);
  assert.equal(hmsImageUrl("uploads/suite.jpg", base), `${base}/uploads/suite.jpg`);
  assert.equal(
    hmsImageUrl("https://images.example.com/suite.jpg", base),
    "https://images.example.com/suite.jpg",
  );
  assert.throws(() => hmsImageUrl("javascript:alert(1)", base));
  assert.throws(() => hmsImageUrl("https://user:password@example.com/photo.jpg", base));
  const [room] = mapHmsRooms(
    [
      {
        id: "suite",
        displayName: "Suite",
        maxOccupancy: 2,
        availableRooms: 1,
        roomRateByRateType: 120,
        roomTypeImagesPath: ["/uploads/suite.jpg"],
      },
    ],
    "INR",
    base,
  );
  assert.equal(room.images[0].url, `${base}/uploads/suite.jpg`);
  assert.equal(room.images[0].alt, "Suite");
});

test("HMS catalogue rooms remain visible without invented prices or availability", () => {
  const [room] = mapHmsCatalogRooms(
    [
      {
        id: "room-a",
        propertyId: "property-a",
        typeName: "Suite",
        displayName: "Suite",
        roomTypeStatus: 1,
        maxOccupancy: 2,
        description: "API description",
        roomTypeImages: [{ id: "photo", imageNamePath: "/photo.jpg" }],
        roomTypeAmenities: [{ amenityMasterId: "wifi", amenityName: "Free Wi-Fi" }],
      },
    ],
    "https://dev-aiapi.patelhms.com",
  );
  assert.equal(room.availabilityStatus, "unknown");
  assert.equal(room.startingPrice, undefined);
  assert.deepEqual(room.ratePlans, []);
  assert.equal(visibleRooms([room]).length, 1);
  assert.equal(visibleRooms([{ ...room, visible: false }]).length, 0);
  assert.equal(room.amenities[0].label, "Free Wi-Fi");
});

test("property metadata uses workProfiles when currentWorkProfile is empty", async () => {
  const { HmsWebsiteIntegration } = loadAdapter(async () =>
    Response.json({
      token: "test",
      expiration: new Date(Date.now() + 3600000).toISOString(),
      user: {
        currentWorkProfile: null,
        workProfiles: [
          { propertyId: "property-b", propertyName: "Other" },
          {
            propertyId: "property-a",
            propertyName: "Stardust",
            ianaPropertyTimezone: "Asia/Kolkata",
          },
        ],
      },
    }),
  );
  const profile = await new HmsWebsiteIntegration(connection).getPropertyProfile();
  assert.equal(profile.propertyId, "property-a");
  assert.equal(profile.propertyName, "Stardust");
  assert.equal(profile.ianaPropertyTimezone, "Asia/Kolkata");
  assert.equal("token" in profile, false);
});

test("room catalogue pagination is scoped to the configured property", async () => {
  const pages = [];
  const { HmsWebsiteIntegration } = loadAdapter(async (url, init) => {
    if (String(url).endsWith("/Account/login"))
      return Response.json({
        token: "test",
        expiration: new Date(Date.now() + 3600000).toISOString(),
      });
    const input = JSON.parse(init.body);
    pages.push(input);
    return Response.json({
      response: 1,
      data: {
        records: [{ id: `room-${input.pager.pageNo}`, propertyId: "property-a" }],
        pager: { totalPages: 2 },
      },
    });
  });
  assert.equal((await new HmsWebsiteIntegration(connection).getRoomCatalog()).length, 2);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].filter.propertyIds, ["property-a"]);
  assert.equal(pages[1].pager.pageNo, 2);
});

test("add-ons paginate, filter inactive services and reject cross-property or invalid rates", async () => {
  const pages = [];
  let invalid = "";
  const { HmsWebsiteIntegration } = loadAdapter(async (url, init) => {
    if (String(url).endsWith("/Account/login"))
      return Response.json({
        token: "test",
        expiration: new Date(Date.now() + 3600000).toISOString(),
      });
    assert.ok(String(url).endsWith("/RoomManagement/add-ons"));
    const input = JSON.parse(init.body);
    pages.push(input);
    return Response.json({
      response: 1,
      data: {
        records: [
          {
            id: `extra-${input.pager.pageNo}`,
            name: "Breakfast",
            propertyId: invalid === "property" ? "other" : "property-a",
            rateAmount: invalid === "price" ? -1 : 10,
            isActive: 1,
          },
          {
            id: "inactive",
            name: "Inactive",
            propertyId: "property-a",
            rateAmount: 0,
            isActive: 0,
          },
        ],
        pager: { totalPages: 2 },
      },
    });
  }, true);
  const api = new HmsWebsiteIntegration(connection);
  assert.equal((await api.getAddOns()).length, 2);
  assert.equal(pages.length, 2);
  assert.equal(pages[0].filter.propertyId, "property-a");
  assert.equal(pages[0].filter.isActive, 1);
  invalid = "property";
  await assert.rejects(api.getAddOns(), /Invalid property add-on/);
  invalid = "price";
  await assert.rejects(api.getAddOns(), /Invalid property add-on/);
});

test("current read-only policy blocks service writes before login or API access", async () => {
  assert.equal(HMS_READ_ONLY, true);
  let calls = 0;
  const { HmsWebsiteIntegration } = loadAdapter(async () => {
    calls++;
  }, HMS_READ_ONLY);
  const api = new HmsWebsiteIntegration(connection);
  await assert.rejects(api.createReservation(stay), /read-only/);
  await assert.rejects(api.payByCard({}), /read-only/);
  assert.equal(calls, 0);
});
const connection = {
  baseUrl: "https://dev-aiapi.patelhms.com",
  userIdentity: "test-user",
  password: "test-password",
  customerCode: "test-customer",
  propertyId: "property-a",
  currency: "USD",
};
const guest = {
  firstName: "Test",
  lastName: "Guest",
  gender: 0,
  mobile: "1234567890",
  email: "test@example.com",
  countryId: 1,
  stateId: 2,
  cityId: 3,
  zipCode: "12345",
  guestType: 1,
  isPrimaryGuest: true,
  isChild: false,
};
const room = {
  totalAdult: 2,
  totalChild: 0,
  isPetAllowed: false,
  roomTypeMasterId: "room-a",
  guests: [guest],
};
const stay = {
  checkInDateTime: "2026-10-10T15:00:00",
  checkOutDateTime: "2026-10-12T12:00:00",
  rooms: [room],
};
const respond = (body, status = 200) => Response.json(body, { status });

test("HMS maps every documented read path and shares concurrent login", async () => {
  const calls = [];
  const { HmsWebsiteIntegration } = loadAdapter(async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/Account/login"))
      return respond({
        token: "test-token",
        expiration: new Date(Date.now() + 3600000).toISOString(),
      });
    return respond({ response: 1, data: [] });
  });
  const api = new HmsWebsiteIntegration(connection);
  await Promise.all([
    api.getRoomTypes(stay),
    api.getRateForecast("room-a", "2026-10-10"),
    api.getCountries(),
    api.getStates(1),
    api.getCities(2),
    api.getLocationByZipcode("A B"),
    api.findGuests("firstName", "A/B"),
    api.findGuests("lastName", "Guest"),
    api.findGuests("mobile", "12345"),
    api.getReservationDetails("reservation-a"),
    api.getPaymentDetails("reservation-a"),
  ]);
  assert.equal(calls.filter((call) => call.url.endsWith("/Account/login")).length, 1);
  const reads = calls.filter((call) => !call.url.endsWith("/Account/login"));
  assert.equal(reads.length, 11);
  for (const call of reads) {
    assert.equal(call.init.headers.authorization, "Bearer test-token");
    assert.equal(call.init.cache, "no-store");
  }
  assert.ok(reads.some((call) => call.url.endsWith("guest-firstname/A%2FB")));
  assert.ok(reads.some((call) => call.url.endsWith("location-by-zipcode/A%20B")));
  assert.equal(
    JSON.parse(reads.find((call) => call.url.endsWith("reservation-room-types")).init.body)
      .propertyId,
    "property-a",
  );
});

test("reservation uses indexed multipart fields and server-owned property", async () => {
  let sent;
  const { HmsWebsiteIntegration } = loadAdapter(async (url, init) => {
    if (String(url).endsWith("/Account/login"))
      return respond({ token: "token", expiration: new Date(Date.now() + 3600000).toISOString() });
    sent = { url: String(url), init };
    return respond({ response: 2, data: "reservation-a" });
  });
  assert.equal(
    await new HmsWebsiteIntegration(connection).createReservation({
      ...stay,
      propertyId: "attacker",
    }),
    "reservation-a",
  );
  assert.ok(sent.url.endsWith("/FrontDesk/iu/reservation"));
  assert.ok(sent.init.body instanceof FormData);
  assert.equal(sent.init.headers["content-type"], undefined);
  assert.equal(sent.init.body.get("PropertyId"), "property-a");
  assert.equal(
    sent.init.body.get("ReservationRoomTxns[0].ReservationGuestInfos[0].IsPrimaryGuest"),
    "1",
  );
  const form = reservationFormData({ ...stay, propertyId: "property-a", rooms: [room, room] });
  assert.equal(form.get("ReservationRoomTxns[1].TotalAdult"), "2");
  assert.equal(form.get("ReservationRoomTxns[1].ReservationGuestInfos[0].IsChild"), "0");
});

test("ambiguous creation code 2 without an ID is never treated as success", async () => {
  const { HmsWebsiteIntegration } = loadAdapter(async (url) =>
    String(url).endsWith("/Account/login")
      ? respond({ token: "token", expiration: new Date(Date.now() + 3600000).toISOString() })
      : respond({ response: 2, message: "Failed" }),
  );
  await assert.rejects(
    new HmsWebsiteIntegration(connection).createReservation(stay),
    /reservation ID/,
  );
});

test("card payment uses documented JSON contract and writes are not retried", async () => {
  let writes = 0;
  const { HmsWebsiteIntegration } = loadAdapter(async (url, init) => {
    if (String(url).endsWith("/Account/login"))
      return respond({ token: "token", expiration: new Date(Date.now() + 3600000).toISOString() });
    writes++;
    assert.ok(String(url).endsWith("/Payment/card-payment"));
    assert.equal(JSON.parse(init.body).amount, 100);
    return respond({ success: false }, 401);
  });
  await assert.rejects(
    new HmsWebsiteIntegration(connection).payByCard({
      reservationId: "reservation-a",
      amount: 100,
    }),
    /401/,
  );
  assert.equal(writes, 1);
});

test("room mapping preserves zero rates and inventory without invented prices", () => {
  const rooms = mapHmsRooms(
    [
      {
        id: "room-a",
        displayName: "Suite",
        maxOccupancy: 3,
        availableRooms: 0,
        roomRateByRateType: 0,
        averageRate: 0,
        roomTypeImagesPath: [],
      },
    ],
    "USD",
  );
  assert.equal(rooms[0].ratePlans[0].price.amount, 0);
  assert.equal(rooms[0].availabilityStatus, "sold-out");
  assert.equal(rooms[0].ratePlans[0].inventoryCount, 0);
  assert.throws(() => mapHmsRooms([{ id: "room-a", maxOccupancy: 2, availableRooms: -1 }], "USD"));
});
test("requested-stay average takes precedence over the API's zero rate-type field", () => {
  const [room] = mapHmsRooms(
    [
      {
        id: "room-a",
        typeName: "Suite",
        maxOccupancy: 2,
        availableRooms: 1,
        averageRate: 189,
        baseRate: 169,
        roomRateByRateType: 0,
        roomTypeImagesPath: [],
      },
    ],
    "USD",
  );
  assert.equal(room.startingPrice.amount, 189);
  assert.equal(room.ratePlans[0].price.amount, 189);
});

test("guest validation excludes browser-supplied guest status and verifies allocation", () => {
  assert.equal(parseHmsGuest({ ...guest, guestType: 2 }).guestType, 1);
  assert.throws(() => parseHmsGuest({ ...guest, cityId: "3" }));
  assert.throws(() => parseHmsGuest({ ...guest, email: "invalid" }));
  validateReservationRooms([room], 2, 1);
  assert.throws(() => validateReservationRooms([room], 3, 1));
});

test("HMS login distinguishes rejected credentials from an unavailable API endpoint", async () => {
  const source = readFileSync(new URL("../src/lib/manager/hmsAuth.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  for (const status of [401, 403, 404, 500, 503]) {
    const exports = {};
    new Function("require", "exports", outputText)((name) => {
      if (name === "server-only") return {};
      if (name.endsWith("/client")) return { hmsFetch: async () => new Response("", { status }) };
      if (name === "./hmsAccess") return { hmsManagerProperties: () => [] };
      throw new Error(`Unexpected dependency: ${name}`);
    }, exports);
    const result = exports.authenticateHmsManager("test-user", "test-password", "test-customer");
    if (status === 401 || status === 403) assert.equal(await result, null);
    else await assert.rejects(result, new RegExp(`HTTP ${status}`));
  }
});

test("HMS property reads report missing login endpoints without blaming credentials", async () => {
  const { HmsWebsiteIntegration } = loadAdapter(
    async () => new Response("Not Found", { status: 404 }),
  );
  await assert.rejects(
    new HmsWebsiteIntegration(connection).getPropertyProfile(),
    /endpoint was not found.*404.*PATEL_HMS_API_URL/,
  );
});
