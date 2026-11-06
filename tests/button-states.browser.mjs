import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://demo-hotel.localhost:3001";
try {
  const page = await browser.newPage({ reducedMotion: "no-preference" });
  await page.goto(base, { waitUntil: "networkidle" });
  const primary = page.locator("main .brand-button").first();
  const secondary = page.locator("main .ghost-button").first();
  const state = (control) =>
    control.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        background: s.backgroundColor,
        color: s.color,
        scale: s.scale,
        animation: getComputedStyle(el, "::after").animationName,
      };
    });
  for (const control of [primary, secondary]) {
    await page.mouse.move(0, 0);
    await page.waitForTimeout(250);
    const normal = await state(control);
    await control.hover();
    await page.waitForTimeout(250);
    const hover = await state(control);
    assert.notEqual(hover.background, normal.background, "hover must give visual feedback");
    await page.keyboard.press("Tab");
    await control.focus();
    assert.ok(
      await control.evaluate((el) => {
        const s = getComputedStyle(el);
        return (
          el.matches(":focus-visible") && (s.boxShadow !== "none" || s.outlineStyle !== "none")
        );
      }),
      "keyboard focus must remain visible",
    );
  }
  await page.evaluate(() => (document.documentElement.dataset.siteMotion = "off"));
  await primary.hover();
  assert.equal((await state(primary)).animation, "none", "motion off must stop shimmer");
  assert.ok(["none", "1"].includes((await state(primary)).scale));
  await page.evaluate(() => delete document.documentElement.dataset.siteMotion);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await primary.hover();
  assert.equal((await state(primary)).animation, "none");
  await page.goto(`${base}/booking?checkIn=2026-11-06&checkOut=2026-11-07&guests=2&rooms=1`, {
    waitUntil: "networkidle",
  });
  const disabled = page.getByRole("button", { name: "Review cart", exact: true });
  assert.equal(await disabled.isDisabled(), true);
  const before = await state(disabled);
  await disabled.hover();
  assert.deepEqual(await state(disabled), before, "disabled cart must not react to hover");
  console.log(
    "Button states passed: primary/secondary hover, keyboard focus, disabled hover, motion off and reduced motion.",
  );
} finally {
  await browser.close();
}
