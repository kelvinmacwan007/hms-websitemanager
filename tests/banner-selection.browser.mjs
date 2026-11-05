import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto(`${process.env.QA_URL || "http://demo-hotel.localhost:3001"}/website-manager`, {
    waitUntil: "networkidle",
    timeout: 120000,
  });
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Homepage", exact: true })
    .click();
  const preview = page.frameLocator('iframe[title="Actual hotel website preview"]');
  const cover = await preview.locator(".hero-slides img").first().getAttribute("src");
  const card = page
    .locator(".wm-card")
    .filter({ has: page.getByRole("heading", { name: "Banner Images", exact: true }) });
  const rows = card.locator(".wm-banner-slide-row");
  await card.getByRole("button", { name: "Add banner images", exact: true }).click();
  const panel = page.getByRole("dialog");
  const photos = panel.getByRole("button", { name: /^Select hotel photo:/ });
  for (let i = 0; i < 3; i++) await photos.nth(i).click();
  await panel.getByRole("button", { name: "Save images", exact: true }).click();
  assert.equal(await rows.count(), 3);
  await rows.nth(1).locator("summary").first().click();
  assert.equal(await photos.filter({ has: page.locator("span") }).count(), 3);
  assert.equal(
    await panel.locator('button[aria-label^="Select hotel photo:"][aria-pressed="true"]').count(),
    3,
  );
  await photos.nth(0).click();
  await panel.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await rows.count(), 3, "Cancel preserves the saved selection");
  await rows.nth(1).locator("summary").first().click();
  const selected = panel.locator('button[aria-label^="Select hotel photo:"][aria-pressed="true"]');
  while (await selected.count()) await selected.first().click();
  await panel.getByRole("button", { name: "Save images", exact: true }).click();
  assert.equal(await rows.count(), 0);
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector('iframe[title="Actual hotel website preview"]')
        ?.contentDocument?.querySelector(".hero-slides img")
        ?.getAttribute("src") === expected,
    cover,
  );
  await card.getByRole("button", { name: "Add banner images", exact: true }).click();
  assert.equal(await selected.count(), 0);
  for (let i = 0; i < 7; i++) await photos.nth(i).click();
  await photos.nth(7).click();
  assert.equal(await selected.count(), 7);
  await panel.getByRole("button", { name: "Save images", exact: true }).click();
  assert.equal(await rows.count(), 7);
  console.log(
    "Banner selection passed: all existing photos checked, cancel, deselect all, empty save, cover fallback and seven-image limit.",
  );
} finally {
  await browser.close();
}
