import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://demo-hotel.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const output = "artifacts/booking-results";
mkdirSync(output, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.setDefaultNavigationTimeout(90000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + "/booking", { waitUntil: "domcontentloaded" });
  await Promise.all([
    page.waitForURL((u) => u.searchParams.has("checkIn")),
    page.getByRole("button", { name: "Check availability", exact: true }).click(),
  ]);
  const cards = page.locator("article[data-motion-card]");
  await cards.first().waitFor();
  assert.equal(await cards.first().getAttribute("data-layout"), "responsive");
  assert.equal(await cards.locator('ul[aria-label="Room amenities"]').count(), 0);
  const details = new URL(
    await cards
      .first()
      .getByRole("link", { name: "View details", exact: true })
      .getAttribute("href"),
    base,
  );
  const search = new URL(page.url()).searchParams;
  for (const key of ["checkIn", "checkOut", "guests", "rooms"])
    assert.equal(details.searchParams.get(key), search.get(key));
  for (const width of [1920, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
      `Page fits at ${width}`,
    );
    const clipped = await cards.evaluateAll((es) =>
      es.some((card) => {
        const box = card.getBoundingClientRect();
        return [...card.querySelectorAll("a,button")].some((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
        });
      }),
    );
    assert.equal(clipped, false, `Card controls fit at ${width}`);
    if ([1920, 390].includes(width))
      await cards.first().screenshot({ path: `${output}/${width}-card.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await cards
    .first()
    .getByRole("button", { name: /^Add one/ })
    .first()
    .click();
  const review = page.getByRole("link", { name: "Review cart", exact: true });
  await review.waitFor();
  const selectedHref = await review.getAttribute("href");
  const rateSelect = cards.first().getByRole("combobox");
  if (await rateSelect.count()) {
    await rateSelect.selectOption({ index: 1 });
    assert.equal(
      await review.getAttribute("href"),
      selectedHref,
      "Switching displayed rates preserves cart selections",
    );
    await rateSelect.selectOption({ index: 0 });
  }
  assert.ok(new URL(await review.getAttribute("href"), base).searchParams.getAll("item").length);
  await cards
    .first()
    .getByRole("button", { name: /View gallery for/ })
    .click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close gallery", exact: true }).click();
  await review.click();
  await page.getByRole("heading", { name: "Your room cart", exact: true }).waitFor();
  const selectedRooms = page.getByRole("region", { name: "Selected rooms", exact: true });
  const cartCard = selectedRooms.locator("article[data-motion-card]").first();
  assert.equal(await cartCard.getAttribute("data-layout"), "responsive");
  assert.equal(await cartCard.locator('ul[aria-label="Room amenities"]').count(), 0);
  for (const width of [1920, 1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const cartBounds = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      scroll: document.documentElement.scrollWidth,
      escaped: [...document.querySelectorAll("main *")]
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1);
        })
        .slice(0, 12)
        .map((e) => ({
          tag: e.tagName,
          cls: e.className,
          text: e.textContent.slice(0, 45),
          width: e.getBoundingClientRect().width,
        })),
    }));
    assert.equal(
      cartBounds.overflow,
      false,
      `Cart fits at ${width}: ${JSON.stringify(cartBounds)}`,
    );
    const clipped = await cartCard.evaluate((card) => {
      const box = card.getBoundingClientRect();
      return [...card.querySelectorAll("a,button")].some((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.left < box.left - 1 || r.right > box.right + 1);
      });
    });
    assert.equal(clipped, false, `Cart card controls fit at ${width}`);
    if ([1920, 390].includes(width))
      await cartCard.screenshot({ path: `${output}/${width}-cart-card.png` });
  }
  await cartCard.getByRole("button", { name: /View gallery for/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close gallery", exact: true }).click();
  await cartCard.getByRole("button", { name: /^Remove / }).click();
  await selectedRooms.getByRole("heading", { name: "Your cart is empty.", exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Search cards share the room-list UI, omit amenities, fit six widths and preserve date links, quantity selection, gallery and cart handoff.",
  );
} finally {
  await browser.close();
}
