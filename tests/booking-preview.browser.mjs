import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^(['"])(.*)\1$/, "$2")];
    }),
);
const account = Object.values(JSON.parse(env.PATEL_HMS_TENANTS_JSON))[0];
const browser = await chromium.launch({ channel: "msedge", headless: true });

try {
  const context = await browser.newContext();
  context.setDefaultTimeout(120000);

  const response = await context.request.post(base + "/api/manager/login", {
    timeout: 120000,
    headers: { Origin: base },
    data: {
      username: account.userIdentity,
      password: account.password,
      customerCode: account.customerCode,
    },
  });
  assert.equal(response.status(), 200);
  const result = await response.json();
  if (result.chooseProperty) {
    const selected = await context.request.post(base + "/api/manager/login", {
      headers: { Origin: base },
      data: {
        username: account.userIdentity,
        password: account.password,
        customerCode: account.customerCode,
        tenantId: result.properties[0].tenantId,
      },
    });
    assert.equal(selected.status(), 200);
  }

  const page = await context.newPage();
  page.setDefaultTimeout(120000);
  await page.goto(base + "/website-manager", { waitUntil: "domcontentloaded", timeout: 120000 });
  const pp = context.waitForEvent("page");
  await page
    .locator(".wm-heading-actions")
    .getByRole("button", { name: /^Preview(?: changes)?$/ })
    .click();
  const preview = await pp;
  preview.setDefaultTimeout(120000);
  await preview.waitForURL((u) => u.searchParams.has("__website_preview"));
  const token = new URL(preview.url()).searchParams.get("__website_preview");
  await preview.setViewportSize({ width: 1440, height: 1000 });
  await preview.goto(base + "/booking?__website_preview=" + token, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await preview.locator(".booking-widget").waitFor();
  await preview.getByRole("button", { name: "Check availability", exact: true }).click();
  await preview.waitForURL((u) => u.searchParams.has("checkIn"));
  await preview.waitForLoadState("networkidle");
  assert.equal(new URL(preview.url()).searchParams.get("__website_preview"), token);
  const theme = await preview.evaluate(() => ({
    brand: getComputedStyle(document.documentElement).getPropertyValue("--color-brand"),
    footer: getComputedStyle(document.querySelector("footer")).backgroundColor,
    overflow: document.documentElement.scrollWidth > innerWidth,
  }));
  assert.ok(theme.brand);
  assert.equal(theme.overflow, false);
  (await import("node:fs")).mkdirSync("artifacts/booking-design", { recursive: true });
  await preview.screenshot({ path: "artifacts/booking-design/desktop.png", fullPage: true });
  await preview.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await preview.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await preview.screenshot({ path: "artifacts/booking-design/mobile.png", fullPage: true });
  console.log(JSON.stringify({ previewPreserved: true, theme, mobileOverflow: false }));
} finally {
  await browser.close();
}
