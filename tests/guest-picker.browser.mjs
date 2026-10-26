import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://knot.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
mkdirSync("artifacts/guest-picker", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(90000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/rooms", { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /Guests & rooms/ }).first();
  for (const width of [2560, 1920, 1440, 1024, 768, 540, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Guests and rooms" });
    await dialog.waitFor();
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1, `popup fits at ${width}`);
    assert.ok(Math.abs(bounds.x + bounds.width / 2 - width / 2) < 2, `popup centered at ${width}`);
    assert.equal(await dialog.evaluate((element) => element.matches(":modal")), true);
    assert.equal(await dialog.getByText("Business travellers", { exact: true }).count(), 0);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.equal(
      await dialog.getByRole("button", { name: "Decrease children", exact: true }).isDisabled(),
      true,
    );
    assert.equal(
      await dialog.getByRole("button", { name: "Decrease pets", exact: true }).isDisabled(),
      true,
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(await trigger.evaluate((button) => document.activeElement === button), true);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await trigger.click();
  for (const name of ["rooms", "adults", "children", "pets"])
    await page.getByRole("button", { name: `Increase ${name}`, exact: true }).click();
  assert.equal(await page.locator('output[aria-label="Adults"]').textContent(), "3");
  assert.equal(await page.locator('input[name="guests"]').inputValue(), "4");
  await page
    .getByRole("dialog", { name: "Guests and rooms" })
    .screenshot({ path: "artifacts/guest-picker/desktop.png" });
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await Promise.all([
    page.waitForURL((url) => url.searchParams.get("children") === "1", { timeout: 60000 }),
    page.getByRole("button", { name: "Check availability", exact: true }).click(),
  ]);
  await page.getByRole("region", { name: "Room results" }).locator("article").first().waitFor();
  let query = new URL(page.url()).searchParams;
  for (const [key, expected] of Object.entries({
    guests: "4",
    adults: "3",
    children: "1",
    rooms: "2",
    pets: "1",
  }))
    assert.equal(query.get(key), expected, `${key} survives search`);
  const card = page.getByRole("region", { name: "Room results" }).locator("article").first();
  const details = await card.locator("h3 a").getAttribute("href");
  assert.equal(new URL(details, base).searchParams.get("children"), "1");
  await page.goto(new URL(details, base).href, { waitUntil: "domcontentloaded" });
  await page.getByRole("complementary", { name: "Room reservation" }).waitFor();
  await page.getByRole("button", { name: /Guests & rooms/ }).click();
  assert.equal(await page.locator('output[aria-label="Children"]').textContent(), "1");
  assert.equal(await page.locator('output[aria-label="Pets"]').textContent(), "1");
  await page.getByRole("button", { name: "Decrease rooms", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const reserve = await page.getByRole("link", { name: "Reserve this room" }).getAttribute("href");
  query = new URL(reserve, base).searchParams;
  assert.equal(query.get("businessTravellers"), null);
  assert.equal(query.get("pets"), "1");
  await page.goto(new URL(reserve, base).href, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Your room cart", exact: true }).waitFor();
  const checkout = page.getByRole("link", { name: /^Continue to (?:demo )?checkout$/ });
  const checkoutHref = await checkout.getAttribute("href");
  for (const [key, expected] of Object.entries({
    adults: "3",
    children: "1",
    pets: "1",
  }))
    assert.equal(
      new URL(checkoutHref, base).searchParams.get(key),
      expected,
      `${key} survives cart`,
    );
  await checkout.click();
  await page
    .locator("main")
    .getByText(/3 adults, 1 child, 1 pet requested/)
    .first()
    .waitFor();
  assert.ok(await page.getByText(/3 adults, 1 child, 1 pet requested/).count());
  assert.deepEqual(errors, []);
  console.log(
    "PASS guest counters, bounds, keyboard dismissal, 8 widths and party persistence through room details, cart and checkout",
  );
} finally {
  await browser.close();
}
