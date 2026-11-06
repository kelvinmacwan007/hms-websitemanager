import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^(['"])(.*)\1$/, "$2")];
    }),
);
const account = Object.values(JSON.parse(env.PATEL_HMS_TENANTS_JSON))[0];
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const context = await browser.newContext();
  const response = await context.request.post(base + "/api/manager/login", {
    timeout: 120000,
    headers: { Origin: base },
    data: {
      username: account.userIdentity,
      password: account.password,
      customerCode: account.customerCode,
    },
  });
  assert.equal(response.status(), 200);
  const result = await response.json();
  if (result.chooseProperty) {
    const selected = await context.request.post(base + "/api/manager/login", {
      headers: { Origin: base },
      data: {
        username: account.userIdentity,
        password: account.password,
        customerCode: account.customerCode,
        tenantId: result.properties[0].tenantId,
      },
    });
    assert.equal(selected.status(), 200);
  }

  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  await page.route("**/api/website/amenities", (route) =>
    route.fulfill({
      json: {
        amenities: [
          {
            id: "custom",
            label: "Custom icon",
            rooms: ["Suite"],
            iconUrl: "https://icons.example.com/custom.svg",
          },
          {
            id: "wifi",
            label: "Free Wi-Fi",
            rooms: ["Suite"],
            iconUrl: "https://icons.example.com/wifi.svg",
          },
          {
            id: "room-service",
            label: "Room Service",
            rooms: ["Suite"],
            iconUrl: "https://icons.example.com/room-service.svg",
          },
          { id: "missing", label: "Missing icon", rooms: ["Suite"] },
          {
            id: "broken",
            label: "Broken icon",
            rooms: ["Suite"],
            iconUrl: "https://icons.example.com/broken.svg",
          },
        ],
      },
    }),
  );
  await page.route("https://icons.example.com/custom.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="blue"/></svg>',
    }),
  );
  await page.route(/https:\/\/icons\.example\.com\/(broken|wifi|room-service)\.svg/, (route) =>
    route.fulfill({ status: 404, body: "missing" }),
  );
  await page.goto(base + "/website-manager", { waitUntil: "networkidle", timeout: 120000 });
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Amenities", exact: true })
    .click();
  const items = page.locator('[aria-label="HMS amenities"] li');
  await items.filter({ hasText: "Custom icon" }).locator("img").waitFor();
  assert.equal(
    await items
      .filter({ hasText: "Custom icon" })
      .locator("img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await items.filter({ hasText: "Missing icon" }).locator("svg.lucide-star").waitFor();
  await items.filter({ hasText: "Broken icon" }).locator("svg.lucide-star").waitFor();
  await items.filter({ hasText: "Free Wi-Fi" }).locator("svg.lucide-wifi").waitFor();
  await items.filter({ hasText: "Room Service" }).locator("svg.lucide-bed-double").waitFor();
  console.log(
    "Custom HMS icons render; unavailable Wi-Fi/room-service files use matching icons; unknown amenities use stars.",
  );
} finally {
  await browser.close();
}
