import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  for (const reducedMotion of ["reduce", "no-preference"]) {
    const page = await browser.newPage({ reducedMotion });
    await page.goto(`${process.env.QA_URL || "http://localhost:3000"}/contact`, {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    });
    await page.waitForFunction(() => document.querySelector("header")?.dataset.compact === "false");
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1600, 390]) {
      await page.setViewportSize({ width, height: 700 });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(700);
      const contentTop = await page
        .locator("#main-content")
        .first()
        .evaluate((node) => node.getBoundingClientRect().top + scrollY);
      const menuPositions = await page.locator("header nav a:visible").evaluateAll((links) =>
        links.map((link) => ({
          left: link.getBoundingClientRect().left,
          width: link.getBoundingClientRect().width,
        })),
      );
      for (const top of [220, 140, 80, 230, 0]) {
        await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), top);
        if (reducedMotion === "no-preference" && top > 180) {
          await page.waitForTimeout(50);
          const enteringTop = await page
            .locator("header")
            .evaluate((node) => node.getBoundingClientRect().top);
          assert.ok(enteringTop < 0, "Sticky header enters from above the viewport");
        }
        await page.waitForTimeout(700);
        const state = await page.evaluate(() => ({
          top: document.querySelector("#main-content").getBoundingClientRect().top + scrollY,
          scroll: scrollY,
          compact: document.querySelector("header").dataset.compact,
          headerTop: document.querySelector("header").getBoundingClientRect().top,
        }));
        assert.ok(Math.abs(state.top - contentTop) < 1, `Content moved: ${JSON.stringify(state)}`);
        assert.ok(Math.abs(state.scroll - top) < 1, `Scroll drifted: ${JSON.stringify(state)}`);
        if (top > 100)
          assert.ok(
            Math.abs(state.headerTop) < 1,
            `Header stays at the viewport top: ${JSON.stringify(state)}`,
          );
        assert.equal(state.compact, String(top > 100));
        const stickyPositions = await page.locator("header nav a:visible").evaluateAll((links) =>
          links.map((link) => ({
            left: link.getBoundingClientRect().left,
            width: link.getBoundingClientRect().width,
          })),
        );
        assert.deepEqual(
          stickyPositions,
          menuPositions,
          "Sticky menu keeps the regular header alignment",
        );
      }
      if (width === 390) {
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("navigation", { name: "Mobile navigation", exact: true }).waitFor();
        await page.keyboard.press("Escape");
      }
      console.log(`PASS stable header scroll: ${width}px, ${reducedMotion}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
}
