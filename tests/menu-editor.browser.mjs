import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  await page.goto(`${process.env.QA_URL || "http://demo-hotel.localhost:3000"}/website-manager`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Menu", exact: true })
    .click();
  await page.getByRole("button", { name: "Add Item", exact: true }).click();
  const panel = page.getByRole("dialog");
  await panel.getByLabel("Menu", { exact: true }).fill("Tasting Menu");
  await panel.getByLabel("Category", { exact: true }).fill("Seasonal");
  await panel.getByLabel("Item name *", { exact: true }).fill("Garden tasting");
  await panel.getByRole("radio", { name: "Non Veg", exact: true }).check();
  await panel.getByLabel(/Price/).fill("25");
  await panel.getByLabel("Vintage (optional)").fill("2024");
  await panel.getByRole("button", { name: "Save & add another", exact: true }).click();
  assert.equal(await panel.getByLabel("Item name *", { exact: true }).inputValue(), "");
  assert.equal(await panel.getByLabel("Menu", { exact: true }).inputValue(), "Tasting Menu");
  assert.equal(await panel.getByLabel("Category", { exact: true }).inputValue(), "Seasonal");
  await panel.getByLabel("Item name *", { exact: true }).fill("Draft tasting");
  await panel.getByLabel(/Price/).fill("30");
  await panel.getByRole("switch", { name: "Item is active", exact: true }).uncheck();
  await panel.getByRole("button", { name: "Save item", exact: true }).click();
  assert.equal(await panel.count(), 0);
  await page.getByRole("button", { name: "Edit Garden tasting", exact: true }).click();
  assert.equal(await panel.getByLabel("Vintage (optional)").inputValue(), "2024");
  assert.ok(await panel.getByRole("radio", { name: "Non Veg", exact: true }).isChecked());
  assert.equal(await panel.locator("datalist option[value='Tasting Menu']").count(), 1);
  assert.equal(await panel.locator("datalist option[value='Seasonal']").count(), 1);
  mkdirSync("artifacts/menu", { recursive: true });
  await page.screenshot({ path: "artifacts/menu/unified-item-form-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () => document.querySelector("dialog[open]").getBoundingClientRect().width <= 390,
  );
  assert.ok(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth));
  await page.screenshot({ path: "artifacts/menu/unified-item-form-mobile.png" });
  await page.keyboard.press("Escape");
  console.log(
    "Menu item form passed: inline menu/category creation, reuse, save/add another, editing, status, mobile.",
  );
} finally {
  await browser.close();
}
