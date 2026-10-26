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
  const href = await page.locator('a[href^="/rooms/"]').first().getAttribute("href");
  assert.ok(href);
  await page.goto(new URL(href, base).href, { waitUntil: "networkidle", timeout: 120000 });
  const panel = page.getByRole("complementary", { name: "Room reservation" });
  await panel.getByRole("link", { name: "Reserve this room", exact: true }).waitFor();
  const fieldset = panel
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: "Add-ons" }) });
  const checkbox = fieldset.getByRole("checkbox").first();
  const summary = panel.getByRole("region", { name: "Price summary" });
  const totalAmount = async () => {
    const text = await summary.locator('[aria-live="polite"] > span').textContent();
    return Number(text.replace(/[^\d.]/g, ""));
  };
  const initialTotal = await totalAmount();
  const firstPrice = await fieldset
    .locator("label")
    .first()
    .locator("..")
    .locator("strong")
    .last()
    .textContent();
  const unitAmount = Number(firstPrice.replace(/[^\d.]/g, ""));
  await checkbox.check();
  assert.equal(await totalAmount(), initialTotal + unitAmount);
  const quantity = fieldset.locator('input[type="number"]').first();
  await quantity.fill("3");
  assert.equal(await totalAmount(), initialTotal + unitAmount * 3);
  await checkbox.uncheck();
  assert.equal(await totalAmount(), initialTotal);
  await checkbox.check();
  await fieldset.locator('input[type="number"]').first().fill("3");
  const bookHref = await panel
    .getByRole("link", { name: "Reserve this room", exact: true })
    .getAttribute("href");
  assert.equal(JSON.parse(new URL(bookHref, base).searchParams.get("addon"))[1], 3);
  await panel.getByRole("region", { name: "Price summary" }).waitFor();
  mkdirSync("artifacts/reservation-panel", { recursive: true });
  await panel.screenshot({ path: "artifacts/reservation-panel/desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await panel.screenshot({ path: "artifacts/reservation-panel/mobile.png" });
  await panel.getByRole("link", { name: "Reserve this room", exact: true }).click();
  await page.waitForURL((url) => url.pathname === "/booking/cart");
  await page.getByRole("heading", { name: "Your room cart", exact: true }).waitFor();
  const cartParams = new URL(page.url()).searchParams;
  assert.ok(cartParams.get("item"));
  assert.equal(JSON.parse(cartParams.get("addon"))[1], 3);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("complementary", { name: "Cart total" }).waitFor();
  mkdirSync("artifacts/cart-design", { recursive: true });
  await page.screenshot({ path: "artifacts/cart-design/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "artifacts/cart-design/mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("link", { name: "Cart, 1 rooms selected", exact: true }).waitFor();
  const requested = page.getByRole("region", { name: "Requested add-ons", exact: true });
  await requested.getByRole("button").first().click();
  await requested.waitFor({ state: "detached" });
  await page
    .getByRole("region", { name: "Selected rooms", exact: true })
    .getByRole("button", { name: /^Remove / })
    .click();
  await page.getByRole("heading", { name: "Your cart is empty.", exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: /Continue to/ }).isDisabled(), true);
  const emptyCartLink = page.getByRole("link", { name: "Cart, no rooms selected", exact: true });
  await emptyCartLink.waitFor();
  assert.equal(
    await page.getByRole("link", { name: "Cart, 1 rooms selected", exact: true }).count(),
    0,
  );
  assert.equal(
    new URL(await emptyCartLink.getAttribute("href"), base).searchParams.has("item"),
    false,
  );
  console.log(
    "Reservation panel: selectable HMS add-ons, quantities, Reserve this room handoff and responsive layout verified.",
  );
} finally {
  await browser.close();
}
