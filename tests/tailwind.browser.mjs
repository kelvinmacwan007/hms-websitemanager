import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/rooms",
  "/contact",
  "/booking",
  "/gallery",
  "/offers",
  "/about",
  "/dining",
  "/experiences",
  "/reviews",
  "/faq",
  "/policies",
];
const errors = [];
mkdirSync("artifacts/tailwind", { recursive: true });

function recordEntryFrames() {
  window.entryFrames = [];
  new MutationObserver((records) => {
    for (const { target } of records) {
      if (
        target instanceof HTMLElement &&
        target.matches("h1, [data-header-entry]") &&
        target.style.opacity &&
        window.entryFrames.length < 100
      )
        window.entryFrames.push({
          opacity: Number(target.style.opacity),
          transform: target.style.transform,
        });
    }
  }).observe(document, { subtree: true, attributes: true, attributeFilter: ["style"] });
}

try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200, route);
      const state = await page.evaluate(() => ({
        body: getComputedStyle(document.body).fontSize,
        overflow: document.documentElement.scrollWidth > innerWidth,
        broken: Array.from(document.images)
          .filter((image) => image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
        small: Array.from(document.querySelectorAll("body *"))
          .filter(
            (element) =>
              !element.closest("nextjs-portal") &&
              Array.from(element.childNodes).some(
                (node) => node.nodeType === 3 && node.textContent.trim(),
              ) &&
              element.getClientRects().length &&
              getComputedStyle(element).visibility !== "hidden" &&
              parseFloat(getComputedStyle(element).fontSize) < 16,
          )
          .map((element) => ({
            text: element.textContent.slice(0, 50),
            size: getComputedStyle(element).fontSize,
          })),
      }));
      assert.equal(state.body, "18px");
      assert.equal(state.overflow, false, `${route} overflow at ${width}px`);
      assert.deepEqual(state.broken, [], `${route} broken images`);
      assert.deepEqual(state.small, [], `${route} small text at ${width}px`);
      const actions = await page
        .locator(".brand-button, .ghost-button, .header-reserve, .footer-book, .stay-cta-button")
        .evaluateAll((elements) =>
          elements
            .filter((element) => element.getClientRects().length)
            .map((element) => {
              const styles = getComputedStyle(element);
              return {
                radius: styles.borderRadius,
                font: styles.fontSize,
                minHeight: styles.minHeight,
              };
            }),
        );
      for (const action of actions) {
        assert.deepEqual(
          action,
          { radius: "9999px", font: "16px", minHeight: "48px" },
          `${route} button geometry`,
        );
      }
      assert.equal(
        await page
          .locator(".site-header")
          .evaluate((element) => getComputedStyle(element).backdropFilter),
        "blur(24px)",
      );
      if (route === "/" || route === "/contact") {
        await page.screenshot({
          path: `artifacts/tailwind/final-${width}-${route === "/" ? "home" : "contact"}.png`,
          fullPage: true,
        });
      }
    }
  }

  await page.goto(base + "/rooms", { waitUntil: "networkidle" });
  const roomLinks = await page
    .locator('a[href^="/rooms/"]')
    .evaluateAll((links) => Array.from(new Set(links.map((link) => link.getAttribute("href")))));
  for (const route of roomLinks) {
    assert.equal((await page.goto(base + route, { waitUntil: "networkidle" })).status(), 200);
    assert.ok(await page.locator("h1").isVisible());
  }

  await page.setViewportSize({ width: 375, height: 850 });
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("link", { name: "Contact", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Speak with the hotel directly.", exact: true })
    .waitFor();
  assert.equal(
    await page.getByRole("navigation", { name: "Mobile navigation", exact: true }).count(),
    0,
  );

  const animated = await browser.newPage({ reducedMotion: "no-preference" });
  await animated.bringToFront();
  animated.on("pageerror", (error) => errors.push(error.message));
  await animated.addInitScript(recordEntryFrames);
  await animated.goto(base + "/rooms", { waitUntil: "networkidle" });
  await animated.waitForFunction(() =>
    window.entryFrames.some((frame) => frame.opacity > 0 && frame.opacity < 1 && frame.transform),
  );
  await animated.waitForFunction(() => document.querySelector("h1")?.style.opacity === "");
  assert.ok(
    await animated.evaluate(() =>
      window.entryFrames.some((frame) => frame.opacity > 0 && frame.opacity < 1 && frame.transform),
    ),
    "GSAP entry frames should interpolate",
  );
  await animated.emulateMedia({ reducedMotion: "reduce" });
  await animated.goto(base + "/contact", { waitUntil: "networkidle" });
  assert.deepEqual(
    await animated.evaluate(() => window.entryFrames),
    [],
    "Reduced motion must skip header and title entries",
  );

  const noJs = await browser.newPage({ javaScriptEnabled: false });
  await noJs.goto(base + "/contact", { waitUntil: "networkidle" });
  assert.ok(await noJs.locator("h1").isVisible());
  assert.equal(
    await noJs.locator("h1").evaluate((element) => getComputedStyle(element).opacity),
    "1",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 36 responsive page checks, room details, mobile navigation, 16px minimum/18px body, glass surfaces, GSAP entry interpolation, reduced motion, and no-JS content.",
  );
} finally {
  await browser.close();
}
