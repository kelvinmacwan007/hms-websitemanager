import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://knot.localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
mkdirSync("artifacts/site-layout", { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-loading]").waitFor({ state: "hidden" });
  const homeCards = page.locator('[data-home-section="rooms"] article[data-motion-card]');
  await homeCards.first().waitFor();
  for (const width of [1920, 1440, 1280, 1024, 768, 540, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await homeCards.first().getAttribute("data-layout"), "vertical");
    assert.equal(
      await homeCards.first().evaluate((card) => getComputedStyle(card).display),
      "flex",
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `homepage overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => document.fonts.ready);
  await homeCards
    .locator("img")
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => {}))));
  await page.locator('[data-home-section="rooms"]').screenshot({
    path: "artifacts/site-layout/home-rooms-final.png",
    style: "header,nextjs-portal{visibility:hidden!important}",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "artifacts/site-layout/home-final.png" });
  await page.goto(base + "/rooms", { waitUntil: "domcontentloaded" });
  const results = page.getByRole("region", { name: "Room results" });
  await results.locator("article").first().waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Grid view", exact: true }).getAttribute("aria-pressed"),
    "true",
  );
  for (const width of [1920, 1440, 1280, 1024, 900, 768, 540, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const positions = await results.locator("article").evaluateAll((cards) =>
      cards.slice(0, 2).map((card) => ({
        x: card.getBoundingClientRect().x,
        y: card.getBoundingClientRect().y,
        layout: card.dataset.layout,
        display: getComputedStyle(card).display,
      })),
    );
    assert.equal(positions[0].layout, "vertical");
    assert.equal(positions[0].display, "flex");
    if (positions.length > 1) {
      if (width >= 720) {
        assert.ok(Math.abs(positions[0].y - positions[1].y) < 2, `two columns at ${width}`);
        assert.notEqual(positions[0].x, positions[1].x);
      } else assert.ok(positions[1].y > positions[0].y, `single column at ${width}`);
    }
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `rooms overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  const filterButton = page.getByRole("button", { name: "Filters", exact: true });
  await filterButton.click();
  await page.getByRole("complementary", { name: "Room filters" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Apply filters", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Hide filters", exact: true }).click();
  assert.equal(await filterButton.getAttribute("aria-expanded"), "false");
  await results.screenshot({
    path: "artifacts/site-layout/rooms-mobile-final.png",
    style: "header,nextjs-portal{visibility:hidden!important}",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await results
    .locator("img")
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => {}))));
  await results.screenshot({
    path: "artifacts/site-layout/rooms-grid-final.png",
    style: "header,nextjs-portal{visibility:hidden!important}",
  });
  await page.getByRole("button", { name: "List view", exact: true }).click();
  assert.equal(await results.locator("article").first().getAttribute("data-layout"), "responsive");
  console.log(
    "PASS homepage vertical cards, two-column rooms grid, mobile columns and collapsible filters",
  );
  for (const route of [
    "/",
    "/rooms",
    "/gallery",
    "/contact",
    "/booking",
    "/faq",
    "/policies",
    "/offers",
    "/reviews",
    "/dining",
    "/experiences",
    "/about",
  ]) {
    const routePage = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: "reduce",
    });
    routePage.on("pageerror", (error) => errors.push(error.message));
    await routePage.goto(base + route, { waitUntil: "networkidle", timeout: 60000 });
    if (!(await routePage.locator(".hotel-site").count())) {
      console.log("SKIP disabled page " + route);
      await routePage.close();
      continue;
    }
    await routePage.locator(".hotel-site main").first().waitFor();
    for (const width of [2560, 1920, 1440, 1024, 768, 390, 320]) {
      await routePage.setViewportSize({ width, height: 1000 });
      await routePage.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const state = await routePage.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        body: getComputedStyle(document.querySelector(".hotel-site")).fontSize,
        containers: [...document.querySelectorAll(".hotel-site .container")]
          .filter(
            (element) =>
              !element.parentElement.closest(".container") &&
              element.getBoundingClientRect().width > 1,
          )
          .map((element) => element.getBoundingClientRect().width),
        heads: [...document.querySelectorAll(".hotel-site main h1[data-title]")]
          .filter((h) => h.getBoundingClientRect().width)
          .map((h) => parseFloat(getComputedStyle(h).fontSize)),
        undersized: [...document.querySelectorAll(".hotel-site *")]
          .filter(
            (element) =>
              element instanceof HTMLElement &&
              [...element.childNodes].some(
                (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
              ) &&
              element.getBoundingClientRect().width > 2 &&
              element.getBoundingClientRect().height > 2 &&
              getComputedStyle(element).visibility === "visible" &&
              parseFloat(getComputedStyle(element).fontSize) < 16,
          )
          .map((element) => element.textContent.trim().slice(0, 60)),
      }));
      assert.equal(state.overflow, false, `${route}: overflow at ${width}`);
      assert.equal(state.body, "18px");
      assert.ok(
        state.containers.every((size) => Math.abs(size - width * 0.9) < 2),
        `${route}: content should use 90% of the screen width at ${width}`,
      );
      assert.deepEqual(state.undersized, [], `${route}: text below 16px at ${width}`);
      assert.ok(
        state.heads.every((size) => size >= 30 && size <= 64),
        `${route}: heading scale`,
      );
    }
    console.log("PASS type scale and layout " + route);
    await routePage.close();
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
