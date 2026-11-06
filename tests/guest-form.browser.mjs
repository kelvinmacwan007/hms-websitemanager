import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 850 } });
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    checkIn: date(2),
    checkOut: date(3),
    guests: "2",
    rooms: "1",
    room: "deluxe-city-room",
    rate: "bar",
  });
  await page.goto(
    `${process.env.QA_URL || "http://demo-hotel.localhost:3001"}/booking/checkout?${query}`,
    { waitUntil: "networkidle" },
  );
  const country = page.locator('select[aria-label="Country or region"]');
  await country.selectOption("US");
  const state = page.locator('select[aria-label="State or province"]');
  await state.selectOption("CA");
  const city = page.locator('input[name="city"]');
  await city.fill("Los Angeles");
  await country.selectOption("IN");
  await state.selectOption("GJ");
  assert.equal(await city.inputValue(), "", "country change clears previous city");
  await city.fill("Vadodara");
  const phone = page.locator("[data-phone-display]");
  await page.locator('select[aria-label="Phone country"]').selectOption("IN");
  await phone.fill("9876543210");
  await phone.blur();
  assert.equal(await page.locator('input[name="phone"]').inputValue(), "+919876543210");
  const zip = page.locator('input[name="postalCode"]');
  await zip.fill("12345");
  await zip.blur();
  assert.equal(await zip.getAttribute("aria-invalid"), "true");
  await zip.fill("390001");
  await zip.blur();
  assert.notEqual(await zip.getAttribute("aria-invalid"), "true");
  await page.locator('select[name="prefix"]').selectOption("Mr");
  const name = page.locator('input[name="firstName"]');
  await name.fill("   ");
  await name.blur();
  assert.equal(await name.getAttribute("aria-invalid"), "true");
  await name.fill("José");
  await page.locator('input[name="lastName"]').fill("O’Connor");
  await page.locator('input[name="email"]').fill("guest@example.com");
  for (const checkbox of await page.locator('input[type="checkbox"][required]').all())
    await checkbox.check();
  await page.getByRole("button", { name: "Review details", exact: true }).click();
  await page.getByRole("heading", { name: "Your details are ready.", exact: true }).waitFor();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector('input[name="region"]')?.value === "Gujarat",
  );
  assert.equal(await city.inputValue(), "Vadodara", "edit keeps guest city");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  console.log(
    "Guest form passed: dependent locations, phone formatting, postal errors, international names, review/edit and mobile layout.",
  );
} finally {
  await browser.close();
}
