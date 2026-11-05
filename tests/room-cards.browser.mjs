import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://knot.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
mkdirSync("artifacts/room-card-reference", { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/rooms", { waitUntil: "domcontentloaded" });
  const cards = page.locator("article[data-motion-card]");
  await cards.first().waitFor();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  assert.equal(await cards.locator('ul[aria-label="Room amenities"]').count(), 0);
  assert.equal(await cards.getByRole("link", { name: "View all amenities" }).count(), 0);
  const card = cards.filter({ hasText: "Deluxe Queen Room" }).first();
  const target = (await card.count()) ? card : cards.first();
  await page.evaluate(() => document.fonts.ready);
  await target
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(
        images
          .filter((image) => image.getClientRects().length)
          .map((image) => image.decode().catch(() => {})),
      ),
    );
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await target.screenshot({
    path: "artifacts/room-card-reference/desktop-final.png",
    animations: "disabled",
    style: "header, nextjs-portal { visibility: hidden !important; }",
  });
  for (const width of [1920, 1600, 1440, 1280, 1024, 900, 768, 650, 540, 430, 390, 360, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(80);
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth,
      clipped: [...document.querySelectorAll("article[data-motion-card]")].some((card) => {
        const c = card.getBoundingClientRect();
        return [...card.querySelectorAll("a,button")].some((item) => {
          const r = item.getBoundingClientRect();
          return r.width && (r.right > c.right + 1 || r.left < c.left - 1);
        });
      }),
    }));
    assert.equal(state.overflow, false, `${width}px page overflow`);
    assert.equal(state.clipped, false, `${width}px clipped controls`);
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await target.screenshot({
    path: "artifacts/room-card-reference/mobile-final.png",
    style: "header, nextjs-portal { visibility: hidden !important; }",
  });
  assert.equal(await page.getByRole("button", { name: /^(?:Save|Unsave) / }).count(), 0);
  await page.setViewportSize({ width: 1920, height: 1000 });
  assert.equal(await page.getByRole("button", { name: /^(?:Save|Unsave) / }).count(), 0);
  await target.getByRole("button", { name: /View gallery for/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByRole("button", { name: "Close gallery" }).click();
  const details = await target.locator("h3 a").getAttribute("href");
  await page.getByRole("button", { name: "Grid view", exact: true }).click();
  assert.equal(await cards.locator('ul[aria-label="Room amenities"]').count(), 0);
  for (const width of [1920, 1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Grid view overflow at ${width}px`,
    );
  }
  await page.goto(base + details, { waitUntil: "domcontentloaded" });
  await page.locator("#room-amenities").waitFor();
  assert.ok(await page.locator("article[data-motion-card]").count());
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-loading]").waitFor({ state: "hidden" });
  await page.locator("article[data-motion-card]").first().waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "PASS shared cards, 13 viewport widths, grid/list without amenities, gallery dialog and room detail links",
  );
} finally {
  await browser.close();
}
