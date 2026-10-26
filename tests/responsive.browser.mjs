import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://localhost:3000";
const routes = [
  "/",
  "/rooms",
  "/about",
  "/experiences",
  "/dining",
  "/offers",
  "/gallery",
  "/reviews",
  "/contact",
  "/faq",
  "/policies",
  "/booking",
  "/website-manager",
];

try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/rooms", { waitUntil: "domcontentloaded" });
  await page.locator("main h1").waitFor();
  routes.push(
    ...(await page
      .locator('a[href^="/rooms/"]')
      .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute("href")))])),
  );
  for (const width of [320, 390, 640, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: "domcontentloaded" });
      await page.locator("main").first().waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const state = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll("article a.brand-button, article a.ghost-button")]
          .filter((element) => {
            const action = element.getBoundingClientRect();
            const card = element.closest("article").getBoundingClientRect();
            return action.width && (action.right > card.right + 1 || action.left < card.left - 1);
          })
          .map((element) => element.textContent),
        footerMargin: document.querySelector(".hotel-footer")
          ? getComputedStyle(document.querySelector(".hotel-footer")).marginTop
          : null,
      }));
      assert.equal(response.status(), 200, route);
      assert.equal(state.overflow, false, `${route}: overflow at ${width}px`);
      assert.deepEqual(state.clipped, [], `${route}: clipped card actions at ${width}px`);
      if (state.footerMargin !== null) assert.equal(state.footerMargin, "0px");
    }
    console.log(
      `PASS ${width}px: ${routes.length} routes without overflow or clipped card actions`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
