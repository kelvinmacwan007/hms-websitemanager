import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL || "http://demo-hotel.localhost:3001";
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|hydrated|didn't match|server rendered HTML/i.test(message.text())
    )
      errors.push(message.text());
  });
  await page.addInitScript(() => {
    window.bookingHeadingAnimations = [];
    new MutationObserver((records) => {
      for (const record of records) {
        const node = record.target;
        if (!(node instanceof HTMLElement) || !node.closest("[data-booking-step-content]"))
          continue;
        if (node.tagName !== "H1" && !node.classList.contains("eyebrow")) continue;
        if (
          /(?:^|;)\s*(?:transform|opacity|visibility)\s*:/.test(node.getAttribute("style") || "") ||
          /(?:^|;)\s*(?:transform|opacity|visibility)\s*:/.test(record.oldValue || "")
        )
          window.bookingHeadingAnimations.push(node.tagName);
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeFilter: ["style"],
      attributeOldValue: true,
    });
  });
  await page.route("**/_next/static/chunks/**", async (route) => {
    if (route.request().url().includes("/app/booking/"))
      await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    checkIn: date(2),
    checkOut: date(4),
    guests: "2",
    rooms: "1",
  });
  await page.goto(`${base}/booking?${query}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("region", { name: "Booking progress", exact: true }).waitFor();
  assert.equal(
    await page
      .locator("[data-booking-step-content] h1")
      .evaluate((node) => getComputedStyle(node).visibility),
    "visible",
  );
  assert.deepEqual(
    await page.evaluate(() => window.bookingHeadingAnimations),
    [],
    "layout must not add animation styles to streamed booking headings",
  );
  query.append("item", JSON.stringify(["deluxe-city-room", "bar", 1]));
  await page.goto(`${base}/booking/cart?${query}`, { waitUntil: "networkidle", timeout: 120000 });
  await page.getByRole("link", { name: "Continue to extras", exact: true }).click();
  await page.waitForURL("**/booking/extras?**");
  await page.locator('[aria-current="step"]').filter({ hasText: "Extras" }).waitFor();
  assert.equal(
    await page.getByRole("region", { name: "Booking progress", exact: true }).count(),
    1,
  );
  assert.deepEqual(await page.evaluate(() => window.bookingHeadingAnimations), []);
  assert.deepEqual(errors, []);
  console.log(
    "Motion-enabled booking hydration and streamed step navigation passed without heading mutations or hydration errors.",
  );
} finally {
  await browser.close();
}
