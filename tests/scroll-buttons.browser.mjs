import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://localhost:3000";
const errors = [];

async function scale(locator) {
  return locator.evaluate(
    (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
  );
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await page.waitForTimeout(1000);
  const actions = [
    page.getByRole("link", { name: "Book your stay", exact: true }),
    page.getByRole("link", { name: "All rooms", exact: true }),
    page.getByRole("button", { name: "Next banner image", exact: true }),
  ];
  for (const action of actions) {
    await action.scrollIntoViewIfNeeded();
    await action.hover();
    await page.waitForTimeout(260);
    assert.ok(Math.abs((await scale(action)) - 1.02) < 0.002, "Shared hover scale");
    await page.mouse.down();
    await page.waitForTimeout(260);
    assert.ok(Math.abs((await scale(action)) - 0.98) < 0.002, "Shared press scale");
    // Release away from the action so navigation or carousel changes do not interfere.
    await page.mouse.move(1400, 850);
    await page.mouse.up();
    await page.keyboard.press("Tab");
    await action.focus();
    assert.equal(await action.evaluate((element) => element.matches(":focus-visible")), true);
    assert.notEqual(
      await action.evaluate((element) => getComputedStyle(element).boxShadow),
      "none",
    );
  }

  await page.evaluate(() => {
    document.activeElement?.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(150);
  const skip = page.getByRole("link", { name: "Skip to content", exact: true });
  await skip.focus();
  await skip.click();
  await page.waitForTimeout(30);
  const early = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1000);
  const settled = await page.evaluate(() => scrollY);
  assert.ok(settled > early && settled > 100, `Anchor easing: ${early} -> ${settled}`);

  for (const route of [
    "/rooms",
    "/about",
    "/contact",
    "/gallery",
    "/offers",
    "/dining",
    "/experiences",
    "/reviews",
    "/faq",
    "/policies",
    "/booking",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  }
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  const disabled = page.getByRole("button", { name: "Review cart", exact: true });
  await disabled.waitFor();
  assert.equal(await disabled.isDisabled(), true);
  await disabled.hover();
  await page.waitForTimeout(260);
  assert.equal(await scale(disabled), 1);
  assert.equal(await disabled.evaluate((element) => getComputedStyle(element).opacity), "0.5");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => !document.documentElement.classList.contains("lenis"));
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  assert.deepEqual(errors, []);
  console.log(
    "PASS: Lenis on every public page, eased anchors, live motion preferences, shared primary/secondary/icon hover and press effects, keyboard rings, and disabled actions.",
  );
} finally {
  await browser.close();
}
