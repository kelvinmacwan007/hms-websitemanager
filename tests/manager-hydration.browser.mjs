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

const errors = [];
try {
  const context = await browser.newContext();
  const response = await context.request.post(base + "/api/manager/login", {
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
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && /hydrat|didn.t match/i.test(message.text()))
      errors.push(message.text());
  });
  await context.addInitScript(() => {
    // Simulate security software annotating parsed HTML before hydration.
    const seen = new WeakSet();
    window.injectedSecurityAttributes = 0;
    new MutationObserver(() => {
      document.querySelectorAll("div").forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        window.injectedSecurityAttributes++;
        element.setAttribute("bis_skin_checked", "1");
      });
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(base + "/website-manager", { waitUntil: "networkidle" });
  await page.locator(".wm-app-brand").waitFor();
  assert.ok(
    await page.evaluate(() => window.injectedSecurityAttributes > 0),
    "injection is active",
  );
  assert.equal(await page.locator("[bis_skin_checked]").count(), 0);
  const nav = page.getByRole("navigation", { name: "Website editor sections" });
  await nav.getByRole("button", { name: "Brand & appearance", exact: true }).click();
  await page.getByRole("tab", { name: "Colors", exact: true }).click();
  const hotelPage = await context.newPage();
  hotelPage.on("pageerror", (error) => errors.push(error.message));
  hotelPage.on("console", (message) => {
    if (message.type() === "error" && /hydrat|didn.t match/i.test(message.text()))
      errors.push(message.text());
  });
  const hotelUrl = new URL(base);
  hotelUrl.hostname = (env.PATEL_HMS_LOCAL_TENANT_ID || "knot") + ".localhost";
  await hotelPage.goto(hotelUrl.href, { waitUntil: "networkidle" });
  await hotelPage.locator(".stay-cta-photo").first().waitFor();
  assert.ok(await hotelPage.evaluate(() => window.injectedSecurityAttributes > 0));
  assert.equal(await hotelPage.locator("[bis_skin_checked]").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "Manager navigation and hotel CTA load with simulated security attributes; no hydration errors.",
  );
} finally {
  await browser.close();
}
