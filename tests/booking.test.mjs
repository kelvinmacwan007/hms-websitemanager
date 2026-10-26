import assert from "node:assert/strict";
import test from "node:test";
import { demoHotel } from "../src/providers/mock/demoHotel.ts";
import {
  cartQuery,
  cartSubtotal,
  parseCartItems,
  resolveCart,
  selectRequestedRoom,
} from "../src/lib/booking/cart.ts";
import { parseAvailabilitySearch } from "../src/lib/booking/search.ts";
import { serializeJsonLd } from "../src/lib/seo/metadata.ts";
import { isMockMode } from "../src/lib/api/mode.ts";
import { simulatePayment } from "../src/lib/payment/mock.ts";
import { tenantFromHost } from "../src/lib/tenant/hostname.ts";

test("room-detail reservations select a current valid rate and preserve the requested quantity", () => {
  const room = structuredClone(demoHotel.rooms[0]);
  room.visible = true;
  room.availabilityStatus = "available";
  room.ratePlans = [
    { ...room.ratePlans[0], id: "hidden", visible: false, available: true, inventoryCount: 5 },
    { ...room.ratePlans[0], id: "insufficient", visible: true, available: true, inventoryCount: 1 },
    { ...room.ratePlans[0], id: "valid", visible: true, available: true, inventoryCount: 3 },
  ];
  const search = { checkIn: "2026-10-16", checkOut: "2026-10-17", rooms: 2, guests: 2 };
  const lines = selectRequestedRoom(search, [room], room.slug);
  assert.equal(lines[0].room.slug, room.slug);
  assert.equal(lines[0].rate.id, "valid");
  assert.equal(lines[0].quantity, 2);
  assert.equal(selectRequestedRoom(search, [room], "unknown"), null);
  assert.equal(selectRequestedRoom({ ...search, guests: 100 }, [room], room.slug), null);
  room.availabilityStatus = "sold-out";
  assert.equal(selectRequestedRoom(search, [room], room.slug), null);
});

test("hotel subdomains resolve independently with normalized hostnames", () => {
  assert.deepEqual(tenantFromHost("HOTEL1.patelhms.com:3000"), {
    id: "hotel1",
    hostname: "hotel1.patelhms.com",
  });
  assert.equal(tenantFromHost("hotel2.patelhms.com.").id, "hotel2");
  assert.equal(tenantFromHost("hotel1.example.com", { rootDomain: "example.com" }).id, "hotel1");
});

test("invalid or unrelated hosts cannot select a hotel", () => {
  for (const host of [
    null,
    "",
    "patelhms.com",
    "evil.com",
    "hotel1.patelhms.com.evil.com",
    "a.b.patelhms.com",
    "-hotel.patelhms.com",
    "hotel1.patelhms.com/path",
    "hotel1.patelhms.com:99999",
    "hotel1.patelhms.com,evil.com",
    "localhost",
    "hotel1.localhost",
  ]) {
    assert.equal(tenantFromHost(host), null, String(host));
  }
});

test("local hotel previews require explicit local mode", () => {
  assert.equal(tenantFromHost("hotel1.localhost:3000", { allowLocal: true }).id, "hotel1");
  assert.equal(tenantFromHost("hotel2.localhost:3000", { allowLocal: true }).id, "hotel2");
  assert.equal(tenantFromHost("localhost:3000", { allowLocal: true }).id, "demo-hotel");
  assert.equal(
    tenantFromHost("localhost", { allowLocal: true, localTenant: "hotel2" }).id,
    "hotel2",
  );
});

const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const search = { checkIn: date(2), checkOut: date(4), guests: 3, rooms: 2 };
const item = (room, rate, quantity) => JSON.stringify([room, rate, quantity]);
const validItems = [item("deluxe-city-room", "bar", 1), item("premier-sea-view", "breakfast", 1)];

test("multi-room cart resolves and totals distinct rates", () => {
  const lines = resolveCart(search, demoHotel.rooms, { item: validItems });
  assert.ok(lines);
  assert.equal(lines.length, 2);
  assert.equal(
    cartSubtotal(lines, 2),
    lines.reduce((sum, line) => sum + line.rate.price.amount * line.quantity * 2, 0),
  );
  assert.deepEqual(parseCartItems({ item: cartQuery(search, lines).getAll("item") }), [
    { roomSlug: "deluxe-city-room", rateId: "bar", quantity: 1 },
    { roomSlug: "premier-sea-view", rateId: "breakfast", quantity: 1 },
  ]);
});

test("demo payment returns explicit non-chargeable states", () => {
  assert.deepEqual(simulatePayment(120, "USD", "approved"), {
    amount: 120,
    currency: "USD",
    status: "approved",
    simulated: true,
  });
  assert.equal(simulatePayment(120, "USD", "declined").status, "declined");
  assert.equal(simulatePayment(120, "USD", "pending").status, "pending");
  assert.throws(() => simulatePayment(0, "USD", "approved"));
  assert.throws(() => simulatePayment(100, "invalid", "approved"));
});

test("cart rejects duplicate lines and incorrect total quantities", () => {
  assert.equal(
    resolveCart(search, demoHotel.rooms, { item: [validItems[0], validItems[0]] }),
    null,
  );
  assert.equal(
    resolveCart(search, demoHotel.rooms, { item: [item("deluxe-city-room", "bar", 1)] }),
    null,
  );
  assert.equal(parseCartItems({ item: item("deluxe-city-room", "bar", 1.5) }), null);
});

test("cart enforces combined guest capacity", () => {
  const crowded = { ...search, guests: 5 };
  assert.equal(
    resolveCart(crowded, demoHotel.rooms, { item: item("deluxe-city-room", "bar", 2) }),
    null,
  );
});

test("cart enforces shared room inventory across rates", () => {
  const room = {
    ...demoHotel.rooms[0],
    ratePlans: demoHotel.rooms[0].ratePlans.map((rate) => ({ ...rate, inventoryCount: 1 })),
  };
  assert.equal(
    resolveCart(search, [room], {
      item: [item(room.slug, "bar", 1), item(room.slug, "deluxe-breakfast", 1)],
    }),
    null,
  );
});

test("cart rejects mixed currencies", () => {
  const otherCurrency = demoHotel.rooms[0].ratePlans[0].price.currency === "EUR" ? "USD" : "EUR";
  const room = {
    ...demoHotel.rooms[1],
    ratePlans: demoHotel.rooms[1].ratePlans.map((rate) => ({
      ...rate,
      price: { ...rate.price, currency: otherCurrency },
    })),
  };
  assert.equal(resolveCart(search, [demoHotel.rooms[0], room], { item: validItems }), null);
});

test("search rejects past, reversed, and overlong stays", () => {
  assert.ok(
    parseAvailabilitySearch({ checkIn: date(2), checkOut: date(4), guests: "3", rooms: "2" })
      .search,
  );
  assert.ok(
    parseAvailabilitySearch({ checkIn: date(-2), checkOut: date(1), guests: "3", rooms: "2" })
      .error,
  );
  assert.ok(
    parseAvailabilitySearch({ checkIn: date(4), checkOut: date(2), guests: "3", rooms: "2" }).error,
  );
  assert.ok(
    parseAvailabilitySearch({ checkIn: date(2), checkOut: date(40), guests: "3", rooms: "2" })
      .error,
  );
});

test("hotel JSON-LD cannot terminate its script tag", () => {
  const json = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
  assert.equal(json.includes("</script>"), false);
  assert.equal(JSON.parse(json).name, "</script><script>alert(1)</script>");
});

test("production defaults to HMS unless mock mode is explicit", () => {
  const originalMode = process.env.WEBSITE_ENV;
  const originalNodeEnv = process.env.NODE_ENV;
  try {
    delete process.env.WEBSITE_ENV;
    process.env.NODE_ENV = "production";
    assert.equal(isMockMode(), false);
    process.env.WEBSITE_ENV = "mock";
    assert.equal(isMockMode(), true);
    process.env.WEBSITE_ENV = "production";
    assert.equal(isMockMode(), false);
  } finally {
    if (originalMode === undefined) delete process.env.WEBSITE_ENV;
    else process.env.WEBSITE_ENV = originalMode;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
