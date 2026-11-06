import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://demo-hotel.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const output = "artifacts/booking-pickers";
mkdirSync(output, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/rooms", { waitUntil: "domcontentloaded", timeout: 90000 });
  const form = page
    .locator("form")
    .filter({ has: page.locator('input[name="checkIn"]') })
    .first();
  await form.waitFor();
  // Wait for hydration before clicking SSR-rendered controls on a cold production page.
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-haspopup="dialog"]');
    return (
      button &&
      Object.keys(button).some(
        (key) => key.startsWith("__reactProps") && typeof button[key]?.onClick === "function",
      )
    );
  });
  for (const width of [1440, 1024, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const label of ["Check-in", "Check-out"]) {
      const trigger = form.getByRole("button", { name: new RegExp(`^${label}:`) });
      await trigger.click();
      const calendar = page.getByRole("dialog", {
        name: "Choose your stay dates",
        exact: true,
      });
      await calendar.waitFor();
      const box = await calendar.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `calendar fits at ${width}`);
      assert.equal(await calendar.locator("section:visible").count(), width > 640 ? 2 : 1);
      assert.equal((await calendar.locator("button[data-date]:disabled").count()) > 0, true);
      await calendar.screenshot({ path: `${output}/${width}-${label}.png` });
      await page.keyboard.press("Escape");
      assert.equal(await trigger.getAttribute("aria-expanded"), "false");
      assert.equal(await trigger.evaluate((e) => document.activeElement === e), true);
    }
    for (const label of ["Guests", "Rooms"]) {
      const trigger = form.getByRole("button", { name: new RegExp(`^${label}`) });
      await trigger.click();
      const popup = page.getByRole("dialog", { name: label, exact: true });
      await popup.waitFor();
      const box = await popup.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, `${label} fits at ${width}`);
      assert.equal(await popup.locator("output").count(), label === "Guests" ? 3 : 1);
      await popup.screenshot({ path: `${output}/${width}-${label}.png` });
      await page.keyboard.press("Escape");
      assert.equal(await trigger.evaluate((e) => document.activeElement === e), true);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    console.log(`Pickers passed at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await form.getByRole("button", { name: /^Rooms/ }).click();
  await page.getByRole("button", { name: "Increase rooms", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert.equal(await form.locator('input[name="rooms"]').inputValue(), "2");
  await form.getByRole("button", { name: /^Guests/ }).click();
  await page.getByRole("button", { name: "Increase children", exact: true }).click();
  await page.getByRole("button", { name: "Increase pets", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  assert.equal(await form.locator('input[name="guests"]').inputValue(), "3");
  assert.equal(await form.locator('input[name="children"]').inputValue(), "1");
  assert.equal(await form.locator('input[name="pets"]').inputValue(), "1");
  await form.getByRole("button", { name: /^Check-in:/ }).click();
  const calendar = page.getByRole("dialog");
  const available = calendar.locator("button[data-date]:not(:disabled)");
  const chosen = await available.nth(2).getAttribute("data-date");
  await available.nth(2).click();
  assert.equal(await calendar.isVisible(), true, "Arrival keeps the range picker open");
  assert.equal(
    await calendar.getByRole("button", { name: "Done", exact: true }).isDisabled(),
    true,
  );
  const departure = calendar.locator("button[data-date]:not(:disabled)").filter({ hasText: /./ });
  const dates = await departure.evaluateAll((nodes) => nodes.map((node) => node.dataset.date));
  const end = dates.find((day) => day > chosen);
  assert.ok(end);
  await calendar.locator(`button[data-date="${end}"]`).click();
  assert.equal(await calendar.isVisible(), false);
  assert.equal(await form.locator('input[name="checkIn"]').inputValue(), chosen);
  assert.equal(await form.locator('input[name="checkOut"]').inputValue(), end);
  await form.getByRole("button", { name: /^Check-out:/ }).click();
  await page.getByRole("button", { name: "Close calendar", exact: true }).click();
  assert.equal(
    await form.locator('input[name="checkOut"]').inputValue(),
    end,
    "Cancel keeps the committed range",
  );
  await form.getByRole("button", { name: /^Check-in:/ }).click();
  await calendar.locator(`button[data-date="${chosen}"]`).click();
  await page.keyboard.press("Escape");
  assert.equal(await form.locator('input[name="checkIn"]').inputValue(), chosen);
  assert.equal(
    await form.locator('input[name="checkOut"]').inputValue(),
    end,
    "An unfinished range is not committed",
  );
  await form.getByRole("button", { name: /^Check-out:/ }).click();
  const laterEnd = new Date(`${end}T12:00:00Z`);
  laterEnd.setUTCDate(laterEnd.getUTCDate() + 1);
  const updatedEnd = laterEnd.toISOString().slice(0, 10);
  await calendar.locator(`button[data-date="${updatedEnd}"]`).click();
  assert.equal(await form.locator('input[name="checkIn"]').inputValue(), chosen);
  assert.equal(await form.locator('input[name="checkOut"]').inputValue(), updatedEnd);
  const detailHref = await page
    .getByRole("region", { name: "Room results" })
    .locator("h3 a")
    .first()
    .getAttribute("href");
  await page.goto(new URL(detailHref, base).href, { waitUntil: "domcontentloaded" });
  const reservation = page.getByRole("complementary", { name: "Room reservation" });
  await reservation.getByRole("button", { name: /^Check-in:/ }).click();
  const roomCalendar = page.getByRole("dialog", { name: "Choose your stay dates", exact: true });
  const roomStart = await roomCalendar
    .locator("button[data-date]:not(:disabled)")
    .first()
    .getAttribute("data-date");
  await roomCalendar.locator(`button[data-date="${roomStart}"]`).click();
  const roomDates = await roomCalendar
    .locator("button[data-date]:not(:disabled)")
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.date));
  const roomEnd = roomDates.find((day) => day > roomStart);
  await roomCalendar.locator(`button[data-date="${roomEnd}"]`).click();
  const reserveHref = await reservation
    .getByRole("link", { name: "Reserve this room", exact: true })
    .getAttribute("href");
  const stay = new URL(reserveHref, base).searchParams;
  assert.equal(stay.get("checkIn"), roomStart);
  assert.equal(stay.get("checkOut"), roomEnd);
  assert.deepEqual(errors, []);
  console.log(
    "Two-click stay ranges, checkout edits, cancellation, room reservation dates, guest counts and keyboard dismissal passed.",
  );
} finally {
  await browser.close();
}
