import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://localhost:3000";
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).replace(/^(['"])(.*)\1$/, "$2")];
    }),
);
const account = Object.values(JSON.parse(env.PATEL_HMS_TENANTS_JSON))[0];
const browser = await chromium.launch({ channel: "msedge", headless: true });
mkdirSync("artifacts/header-templates", { recursive: true });
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1600, height: 1100 },
  });
  const credentials = {
    username: account.userIdentity,
    password: account.password,
    customerCode: account.customerCode,
  };
  let login = await context.request.post(base + "/api/manager/login", {
    headers: { Origin: base },
    data: credentials,
  });
  assert.equal(login.status(), 200, "manager login");
  const result = await login.json();
  if (result.chooseProperty) {
    login = await context.request.post(base + "/api/manager/login", {
      headers: { Origin: base },
      data: { ...credentials, tenantId: result.properties[0].tenantId },
    });
    assert.equal(login.status(), 200);
  }
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/website-manager", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Brand & appearance", exact: true })
    .click();
  await page.getByRole("tab", { name: "Header", exact: true }).click();
  const group = page.getByRole("radiogroup", { name: "Header template" });
  assert.equal(await group.getByRole("radio").count(), 5);
  await group
    .locator("img")
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => {}))));
  await group.screenshot({ path: "artifacts/header-templates/settings.png" });
  const templates = process.env.QA_HEADER_TEMPLATE
    ? [process.env.QA_HEADER_TEMPLATE]
    : ["minimal", "centered", "contact", "announcement", "transparent"];
  const preview = await context.newPage();
  const stickySignatures = new Map();
  preview.setDefaultNavigationTimeout(60000);
  preview.on("pageerror", (error) => errors.push(error.message));
  for (const template of templates) {
    await group.locator(`input[value="${template}"]`).check();
    if (template === "announcement") {
      await page
        .getByLabel("Announcement text", { exact: true })
        .fill("Welcome to your next escape");
      await page.getByLabel("Link label", { exact: true }).fill("Check rooms");
      await page.getByLabel("Link destination", { exact: true }).selectOption("/rooms");
    }
    await page.waitForFunction((t) => {
      const f = document.querySelector('iframe[title="Actual hotel website preview"]');
      return (
        f?.contentDocument
          ?.querySelector("header[data-template]")
          ?.getAttribute("data-template") === t
      );
    }, template);
    // Allow the debounced preview document to settle after editing announcement copy.
    if (template === "announcement")
      await page.waitForFunction(() =>
        document
          .querySelector('iframe[title="Actual hotel website preview"]')
          ?.contentDocument?.body?.innerText.includes("Welcome to your next escape"),
      );
    const src = await page
      .locator('iframe[title="Actual hotel website preview"]')
      .getAttribute("src");
    await preview.goto(new URL(src, base).href, { waitUntil: "domcontentloaded" });
    const header = preview.locator(`header[data-template="${template}"]`);
    await header.waitFor();
    await preview.locator("[data-home-loading]").waitFor({ state: "hidden", timeout: 15000 });
    await preview.waitForFunction(() =>
      [...document.querySelectorAll("header[data-template] img")].every((image) => image.complete),
    );
    for (const width of [1600, 1280, 1024, 768, 390, 320]) {
      await preview.setViewportSize({ width, height: 1000 });
      await preview.waitForTimeout(100);
      const state = await header.evaluate((h) => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        logo: h.querySelector('a[aria-label$=" home"] img')?.getAttribute("src"),
        primary: getComputedStyle(h).getPropertyValue("--color-brand"),
      }));
      assert.equal(state.overflow, false, `${template}: overflow at ${width}`);
      assert.ok(state.logo, `${template}: API logo`);
      assert.ok(state.primary.trim());
      if (width === 1600)
        await header.screenshot({ path: `artifacts/header-templates/${template}-desktop.png` });
      if (width === 390) {
        await header.getByRole("button", { name: "Open navigation", exact: true }).click();
        await preview.getByRole("navigation", { name: "Mobile navigation", exact: true }).waitFor();
        await header.screenshot({ path: `artifacts/header-templates/${template}-mobile.png` });
        await preview.keyboard.press("Escape");
      }
    }
    if (template === "announcement") {
      await header.getByRole("button", { name: "Dismiss announcement" }).click();
      assert.equal(await header.getByText("Welcome to your next escape").count(), 0);
    }
    for (const width of [1600, 1024, 390, 320]) {
      await preview.setViewportSize({ width, height: 1000 });
      await preview.evaluate(() => window.scrollTo(0, 500));
      await preview.waitForFunction(
        () =>
          document.querySelector("header[data-template]")?.getAttribute("data-compact") === "true",
      );
      const sticky = header.locator("[data-sticky-header]");
      await sticky.waitFor();
      const signature = await sticky.evaluate((row) => {
        const css = getComputedStyle(row.closest("header"));
        return {
          height: row.getBoundingClientRect().height,
          background: css.backgroundColor,
          shadow: css.boxShadow,
          logoHeight: row.querySelector("img").getBoundingClientRect().height,
          links: [...row.querySelectorAll("nav a")].map((link) => link.textContent),
          book: [...row.querySelectorAll('a[href="/booking"]')].at(-1)?.textContent,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert.equal(signature.overflow, false, `${template}: sticky overflow at ${width}`);
      if (stickySignatures.has(width))
        assert.deepEqual(
          signature,
          stickySignatures.get(width),
          `${template}: shared sticky design at ${width}`,
        );
      else stickySignatures.set(width, signature);
      if (width === 390) {
        await sticky.getByRole("button", { name: "Open navigation", exact: true }).click();
        await preview.getByRole("navigation", { name: "Mobile navigation", exact: true }).waitFor();
        await preview.keyboard.press("Escape");
      }
      if (width === 1600)
        await header.screenshot({ path: `artifacts/header-templates/${template}-sticky.png` });
      await preview.evaluate(() => window.scrollTo(0, 0));
      await preview.waitForFunction(
        () =>
          document.querySelector("header[data-template]")?.getAttribute("data-compact") === "false",
      );
    }
    console.log(`PASS ${template}: API logo, palette, 6 widths and mobile menu`);
  }
  assert.deepEqual(errors, []);
  for (const width of [768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Header settings overflow at ${width}`,
    );
  }
  console.log(
    `PASS header settings and ${templates.length} live previews; no website changes saved or published`,
  );
} finally {
  await browser.close();
}
