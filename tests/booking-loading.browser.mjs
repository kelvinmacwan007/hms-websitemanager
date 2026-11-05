import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL || "http://demo-hotel.localhost:3001";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    checkIn: date(2),
    checkOut: date(4),
    guests: "2",
    rooms: "1",
  });
  query.append("item", JSON.stringify(["deluxe-city-room", "bar", 1]));
  const response = await page.goto(`${base}/booking/cart?${query}`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  const html = await response.text();
  assert.ok(
    html.indexOf('aria-label="Booking progress"') < html.indexOf("data-booking-step-content"),
  );
  const header = page.getByRole("banner");
  const progress = page.getByRole("region", { name: "Booking progress" });
  assert.equal(await header.count(), 1);
  assert.equal(await progress.count(), 1);
  await header.evaluate((node) => {
    node.dataset.persistentShell = "yes";
  });
  await progress.evaluate((node) => {
    node.dataset.persistentStepper = "yes";
  });
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let reached;
  const requested = new Promise((resolve) => {
    reached = resolve;
  });
  await page.route("**/booking/extras?**", async (route) => {
    const headers = route.request().headers();
    if (headers.rsc === "1" && headers["next-router-prefetch"] !== "1") {
      reached();
      await gate;
    }
    await route.continue();
  });
  const navigation = page.getByRole("link", { name: "Continue to extras", exact: true }).click();
  try {
    await Promise.race([
      requested,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Navigation request was not intercepted")), 10000),
      ),
    ]);
    assert.equal(await header.getAttribute("data-persistent-shell"), "yes");
    assert.equal(await progress.getAttribute("data-persistent-stepper"), "yes");
    assert.equal(await page.locator("[data-booking-step-content]").count(), 1);
    await page.locator("[data-booking-loading]").waitFor();
    assert.equal(
      await page.locator("[data-booking-step-content] [data-booking-loading]").count(),
      1,
    );
    const box = await progress.boundingBox();
    assert.ok(
      box.y >= 0 && box.y + box.height <= 1000,
      "stepper is in the viewport during loading",
    );
    await page.locator('[aria-current="step"]').filter({ hasText: "Extras" }).waitFor();
    mkdirSync("artifacts/booking-loading", { recursive: true });
    await page.screenshot({ path: "artifacts/booking-loading/navigation-pending.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileBox = await progress.boundingBox();
    assert.ok(
      mobileBox.y >= 0 && mobileBox.y + mobileBox.height <= 844,
      "mobile stepper remains visible while loading",
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
    await page.screenshot({ path: "artifacts/booking-loading/mobile-loading.png" });
    await page.setViewportSize({ width: 1440, height: 1000 });
  } finally {
    release();
  }
  await navigation;
  await page.waitForURL("**/booking/extras?**");
  await page.locator('[aria-current="step"]').filter({ hasText: "Extras" }).waitFor();
  assert.equal(
    await header.getAttribute("data-persistent-shell"),
    "yes",
    "header stays mounted after navigation",
  );
  assert.equal(
    await progress.getAttribute("data-persistent-stepper"),
    "yes",
    "stepper stays mounted after navigation",
  );
  assert.equal(await progress.count(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
    false,
  );
  await page.screenshot({ path: "artifacts/booking-loading/mobile.png" });
  assert.deepEqual(errors, []);
  console.log(
    "Header, stepper and content container persist during delayed navigation; mobile layout and step state passed.",
  );
} finally {
  await browser.close();
}
