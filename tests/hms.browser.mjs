import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer, request } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Exercise the live adapter against a local fake HMS; never contact the real API.
const require = createRequire(
  path.join(process.env.TEMP ?? tmpdir(), "hotel-homepage-qa", "package.json"),
);
const { chromium } = require("playwright");
const temp = mkdtempSync(path.join(tmpdir(), "hotel-hms-qa-"));
const snapshot = JSON.parse(readFileSync("config/hms-properties.example.json", "utf8"));
snapshot["hotel-a"].id = "property-a";
snapshot["hotel-a"].name = "HMS test hotel";
writeFileSync(path.join(temp, "properties.json"), JSON.stringify(snapshot));
const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const checkIn = date(2),
  checkOut = date(4);
let balance = 240,
  creates = 0,
  charges = 0;
const calls = [];
const backend = createServer(async (request, response) => {
  let text = "";
  for await (const chunk of request) text += chunk;
  const endpoint = request.url;
  calls.push(endpoint);
  response.setHeader("content-type", "application/json");
  const send = (data) => response.end(JSON.stringify(data));
  const data = (value) => send({ response: 1, data: value });
  if (endpoint.endsWith("/Account/login"))
    return send({
      token: "fake-hms-token",
      expiration: new Date(Date.now() + 3600000).toISOString(),
    });
  assert.equal(request.headers.authorization, "Bearer fake-hms-token");
  if (endpoint.endsWith("/RoomManagement/room-types"))
    return data({
      records: [
        {
          id: "room-a",
          propertyId: "property-a",
          typeName: "Suite",
          displayName: "Suite",
          maxOccupancy: 3,
          roomTypeStatus: 1,
          roomTypeImages: [],
          roomTypeAmenities: [],
        },
      ],
      pager: { totalPages: 1 },
    });
  if (endpoint.endsWith("/reservation-room-types"))
    return data([
      {
        id: "room-a",
        typeName: "Suite",
        displayName: "Suite",
        availableRooms: 5,
        roomRateByRateType: 120,
        maxOccupancy: 3,
        roomTypeImagesPath: [],
      },
    ]);
  if (endpoint.endsWith("/rate-forecast"))
    return data([{ roomTypeMasterId: "room-a", rateDate: checkIn, rate: 120, dayName: "Day" }]);
  if (endpoint.endsWith("/country")) return data([{ text: "India", value: "1" }]);
  if (endpoint.endsWith("/state/1")) return data([{ text: "Gujarat", value: "2" }]);
  if (endpoint.endsWith("/city/2")) return data([{ text: "Ahmedabad", value: "3" }]);
  if (endpoint.includes("/location-by-zipcode/"))
    return data({ countryId: 1, stateId: 2, cityId: 3 });
  if (endpoint.endsWith("/iu/reservation")) {
    creates++;
    assert.ok(request.headers["content-type"].startsWith("multipart/form-data; boundary="));
    assert.ok(text.includes('name="ReservationRoomTxns[0].ReservationGuestInfos[0].FirstName"'));
    return send({ response: 2, data: "reservation-qa" });
  }
  if (endpoint.endsWith("/reservation-details/reservation-qa"))
    return data({
      propertyId: "property-a",
      checkInDateTime: `${checkIn}T15:00:00`,
      checkOutDateTime: `${checkOut}T12:00:00`,
      totalRooms: 1,
      totalAdult: 2,
      balanceAmount: balance,
      reservationStatus: 1,
      reservationRoomTxns: [{ roomTypeMasterId: "room-a" }],
    });
  if (endpoint.endsWith("/reservation-payment-details/reservation-qa"))
    return data({ propertyId: "property-a", reservationId: "reservation-qa", totalPayable: 240 });
  if (endpoint.endsWith("/card-payment")) {
    charges++;
    const payment = JSON.parse(text);
    assert.equal(payment.reservationId, "reservation-qa");
    assert.equal(payment.amount, 240);
    balance = 0;
    return send({ success: true, message: "Approved test payment" });
  }
  response.statusCode = 404;
  return send({ response: 2, message: "Unknown test endpoint" });
});
await new Promise((resolve) => backend.listen(0, resolve));
const apiPort = backend.address().port;
const appPort = Number(process.env.HMS_QA_PORT ?? 3108);
const base = `http://hotel-a.localhost:${appPort}`;
const app = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--webpack", "-p", String(appPort)],
  {
    env: {
      ...process.env,
      NODE_ENV: "development",
      WEBSITE_ENV: "live",
      PATEL_HMS_API_URL: `http://localhost:${apiPort}`,
      PATEL_HMS_TENANTS_JSON: JSON.stringify({
        "hotel-a": {
          userIdentity: "fake",
          password: "fake",
          customerCode: "fake",
          propertyId: "property-a",
          currency: "INR",
          checkInTime: "15:00",
          checkOutTime: "12:00",
        },
      }),
      PATEL_HMS_PROPERTIES_FILE: path.join(temp, "properties.json"),
      PATEL_HMS_BOOKING_STORE: path.join(temp, "bookings"),
      PATEL_HMS_LOCAL_TENANT_ID: "hotel-a",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);
let log = "";
app.stdout.on("data", (chunk) => {
  log += chunk;
});
app.stderr.on("data", (chunk) => {
  log += chunk;
});
let browser;
try {
  for (let attempt = 0; attempt < 90; attempt++) {
    try {
      const status = await new Promise((resolve, reject) => {
        const probe = request(
          `http://localhost:${appPort}/api/booking/hms?action=countries`,
          { headers: { host: new URL(base).host } },
          (response) => {
            response.resume();
            resolve(response.statusCode);
          },
        );
        probe.on("error", reject);
        probe.setTimeout(5000, () => probe.destroy(new Error("Readiness timeout")));
        probe.end();
      });
      if (status === 200) break;
    } catch {}
    if (app.exitCode !== null) throw new Error(log);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const query = new URLSearchParams({
    checkIn,
    checkOut,
    guests: "2",
    rooms: "1",
    item: JSON.stringify(["room-room-a", "hms-standard", 1]),
  });
  await page.goto(`${base}/booking/checkout?${query}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Room rates", exact: true }).waitFor();
  await page.getByRole("button", { name: "View daily rates: Suite" }).click();
  await page.getByRole("table").waitFor();
  assert.equal(await page.locator("main form").count(), 0);
  mkdirSync("artifacts/hms", { recursive: true });
  await page.screenshot({ path: "artifacts/hms/checkout-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  await page.screenshot({ path: "artifacts/hms/checkout-mobile.png", fullPage: true });
  for (const action of ["reserve", "pay"]) {
    const status = await page.evaluate(async (action) => {
      const response = await fetch("/api/booking/hms", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      return response.status;
    }, action);
    assert.equal(status, 403);
  }
  await page.goto(`${base}/booking/payment`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("main form").count(), 0);
  assert.equal(creates, 0);
  assert.equal(charges, 0);
  assert.deepEqual(errors, []);
  assert.ok(calls.some((endpoint) => endpoint.endsWith("reservation-room-types")));
  assert.ok(calls.some((endpoint) => endpoint.endsWith("rate-forecast")));
  console.log(
    "PASS: read-only rooms/forecasts, desktop/mobile, no submission forms; reservation and payment POST blocked with zero upstream writes.",
  );
} catch (error) {
  console.error(log.slice(-6000));
  throw error;
} finally {
  if (browser) await browser.close();
  if (process.platform === "win32")
    spawnSync("taskkill", ["/pid", String(app.pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  else app.kill("SIGTERM");
  await new Promise((resolve) => backend.close(resolve));
}
