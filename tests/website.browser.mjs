import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

// Reuse the existing local browser QA installation.
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://localhost:3000";
const errors = [];
mkdirSync("artifacts/website-flow", { recursive: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/website-manager`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Website editor sections" });
  await nav.getByRole("button", { name: "Amenities", exact: true }).click();
  assert.equal(await page.locator(".wm-amenity-presets .wm-amenity-icon svg").count(), 16);
  const wifi = page.getByRole("switch", { name: "Wi-Fi amenity", exact: true });
  const initialAmenities = await page
    .locator(".wm-preview-viewport .wm-site-amenities article")
    .count();
  await wifi.uncheck();
  assert.equal(
    await page.locator(".wm-preview-viewport .wm-site-amenities article").count(),
    initialAmenities - 1,
  );
  await wifi.check();
  await page.getByRole("switch", { name: "Pet friendly amenity", exact: true }).check();
  assert.equal(
    await page.locator(".wm-preview-viewport .wm-site-amenities article").count(),
    initialAmenities + 1,
  );
  await page.getByRole("button", { name: "Add amenity", exact: true }).click();
  await page.getByLabel("Amenity name", { exact: true }).fill("Rooftop terrace");
  await page.getByRole("button", { name: "Other amenity icon", exact: true }).click();
  await page
    .getByRole("switch", { name: "Show Rooftop terrace on website", exact: true })
    .uncheck();
  assert.equal(
    await page
      .locator(".wm-preview-viewport .wm-site-amenities")
      .getByText("Rooftop terrace", { exact: true })
      .count(),
    0,
  );
  await page.screenshot({ path: "artifacts/website-flow/amenity-picker.png", fullPage: true });
  await nav.getByRole("button", { name: "Gallery", exact: true }).click();
  const photos = page.locator(".wm-photo-stack > details");
  assert.equal(await photos.count(), 9);
  assert.equal(await page.locator(".wm-photo-thumbnail img").count(), 9);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aR2sAAAAASUVORK5CYII=",
    "base64",
  );
  await page.getByLabel("Upload multiple gallery photos").setInputFiles([
    { name: "pool-view.png", mimeType: "image/png", buffer: png },
    { name: "garden-view.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("status").filter({ hasText: "2 images added" }).waitFor();
  assert.equal(await photos.count(), 11);
  assert.equal(await page.locator(".wm-photo-thumbnail img").count(), 11);
  await photos.nth(10).locator(":scope > summary").click();
  await photos.nth(10).getByRole("button", { name: "Move up", exact: true }).click();
  assert.match(await photos.nth(9).locator(":scope > summary").textContent(), /garden view/);
  await page
    .getByLabel("Upload multiple gallery photos")
    .setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await page.getByRole("alert").filter({ hasText: "No images were added" }).waitFor();
  assert.equal(await photos.count(), 11);
  await photos.nth(9).locator(":scope > summary").click();
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  await page.screenshot({ path: "artifacts/website-flow/gallery-stack.png", fullPage: true });
  await nav.getByRole("button", { name: "Rooms", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Add room", exact: true }).count(), 0);
  await page.locator(".wm-collection summary").first().click();
  assert.equal(
    await page.getByLabel("Guests per room (from Patel HMS)").first().getAttribute("readonly"),
    "",
  );
  await page.getByRole("switch", { name: "Show this room on the website" }).first().uncheck();
  assert.equal(await page.locator(".wm-preview-viewport .wm-site-room").count(), 3);
  await page.getByRole("switch", { name: "Show this room on the website" }).first().check();
  const roomPhotos = page
    .locator(".wm-collection > details")
    .first()
    .locator(".wm-photo-stack > details");
  const roomPhotoCount = await roomPhotos.count();
  await page
    .getByLabel("Upload multiple room photos")
    .first()
    .setInputFiles([
      { name: "room-window.png", mimeType: "image/png", buffer: png },
      { name: "room-bed.png", mimeType: "image/png", buffer: png },
    ]);
  await page.getByRole("status").filter({ hasText: "2 images added" }).waitFor();
  assert.equal(await roomPhotos.count(), roomPhotoCount + 2);
  await nav.getByRole("button", { name: "Rates & inventory", exact: true }).click();
  const rateSwitches = page.locator(".wm-editor-fields").getByRole("switch");
  assert.ok((await rateSwitches.count()) > 0);
  await rateSwitches.first().uncheck();
  await rateSwitches.first().check();
  await nav.getByRole("button", { name: "Promotions", exact: true }).click();
  await page.getByRole("button", { name: "Add promotion", exact: true }).click();
  await page.getByLabel("Promotion code", { exact: true }).fill("TEST10");
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Draft saved" }).waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByRole("button", { name: "Restore draft", exact: true }).count(), 0);
  await nav.getByRole("button", { name: "Promotions", exact: true }).click();
  await page.locator(".wm-collection summary").first().click();
  assert.equal(await page.getByLabel("Promotion code", { exact: true }).inputValue(), "TEST10");
  assert.equal(await page.getByRole("region", { name: "Hotel setup wizard" }).count(), 0);
  assert.equal(await page.locator(".wm-overview").count(), 0);
  assert.equal(await nav.getByRole("button", { name: "SEO & sharing", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Test booking flow", exact: true }).click();
  const dialog = page.getByRole("region", { name: "Booking flow test", exact: true });
  await page.getByRole("button", { name: "Tablet preview", exact: true }).click();
  await dialog.getByRole("button", { name: "Search sample rooms", exact: true }).click();
  await dialog.locator(".wm-test-rate input").first().fill("1");
  await dialog.getByRole("button", { name: "Guest details", exact: true }).click();
  await dialog.getByLabel("Phone (required)", { exact: true }).fill("5550100100");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Review payment policy", exact: true }).click();
  await dialog.getByRole("button", { name: "Preview reservation success", exact: true }).click();
  await page.screenshot({ path: "artifacts/website-flow/desktop-test.png", fullPage: true });
  await page.getByText("Current draft booking test completed.", { exact: true }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Publish website", exact: true }).isDisabled(),
    false,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Test booking flow", exact: true }).click();
  await page.getByRole("button", { name: "Mobile preview", exact: true }).click();
  await page.screenshot({ path: "artifacts/website-flow/mobile-test.png", fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto(`${base}/booking`, { waitUntil: "networkidle" });
  assert.ok(
    await page.getByRole("button", { name: "Check availability", exact: true }).isVisible(),
  );
  assert.ok(await page.getByRole("button", { name: /^Check-in:/ }).isVisible());
  assert.deepEqual(errors, []);
  console.log(
    "Website flow QA passed: amenity presets/icons/toggles, multiple image uploads, photo reordering, PMS locks, visibility, promotions, draft restore, booking preview, mobile layout, and public search.",
  );
} finally {
  await browser.close();
}
