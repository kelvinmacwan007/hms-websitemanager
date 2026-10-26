import { readLimitedText } from "../src/lib/api/body.ts";
import { requestOrigin } from "../src/lib/api/origin.ts";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import { parseAvailabilitySearch } from "../src/lib/booking/search.ts";

// Compile the actual handlers and replace only their server-side dependencies.
function loadHandler(path, rooms = [], hotel = { configured: true }) {
  const source = readFileSync(new URL(`../src/app/api/${path}/route.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const dependencies = {
    "@/lib/api/origin": { requestOrigin },
    "@/lib/api/body": { readLimitedText },
    "@/lib/api/provider": {
      getWebsiteProvider: () => ({
        getHotel: async () => hotel,
        searchAvailability: async () => rooms,
      }),
    },
    "@/lib/api/mode": { isMockMode: () => true },
    "@/lib/payment/demoMode": { isDemoPaymentMode: () => true },
    "@/lib/tenant/resolveTenant": { resolveTenant: async () => ({ id: "demo-hotel" }) },
    "@/lib/booking/search": { parseAvailabilitySearch },
    "@/lib/booking/demoSelection": {},
    "@/lib/payment/mock": {},
  };
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  }, exports);
  return exports.POST;
}

const request = (body) =>
  new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

for (const path of ["rooms/availability", "rooms/availability-calendar", "booking/demo-payment"]) {
  test(`${path} rejects non-object JSON without crashing`, async () => {
    const post = loadHandler(path);
    for (const body of [null, [], "text", 1, false]) {
      const response = await post(request(body));
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error, "Invalid request.");
    }
  });
}

for (const status of ["available", "sold-out"]) {
  test(`availability endpoints respect ${status} room status`, async () => {
    const rooms = [
      {
        slug: "test-room",
        availabilityStatus: status,
        occupancy: 2,
        ratePlans: [
          {
            id: "bar",
            name: "Standard",
            available: true,
            inventoryCount: 1,
            price: { amount: 100, currency: "USD" },
          },
        ],
      },
    ];
    const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const response = await loadHandler(
      "rooms/availability",
      rooms,
    )(request({ slug: "test-room", checkIn: date(2), checkOut: date(3), guests: 1, rooms: 1 }));
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.available, status === "available");
    assert.equal(result.rates.length, status === "available" ? 1 : 0);
    const calendar = await loadHandler(
      "rooms/availability-calendar",
      rooms,
    )(request({ slug: "test-room", month: date(2).slice(0, 7) }));
    assert.equal(calendar.status, 200);
    assert.equal((await calendar.json()).available.length > 0, status === "available");
  });
}

test("availability API applies property booking limits before returning rates", async () => {
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const hotel = {
    configured: true,
    timeZone: "UTC",
    bookingSettings: {
      minStay: 3,
      maxStay: 10,
      minAdvanceDays: 0,
      advanceWindow: 30,
      maxRooms: 1,
      requirePhone: true,
      requireAddress: false,
    },
  };
  const response = await loadHandler(
    "rooms/availability",
    [],
    hotel,
  )(request({ slug: "test-room", checkIn: date(2), checkOut: date(3), guests: 1, rooms: 1 }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /3 to 10 nights/);
});

test("availability validates family composition and respects known pet restrictions", async () => {
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const body = {
    slug: "test-room",
    checkIn: date(2),
    checkOut: date(3),
    guests: 3,
    rooms: 1,
    adults: 2,
    children: 1,
    pets: 1,
  };
  const rooms = [
    {
      slug: "test-room",
      availabilityStatus: "available",
      occupancy: 3,
      petsAllowed: false,
      ratePlans: [
        {
          id: "bar",
          name: "Standard",
          available: true,
          inventoryCount: 1,
          price: { amount: 100, currency: "USD" },
        },
      ],
    },
  ];
  const post = loadHandler("rooms/availability", rooms);
  assert.equal((await post(request({ ...body, children: [1] }))).status, 400);
  assert.equal((await post(request({ ...body, children: 2 }))).status, 400);
  assert.equal((await (await post(request(body))).json()).available, false);
  assert.equal((await (await post(request({ ...body, pets: 0 }))).json()).available, true);
});
