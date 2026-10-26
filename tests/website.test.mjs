import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import ts from "typescript";
import { demoHotel } from "../src/providers/mock/demoHotel.ts";
import { DEFAULT_BOOKING_SETTINGS, propertyDate, offsetDate } from "../src/lib/booking/settings.ts";
import { parseAvailabilitySearch } from "../src/lib/booking/search.ts";
import { resolveCart } from "../src/lib/booking/cart.ts";
import { visibleRooms } from "../src/lib/booking/visibility.ts";

// Load the actual pure modules without Next's server/runtime or alias resolver.
const project = fileURLToPath(new URL("../", import.meta.url));
function load(relative) {
  const filename = path.resolve(project, relative);
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", outputText)((specifier) => {
    const target = path.resolve(path.dirname(filename), specifier);
    return load(target.endsWith(".ts") ? target : `${target}.ts`);
  }, exports);
  return exports;
}
const {
  createWebsiteDocument,
  parseWebsiteDocument,
  preservePmsData,
  presentationPayload,
  contentIssues,
} = load("Portal/content.ts");
const { publicProvider } = load("src/lib/api/publicProvider.ts");
const { roomDisplayRates } = load("src/lib/booking/displayRates.ts");

test("website documents accept API icon URLs on hotel and room amenities", () => {
  const hotel = structuredClone(demoHotel);
  const iconUrl = "https://hms.example.com/files/amenity/wifi.svg";
  hotel.amenities[0].iconUrl = iconUrl;
  hotel.rooms[0].amenities[0].iconUrl = iconUrl;
  const document = parseWebsiteDocument(createWebsiteDocument(hotel));
  assert.equal(document.hotel.amenities[0].iconUrl, iconUrl);
  assert.equal(document.hotel.rooms[0].amenities[0].iconUrl, iconUrl);
  assert.equal(
    parseWebsiteDocument(JSON.parse(JSON.stringify(document))).hotel.rooms[0].amenities[0].iconUrl,
    iconUrl,
  );
});

test("new and existing hotels get a default short description without replacing custom copy", () => {
  const hotel = { ...structuredClone(demoHotel), description: " " };
  const created = createWebsiteDocument(hotel);
  assert.ok(created.hotel.description.includes(hotel.name));
  assert.equal(hotel.description, " ");
  created.hotel.description = "";
  const restored = parseWebsiteDocument(created);
  assert.ok(restored.hotel.description.includes(hotel.name));
  assert.equal(
    contentIssues(restored).some((issue) => issue.includes("description in General")),
    false,
  );
  restored.hotel.description = "Our own introduction.";
  assert.equal(parseWebsiteDocument(restored).hotel.description, "Our own introduction.");
});

test("room display prices use HMS stay rates without replacing catalogue data or mutating it", async () => {
  const hotel = structuredClone(demoHotel);
  const room = hotel.rooms[0];
  delete room.startingPrice;
  const before = structuredClone(hotel);
  const tenant = { id: hotel.tenantId, hostname: "hotel.example.com" };
  let search;
  const result = await roomDisplayRates(
    {
      searchAvailability: async (actualTenant, value) => {
        assert.deepEqual(actualTenant, tenant);
        search = value;
        return [
          {
            id: room.id,
            startingPrice: { amount: 189, currency: "USD" },
            images: [],
            name: "Operational label",
          },
        ];
      },
    },
    tenant,
    hotel,
  );
  assert.deepEqual(result.rooms[0].startingPrice, { amount: 189, currency: "USD" });
  assert.equal(result.rooms[0].name, room.name);
  assert.deepEqual(result.rooms[0].images, room.images);
  assert.deepEqual(hotel, before);
  assert.deepEqual(search, { ...result.rateDates, guests: 1, rooms: 1 });
  const settings = hotel.bookingSettings ?? DEFAULT_BOOKING_SETTINGS;
  assert.equal(result.rateDates.checkOut, offsetDate(result.rateDates.checkIn, settings.minStay));
  assert.equal(result.rateError, false);
});

test("unavailable display rates keep room cards usable without inventing prices", async () => {
  const hotel = structuredClone(demoHotel);
  hotel.rooms.forEach((room) => delete room.startingPrice);
  const tenant = { id: hotel.tenantId, hostname: "hotel.example.com" };
  const failed = await roomDisplayRates(
    {
      searchAvailability: async () => {
        throw new Error("HMS offline");
      },
    },
    tenant,
    hotel,
  );
  assert.equal(failed.rateError, true);
  assert.deepEqual(failed.rooms, hotel.rooms);
  const empty = await roomDisplayRates({ searchAvailability: async () => [] }, tenant, hotel);
  assert.equal(
    empty.rooms.every((room) => !room.startingPrice),
    true,
  );
});

test("website appearance survives drafts and payloads while preserving HMS room data", () => {
  const current = createWebsiteDocument(demoHotel);
  const draft = structuredClone(current);
  Object.assign(draft.hotel.branding, {
    websiteStyle: "resort",
    buttonStyle: "pill",
    imageStyle: "rounded",
    cornerRadius: 20,
  });
  const restored = preservePmsData(parseWebsiteDocument(draft), current);
  assert.equal(restored.hotel.branding.buttonStyle, "pill");
  assert.equal(presentationPayload(restored).content.branding.cornerRadius, 20);
  const operational = (rooms) =>
    rooms.map((room) => ({
      id: room.id,
      occupancy: room.occupancy,
      startingPrice: room.startingPrice,
      rates: room.ratePlans.map((rate) => ({ id: rate.id, price: rate.price })),
    }));
  assert.deepEqual(operational(restored.hotel.rooms), operational(current.hotel.rooms));
  draft.hotel.branding.cornerRadius = 25;
  assert.throws(() => parseWebsiteDocument(draft), /corner radius/);
  draft.hotel.branding.cornerRadius = 12;
  draft.hotel.branding.buttonStyle = "unknown";
  assert.throws(() => parseWebsiteDocument(draft), /buttonStyle/);
});

test("enquiry recipient survives draft restore and is included separately from PMS email", () => {
  const current = createWebsiteDocument(demoHotel);
  const draft = structuredClone(current);
  draft.hotel.contact.enquiryEmail = "enquiries@example.com";
  draft.hotel.contact.email = "changed@example.com";
  const restored = preservePmsData(parseWebsiteDocument(draft), current);
  assert.equal(restored.hotel.contact.enquiryEmail, "enquiries@example.com");
  assert.equal(restored.hotel.contact.email, current.hotel.contact.email);
  assert.equal(presentationPayload(restored).content.enquiryEmail, "enquiries@example.com");
  draft.hotel.contact.enquiryEmail = "invalid-email";
  assert.ok(contentIssues(draft).some((issue) => issue.includes("enquiryEmail")));
  draft.hotel.contact.enquiryEmail = "";
  assert.equal(presentationPayload(draft).content.enquiryEmail, undefined);
});

test("legacy website drafts gain defaults and reject malformed setup/settings", () => {
  const legacy = createWebsiteDocument(demoHotel);
  delete legacy.setupStep;
  assert.equal(parseWebsiteDocument(legacy).hotel.paymentSettings.mode, "pay-at-property");
  assert.throws(() => parseWebsiteDocument({ ...legacy, setupStep: 7 }));
  legacy.hotel.bookingSettings = { ...DEFAULT_BOOKING_SETTINGS, minStay: 3, maxStay: 2 };
  assert.throws(() => parseWebsiteDocument(legacy));
});

test("imports cannot replace PMS identity, capacity, rates, extras, or invent rooms", () => {
  const current = createWebsiteDocument(demoHotel);
  const draft = structuredClone(current);
  draft.hotel.rooms[0].occupancy = 99;
  draft.hotel.rooms[0].ratePlans[0].price.amount = 1;
  draft.hotel.rooms[0].ratePlans[0].inventoryCount = 999;
  draft.hotel.rooms[0].name = "Updated display name";
  draft.hotel.rooms[0].visible = false;
  draft.hotel.rooms[0].ratePlans[0].visible = false;
  draft.hotel.rooms.push({ ...draft.hotel.rooms[0], id: "invented-room" });
  draft.hotel.extras = [];
  const restored = preservePmsData(draft, current);
  assert.equal(restored.hotel.rooms.length, current.hotel.rooms.length);
  assert.equal(restored.hotel.rooms[0].occupancy, current.hotel.rooms[0].occupancy);
  assert.deepEqual(
    restored.hotel.rooms[0].ratePlans[0].price,
    current.hotel.rooms[0].ratePlans[0].price,
  );
  assert.equal(
    restored.hotel.rooms[0].ratePlans[0].inventoryCount,
    current.hotel.rooms[0].ratePlans[0].inventoryCount,
  );
  assert.equal(restored.hotel.rooms[0].name, "Updated display name");
  assert.equal(restored.hotel.rooms[0].visible, false);
  assert.equal(restored.hotel.rooms[0].ratePlans[0].visible, false);
  assert.deepEqual(restored.hotel.extras, current.hotel.extras);
  draft.hotel.id = "other-hotel";
  assert.throws(() => preservePmsData(draft, current));
});

test("backend draft/publish payload excludes operational room and rate values", () => {
  const payload = presentationPayload(parseWebsiteDocument(createWebsiteDocument(demoHotel)));
  assert.equal(payload.rooms[0].pmsRoomTypeId, demoHotel.rooms[0].id);
  const serialized = JSON.stringify(payload);
  for (const field of [
    "inventoryCount",
    "startingPrice",
    "occupancy",
    "availabilityStatus",
    "ratePlans",
    '"price"',
  ])
    assert.equal(serialized.includes(field), false, field);
  assert.equal(payload.paymentSettings.mode, "pay-at-property");
});

test("hiding a rate removes it from direct cart selections and hiding all rates hides its room", () => {
  const room = structuredClone(demoHotel.rooms[0]);
  room.ratePlans.forEach((rate) => {
    rate.visible = false;
  });
  assert.equal(visibleRooms([room]).length, 0);
  const today = propertyDate();
  const search = {
    checkIn: offsetDate(today, 2),
    checkOut: offsetDate(today, 4),
    guests: 1,
    rooms: 1,
  };
  assert.equal(
    resolveCart(search, [room], { item: JSON.stringify([room.slug, room.ratePlans[0].id, 1]) }),
    null,
  );
});

test("booking limits use the PMS timezone and apply at server-side search validation", () => {
  const now = new Date("2026-10-05T00:30:00Z");
  assert.equal(propertyDate("America/Los_Angeles", now), "2026-10-04");
  const params = { checkIn: "2026-10-04", checkOut: "2026-10-06", guests: "2", rooms: "1" };
  assert.ok(
    parseAvailabilitySearch(params, DEFAULT_BOOKING_SETTINGS, "America/Los_Angeles", now).search,
  );
  assert.ok(parseAvailabilitySearch(params, DEFAULT_BOOKING_SETTINGS, "Asia/Kolkata", now).error);
  const rules = {
    ...DEFAULT_BOOKING_SETTINGS,
    minStay: 3,
    maxRooms: 1,
    minAdvanceDays: 2,
    advanceWindow: 7,
  };
  for (const extra of [
    { checkOut: "2026-10-07" },
    { checkIn: "2026-10-06", checkOut: "2026-10-09" },
    { checkIn: "2026-10-20", checkOut: "2026-10-23" },
    { rooms: "2" },
  ]) {
    assert.ok(
      parseAvailabilitySearch(
        { checkIn: "2026-10-07", checkOut: "2026-10-10", guests: "2", rooms: "1", ...extra },
        rules,
        "UTC",
        now,
      ).error,
    );
  }
});

test("public provider uses published visibility even when availability returns stale flags", async () => {
  const hotel = structuredClone(demoHotel);
  hotel.rooms[0].visible = false;
  hotel.rooms[1].ratePlans[0].visible = false;
  const provider = publicProvider({
    getHotel: async () => hotel,
    searchAvailability: async () => structuredClone(demoHotel.rooms),
    getRooms: async () => structuredClone(demoHotel.rooms),
    getRoomBySlug: async (_, slug) => demoHotel.rooms.find((room) => room.slug === slug),
  });
  const tenant = { id: hotel.tenantId, hostname: "localhost" };
  const today = propertyDate();
  const rooms = await provider.searchAvailability(tenant, {
    checkIn: offsetDate(today, 2),
    checkOut: offsetDate(today, 4),
    guests: 2,
    rooms: 1,
  });
  assert.equal(
    rooms.some((room) => room.id === hotel.rooms[0].id),
    false,
  );
  assert.equal(
    rooms
      .find((room) => room.id === hotel.rooms[1].id)
      ?.ratePlans.some((rate) => rate.id === hotel.rooms[1].ratePlans[0].id),
    false,
  );
  assert.equal(
    (await provider.getRooms(tenant)).some((room) => room.id === hotel.rooms[0].id),
    false,
  );
  assert.equal(await provider.getRoomBySlug(tenant, hotel.rooms[0].slug), null);
});

test("promotions reject duplicate codes, invalid dates and unsupported PMS room references", () => {
  const document = parseWebsiteDocument(createWebsiteDocument(demoHotel));
  const promo = {
    id: "promo1",
    code: "SAVE10",
    enabled: true,
    type: "percentage",
    value: 10,
    from: "2026-10-01",
    until: "2026-10-31",
    roomTypeIds: [],
    buyNights: 3,
    freeNights: 1,
  };
  document.promotions = [promo];
  const baseline = contentIssues(document).length;
  for (const override of [
    { value: 101 },
    { until: "2026-09-30" },
    { from: "2026-02-30" },
    { roomTypeIds: ["invented-id"] },
    { type: "stay-free", freeNights: 0 },
  ]) {
    document.promotions = [{ ...promo, ...override }];
    assert.ok(contentIssues(document).length > baseline);
  }
  document.promotions = [promo, { ...promo, id: "promo2", code: "save10" }];
  assert.ok(contentIssues(document).length > baseline);
});

test("disabled hotel and room amenities persist in drafts but disappear from public reads", async () => {
  const hotel = structuredClone(demoHotel);
  hotel.amenities[0].enabled = false;
  hotel.rooms[0].amenities[0].enabled = false;
  const document = parseWebsiteDocument(createWebsiteDocument(hotel));
  assert.equal(presentationPayload(document).content.amenities[0].enabled, false);
  assert.equal(presentationPayload(document).rooms[0].amenities[0].enabled, false);
  const provider = publicProvider({
    getHotel: async () => hotel,
    getRooms: async () => demoHotel.rooms,
    getRoomBySlug: async (_, slug) => demoHotel.rooms.find((room) => room.slug === slug),
    searchAvailability: async () => demoHotel.rooms,
  });
  const tenant = { id: hotel.tenantId, hostname: "localhost" };
  assert.equal(
    (await provider.getHotel(tenant)).amenities.some((item) => item.id === hotel.amenities[0].id),
    false,
  );
  assert.equal(
    (await provider.getRoomBySlug(tenant, hotel.rooms[0].slug)).amenities.some(
      (item) => item.id === hotel.rooms[0].amenities[0].id,
    ),
    false,
  );
});
