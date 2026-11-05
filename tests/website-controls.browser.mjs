import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://demo-hotel.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/rooms", "/contact", "/booking"]) {
      await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.locator(".hotel-site").waitFor();
      const state = await page.evaluate(() => {
        const visible = (e) =>
          e.getClientRects().length && getComputedStyle(e).visibility !== "hidden";
        const buttons = [...document.querySelectorAll(".brand-button,.ghost-button,.footer-book")]
          .filter(visible)
          .map((e) => ({
            text: e.textContent.trim().slice(0, 30),
            height: e.getBoundingClientRect().height,
            min: getComputedStyle(e).minHeight,
            font: getComputedStyle(e).fontSize,
          }));
        const fields = [
          ...document.querySelectorAll(
            'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="range"]),select:not([data-compact-control])',
          ),
        ]
          .filter(visible)
          .map((e) => ({
            name: e.name || e.getAttribute("aria-label"),
            height: e.getBoundingClientRect().height,
            font: getComputedStyle(e).fontSize,
          }));
        return { buttons, fields, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      for (const button of state.buttons) {
        assert.equal(button.min, "52px", `${route}: ${button.text}`);
        assert.equal(button.font, "16px");
        assert.ok(button.height >= 52);
      }
      for (const field of state.fields) {
        assert.ok(field.height >= 52, `${route}: ${field.name} height`);
        assert.equal(field.font, "16px");
      }
      assert.equal(state.overflow, false, `${route} fits at ${width}`);
      if (route === "/rooms") {
        const form = page
          .locator("form")
          .filter({ has: page.locator('input[name="checkIn"]') })
          .first();
        const heights = await form
          .locator('button[aria-haspopup="dialog"]')
          .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().height));
        for (const height of heights)
          assert.ok(Math.abs(height - 52) < 1, `Booking controls match: ${heights}`);
      }
    }
    console.log(`Control geometry passed at ${width}px`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/rooms", { waitUntil: "domcontentloaded" });
  const footerAction = page.locator(".footer-book");
  await footerAction.hover();
  await page.waitForFunction(
    () => parseFloat(getComputedStyle(document.querySelector(".footer-book")).scale) > 1.019,
  );
  const action = page.getByRole("button", { name: "List view", exact: true });
  await action.hover();
  await page.waitForFunction(
    () =>
      parseFloat(getComputedStyle(document.querySelector('button[aria-label="List view"]')).scale) >
      1.019,
  );
  await page.mouse.down();
  await page.waitForFunction(
    () =>
      parseFloat(getComputedStyle(document.querySelector('button[aria-label="List view"]')).scale) <
      0.981,
  );
  await page.mouse.move(10, 10);
  await page.mouse.up();
  await page.getByRole("button", { name: /^Guests:/ }).click();
  const disabled = page.getByRole("button", { name: "Decrease children", exact: true });
  assert.equal(await disabled.isDisabled(), true);
  await disabled.hover();
  assert.ok(["none", "1"].includes(await disabled.evaluate((e) => getComputedStyle(e).scale)));
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await action.hover();
  const reduced = await action.evaluate((e) => ({
    scale: getComputedStyle(e).scale,
    duration: getComputedStyle(e).transitionDuration,
  }));
  assert.ok(["none", "1"].includes(reduced.scale));
  assert.equal(reduced.duration, "0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => (document.documentElement.dataset.siteMotion = "off"));
  await action.hover();
  assert.ok(["none", "1"].includes(await action.evaluate((e) => getComputedStyle(e).scale)));
  assert.deepEqual(errors, []);
  console.log(
    "Shared control sizing, hover/press animation, disabled states, reduced motion and motion-off behavior passed.",
  );
} finally {
  await browser.close();
}
