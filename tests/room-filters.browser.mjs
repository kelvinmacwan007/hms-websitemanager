import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { mkdirSync } from "node:fs";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(120000);
  const base = process.env.QA_URL || "http://knot.localhost:3000";
  await page.goto(base + "/rooms", { waitUntil: "networkidle", timeout: 120000 });

  const sidebar = page.getByRole("complementary", { name: "Room filters" });
  const results = page.getByRole("region", { name: "Room results" });
  const cards = results.locator("article");
  const original = await cards.count();
  assert.ok(original > 0);
  const typeGroup = sidebar.getByRole("group", { name: "Room types", exact: true });
  await typeGroup.getByRole("checkbox").first().check();
  await page.waitForFunction(
    () => document.querySelectorAll('[aria-label="Room results"] article').length === 1,
  );
  assert.equal(await cards.count(), 1);
  await sidebar.getByRole("button", { name: "Reset all", exact: true }).click();
  await page.waitForFunction(
    (count) => document.querySelectorAll('[aria-label="Room results"] article').length === count,
    original,
  );
  assert.equal(await cards.count(), original);
  const amenityGroup = sidebar.getByRole("group", { name: "Amenities", exact: true });
  await amenityGroup.getByRole("checkbox").first().check();
  assert.ok((await cards.count()) <= original);
  await sidebar.getByRole("button", { name: "Reset all", exact: true }).click();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  assert.equal(
    await page.getByRole("button", { name: "List view", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "Grid view", exact: true }).click();
  await typeGroup.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: /^Guests\b/ }).click();
  await page.getByRole("button", { name: "Decrease adults", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("region", { name: "Room availability" })
    .getByRole("button", { name: "Check availability", exact: true })
    .click();
  await page.waitForURL((url) => url.pathname === "/rooms" && url.searchParams.has("checkIn"));
  await page.waitForLoadState("networkidle");
  const query = new URL(page.url()).searchParams;
  assert.equal(query.get("guests"), "1");
  assert.ok(query.get("type"));
  assert.equal(
    await page
      .getByRole("group", { name: "Room types", exact: true })
      .getByRole("checkbox")
      .first()
      .isChecked(),
    true,
  );
  await page.getByRole("button", { name: "Reset all", exact: true }).click();
  await page.getByRole("combobox", { name: "Sort rooms", exact: true }).selectOption("price-high");
  await page.getByRole("combobox", { name: "Sort rooms", exact: true }).selectOption("price-low");
  mkdirSync("artifacts/rooms-filters", { recursive: true });
  await page.screenshot({ path: "artifacts/rooms-filters/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "artifacts/rooms-filters/mobile.png", fullPage: true });
  console.log(
    "Room-type and amenity filters, reset, availability submission, preserved filters and mobile layout verified.",
  );
} finally {
  await browser.close();
}
