import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL || "http://demo-hotel.localhost:3001";
mkdirSync("artifacts/booking-flow", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const date = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
  const q = new URLSearchParams({ checkIn: date(2), checkOut: date(4), guests: "2", rooms: "1" });
  q.append("item", JSON.stringify(["deluxe-city-room", "bar", 1]));
  await page.goto(`${base}/booking/cart?${q}`, { waitUntil: "networkidle", timeout: 120000 });
  const current = () => page.locator('[aria-current="step"]');
  assert.match(await current().innerText(), /Rooms/);
  assert.equal(
    await page.getByRole("navigation", { name: "Booking steps" }).getByRole("link").count(),
    0,
  );
  assert.equal(await page.locator("article[data-motion-card]").count(), 1);
  await page.getByRole("link", { name: "Continue to extras", exact: true }).click();
  await page.waitForURL("**/booking/extras?**");
  assert.match(await current().innerText(), /Extras/);
  for (const width of [1920, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
      `extras fits ${width}`,
    );
    if (width === 1440 || width === 390)
      await page.screenshot({ path: `artifacts/booking-flow/extras-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const extra = page.getByRole("checkbox").first();
  if (await extra.count()) await extra.check();
  await page.getByRole("link", { name: "Continue to guest details", exact: true }).click();
  await page.waitForURL("**/booking/checkout?**");
  assert.match(await current().innerText(), /Guest details/);
  assert.ok(new URL(page.url()).searchParams.has("extra"), "selected extras survive checkout");
  await page.locator("input[name=firstName]").fill("Test");
  await page.locator("input[name=lastName]").fill("Guest");
  await page.locator("input[name=email]").fill("test@example.com");
  await page.locator("input[name=phone]").fill("3055550100");
  await page.locator("select[name=prefix]").selectOption("Mr");
  for (const box of await page.locator("input[type=checkbox][required]").all()) await box.check();
  await page.getByRole("button", { name: "Review sample details", exact: true }).click();
  const inlinePayment = page.getByRole("button", { name: "Continue to payment", exact: true });
  if (await inlinePayment.count()) {
    await inlinePayment.click();
    await page.getByRole("region", { name: "Secure payment", exact: true }).waitFor();
  } else {
    await page.getByRole("link", { name: "Continue to payment", exact: true }).click();
    await page.waitForURL("**/booking/payment?**");
  }
  await current().filter({ hasText: "Payment" }).waitFor();
  assert.match(await current().innerText(), /Payment/);
  assert.equal(
    await page
      .getByRole("navigation", { name: "Booking steps" })
      .getByRole("link", { name: /Confirmation/ })
      .count(),
    0,
  );
  await page.screenshot({ path: "artifacts/booking-flow/payment.png", fullPage: true });
  await page.goto(`${base}/booking/confirmation`, { waitUntil: "domcontentloaded" });
  assert.equal(
    await page.getByText("No confirmed reservation to display.", { exact: true }).count(),
    1,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Booking steps, selection, guest details, payment guards and responsive extras passed.",
  );
} finally {
  await browser.close();
}
