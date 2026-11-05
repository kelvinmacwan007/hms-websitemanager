import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const response = await page.goto(
    `${process.env.QA_URL || "http://demo-hotel.localhost:3000"}/website-manager`,
    {
      waitUntil: "domcontentloaded",
      timeout: 120000,
    },
  );
  assert.ok(response?.ok(), "The QA hotel must have mock mode or a configured HMS connection.");
  await page.getByRole("heading", { name: "Website overview", exact: true }).waitFor();
  const navigation = page.getByRole("navigation", { name: "Website editor sections" });
  assert.equal(
    await navigation.getByRole("button", { name: "Hotel story", exact: true }).count(),
    0,
  );
  assert.equal(await page.getByRole("region", { name: "Website setup", exact: true }).count(), 1);
  assert.equal(await page.locator(".wm-preview-column").count(), 0);
  await navigation.getByRole("button", { name: "SEO", exact: true }).click();
  await page.getByLabel("Short description", { exact: true }).waitFor();
  assert.equal(await page.getByRole("region", { name: "Website setup", exact: true }).count(), 0);
  await navigation.getByRole("button", { name: "Homepage", exact: true }).click();
  assert.equal(await page.getByRole("region", { name: "Website setup", exact: true }).count(), 0);
  await navigation.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("heading", { name: "Website overview", exact: true }).waitFor();
  mkdirSync("artifacts/dashboard", { recursive: true });
  await page.screenshot({ path: "artifacts/dashboard/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/dashboard/mobile.png", fullPage: true });
  console.log("Dashboard navigation, SEO fields, setup isolation and responsive rendering passed.");
} finally {
  await browser.close();
}
