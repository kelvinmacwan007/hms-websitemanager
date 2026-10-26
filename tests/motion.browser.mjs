import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "no-preference",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|didn.t match/i.test(message.text()))
      errors.push(message.text());
  });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await page.waitForTimeout(1700);
  assert.equal(
    await page.locator("[data-motion-hero] h1").evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  await page.mouse.move(1100, 650);
  await page.mouse.wheel(0, 650);
  await page.waitForTimeout(50);
  const mid = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1200);
  const end = await page.evaluate(() => scrollY);
  assert.ok(end > mid && end > 400, `Smooth wheel interpolation: ${mid} -> ${end}`);
  const link = page.locator(".scroll-reveal a").first();
  await link.focus();
  assert.equal(
    await link.evaluate((node) => getComputedStyle(node.closest(".scroll-reveal")).opacity),
    "1",
  );
  const gallery = page.getByRole("button", { name: /Open .* in lightbox/ }).first();
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await gallery.click();
  await page.getByRole("dialog").waitFor();
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis-stopped"));
  const lockedY = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => scrollY), lockedY, "Modal locks page scrolling");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.documentElement.classList.contains("lenis-stopped"));
  await page.mouse.move(1100, 650);
  await page.mouse.wheel(0, -550);
  await page.waitForTimeout(1000);
  assert.ok(
    (await page.evaluate(() => scrollY)) < lockedY - 100,
    "Scrolling resumes after modal closes",
  );
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("navigation", { name: "Main navigation", exact: true })
      .getByRole("link", { name: "Rooms", exact: true })
      .click();
    await page.waitForURL("**/rooms");
    await page.getByRole("link", { name: /home$/ }).first().click();
    await page.waitForURL(base + "/");
    await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(
    () =>
      !document.documentElement.classList.contains("lenis") &&
      !document.documentElement.classList.contains("motion-enabled"),
  );
  assert.equal(
    await page
      .locator(".scroll-reveal")
      .first()
      .evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  await page.goto(base + "/booking", { waitUntil: "networkidle" });
  assert.ok(await page.getByRole("button", { name: /^Check-in:/ }).isVisible());
  const touch = await browser.newPage({
    viewport: { width: 375, height: 850 },
    isMobile: true,
    hasTouch: true,
  });
  await touch.goto(base, { waitUntil: "networkidle" });
  assert.equal(
    await touch.evaluate(() => document.documentElement.classList.contains("lenis")),
    false,
  );
  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base);
  assert.equal(
    await noJs
      .locator(".scroll-reveal")
      .first()
      .evaluate((node) => getComputedStyle(node).opacity),
    "1",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: hero/reveals, smooth wheel interpolation, keyboard focus, dialog lock/resume, repeated client navigation, live reduced-motion changes, booking, native touch, and no-JS content.",
  );
} finally {
  await browser.close();
}
