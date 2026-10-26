import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate } from "../src/lib/booking/settings.ts";

function load(file, dependencies) {
  const { outputText } = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  new Function("require", "exports", outputText)((name) => {
    if (name === "server-only") return {};
    assert.ok(name in dependencies, `Unexpected dependency ${name}`);
    return dependencies[name];
  }, exports);
  return exports;
}

test("HMS readiness requires a positive current rate for the property's room and respects stay rules", async () => {
  let result = [];
  let stay;
  const { hmsRateReadiness } = load("src/services/patelHms/rateReadiness.ts", {
    "@/lib/booking/settings": { DEFAULT_BOOKING_SETTINGS, offsetDate, propertyDate },
    "./propertyContext": { getHmsStayTimes: (_, search) => (stay = search) },
    "./websiteIntegration": {
      getHmsWebsiteIntegration: () => ({
        getRoomTypes: async () => {
          if (result instanceof Error) throw result;
          return result;
        },
      }),
    },
  });
  const hotel = {
    rooms: [{ id: "room-a" }],
    timeZone: "UTC",
    bookingSettings: { ...DEFAULT_BOOKING_SETTINGS, minAdvanceDays: 2, minStay: 3 },
  };
  for (const [rooms, expected] of [
    [[], false],
    [[{ id: "other", averageRate: 100 }], false],
    [[{ id: "room-a", averageRate: 0, baseRate: 100 }], false],
    [[{ id: "room-a", averageRate: -1 }], false],
    [[{ id: "room-a", averageRate: NaN }], false],
    [[{ id: "room-a", averageRate: 100 }], true],
    [[{ id: "room-a", baseRate: 100 }], true],
    [new Error("HMS offline"), null],
  ]) {
    result = rooms;
    assert.equal(await hmsRateReadiness({ id: "hotel-a" }, hotel), expected);
  }
  assert.equal(stay.checkIn, offsetDate(propertyDate("UTC"), 2));
  assert.equal(stay.checkOut, offsetDate(stay.checkIn, 3));
});

test("every live publish action checks HMS before writing; drafts remain available", async () => {
  for (const action of ["publish", "apply-publish", "apply-website", "apply-draft", "draft"]) {
    for (const readiness of [false, null, true]) {
      let writes = 0;
      let checks = 0;
      const hosted = action.startsWith("apply-") && action !== "apply-website";
      const hotel = { configured: true, id: "property", rooms: [] };
      const { POST } = load("src/app/api/website/document/route.ts", {
        "@/lib/api/body": { readLimitedText: (request) => request.text() },
        "@/lib/tenant/resolveTenant": { resolveTenant: async () => ({ id: "hotel-a" }) },
        "@/lib/api/provider": { getOperationalProvider: () => ({ getHotel: async () => hotel }) },
        "@/lib/website/authorization": { developmentAuthorization: { authorize: async () => {} } },
        "@/lib/website/persistence": {
          getWebsitePersistence: () => ({
            saveDraft: async () => {
              writes++;
            },
            publishDocument: async () => {
              writes++;
            },
          }),
        },
        "@/lib/website/presentation": {
          validatePresentation: () => ({
            content: { branding: {} },
            paymentSettings: { mode: "pay-at-property" },
          }),
          presentationDocument: () => ({ hotel }),
        },
        "../../../../../Portal/content": { contentIssues: () => [] },
        "@/lib/api/mode": { isMockMode: () => false },
        "@/lib/tenant/domains": {
          publishHotelDomain: async () => ({ publishedSubdomain: "hotel" }),
          publicHotelUrl: () => "https://hotel.example.com",
        },
        "@/lib/manager/session": { isManagerHost: () => hosted },
        "@/services/patelHms/rateReadiness": {
          HMS_RATES_REQUIRED: "Verified HMS rates are required to publish.",
          hmsRateReadiness: async () => {
            checks++;
            return readiness;
          },
        },
      });
      const response = await POST(
        new Request("https://hotel.example.com/api/website/document", {
          method: "POST",
          body: JSON.stringify({ action, document: {} }),
        }),
      );
      // Legacy draft/publish actions are already disallowed in live mode.
      if (["draft", "publish"].includes(action)) {
        assert.equal(response.status, 403);
        assert.equal(writes, 0);
      } else if (action === "apply-draft") {
        assert.equal(response.status, 200);
        assert.equal(checks, 0);
        assert.equal(writes, 1);
      } else {
        assert.equal(checks, 1);
        assert.equal(response.status, readiness === true ? 200 : 409);
        assert.equal(writes, readiness === true ? 2 : 0);
      }
    }
  }
});
