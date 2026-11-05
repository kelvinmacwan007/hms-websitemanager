import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${process.env.QA_URL || "http://demo-hotel.localhost:3000"}/menu`, {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator("h1").count(), 1);
  const tabs = page.getByRole("tab");
  assert.ok((await tabs.count()) >= 4, "Run with a demo hotel containing menus");
  await page.getByRole("tab", { name: "Lunch", exact: true }).click();
  await page.getByRole("heading", { name: "Lunch Favorites", exact: true }).waitFor();
  await page.getByRole("tab", { name: "Dinner", exact: true }).click();
  await page.getByRole("heading", { name: "The Meats", exact: true }).waitFor();
  mkdirSync("artifacts/menu", { recursive: true });
  await page.screenshot({ path: "artifacts/menu/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.screenshot({ path: "artifacts/menu/mobile.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log("Menu tabs and desktop/mobile layouts passed.");
} finally {
  await browser.close();
}
