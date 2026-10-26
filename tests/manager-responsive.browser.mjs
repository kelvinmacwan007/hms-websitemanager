import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const output = "artifacts/manager-responsive";
mkdirSync(output, { recursive: true });
const findings = [];
const errors = [];
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const response = await context.request.post(`${base}/api/manager/login`, {
    headers: { Origin: base },
    data: {
      username: account.userIdentity,
      password: account.password,
      customerCode: account.customerCode,
    },
  });
  assert.equal(response.status(), 200, "HMS login");
  const result = await response.json();
  if (result.chooseProperty) {
    const selected = await context.request.post(`${base}/api/manager/login`, {
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
  await page.goto(`${base}/website-manager`, { waitUntil: "networkidle" });
  const nav = page.getByRole("navigation", { name: "Website editor sections" });
  const sections = await nav.getByRole("button").allTextContents();
  async function inspect(width, section) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const state = await page.evaluate(() => {
      const visible = (element) =>
        element.getClientRects().length &&
        getComputedStyle(element).visibility !== "hidden" &&
        !element.closest(".wm-sidebar:not(.is-open)") &&
        !element.closest("dialog:not([open])");
      const controls = [
        ...document.querySelectorAll(
          ".wm-main button, .wm-main input, .wm-main select, .wm-main textarea, .wm-main summary, dialog[open] button, dialog[open] select",
        ),
      ].filter(visible);
      const escaped = controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left < -1 || rect.right > innerWidth + 1;
        })
        .map((element) => ({
          class: element.className,
          text: (element.textContent || element.getAttribute("aria-label") || element.name || "")
            .trim()
            .slice(0, 65),
        }));
      const actions = [
        ...document.querySelectorAll(".wm-heading-actions > *, .wm-account-bar button"),
      ].filter(visible);
      const overlaps = [];
      for (let i = 0; i < actions.length; i++)
        for (let j = i + 1; j < actions.length; j++) {
          const a = actions[i].getBoundingClientRect(),
            b = actions[j].getBoundingClientRect();
          if (
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
            Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
          )
            overlaps.push([actions[i].textContent.trim(), actions[j].textContent.trim()]);
        }
      return { overflow: document.documentElement.scrollWidth > innerWidth + 1, escaped, overlaps };
    });
    if (state.overflow || state.escaped.length || state.overlaps.length)
      findings.push({ width, section, ...state });
  }
  for (const width of [320, 360, 390, 480, 617, 768, 1024, 1100, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width <= 390 ? 667 : 900 });
    for (const section of sections) {
      if (width <= 1100)
        await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await nav.getByRole("button", { name: section.trim(), exact: true }).click();
      await inspect(width, section.trim());
      const sectionHeader = page.locator(".wm-section-header-card");
      assert.equal(await sectionHeader.locator(".wm-section-header-icon svg").count(), 1);
      const helpButton = sectionHeader.getByRole("button", {
        name: "Help with this section",
        exact: true,
      });
      await helpButton.click();
      assert.equal(await page.locator(".wm-editor-column > .wm-section-help").isVisible(), true);
      await helpButton.click();
      assert.equal(await page.locator(".wm-editor-column > .wm-section-help").isVisible(), false);
      await page.locator(".wm-editor-column details").evaluateAll((details) =>
        details.forEach((detail) => {
          detail.open = true;
        }),
      );
      await inspect(width, `${section.trim()} expanded`);
      if (section.trim() === "Brand & appearance") {
        for (const tab of ["Brand identity", "Colors", "Typography", "Experience", "Header"]) {
          await page.getByRole("tab", { name: tab, exact: true }).click();
          await inspect(width, `Appearance: ${tab}`);
        }
      }
      if (section === sections[0] && [320, 390, 617, 1024, 1440].includes(width))
        await page.screenshot({ path: `${output}/${width}.png`, fullPage: true });
    }
    if (width <= 1100)
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await nav.getByRole("button", { name: sections[0].trim(), exact: true }).click();
    const field = page.getByLabel("Tagline", { exact: true });
    const original = await field.inputValue();
    await field.fill(`${original} Responsive review`);
    await inspect(width, "Unsaved changes toolbar");
    await field.fill(original);
    if (width > 1100) {
      const card = page.locator(".wm-guest-preview-card");
      let cardSize;
      for (const device of ["Desktop", "Tablet", "Mobile"]) {
        await card.getByRole("button", { name: `${device} preview`, exact: true }).click();
        await inspect(width, `Guest preview card: ${device}`);
        const bounds = await card.boundingBox();
        const size = { width: Math.round(bounds.width), height: Math.round(bounds.height) };
        if (!cardSize) cardSize = size;
        else
          assert.deepEqual(
            size,
            cardSize,
            `Guest preview card must stay the same size at ${width}px`,
          );
      }
    }
    const previewPromise = context.waitForEvent("page");
    await page
      .locator(".wm-heading-actions")
      .getByRole("button", { name: /^Preview(?: changes)?$/ })
      .click();
    const previewPage = await previewPromise;
    previewPage.on("pageerror", (error) => errors.push(error.message));
    await previewPage.waitForURL((url) => url.searchParams.has("__website_preview"), {
      timeout: 60000,
    });
    await previewPage.waitForLoadState("networkidle");
    for (const previewWidth of [1280, 768, 390]) {
      await previewPage.setViewportSize({ width: previewWidth, height: 900 });
      await previewPage.evaluate(async () => {
        await document.fonts.ready;
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const overflow = await previewPage.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      );
      if (overflow)
        findings.push({
          width: previewWidth,
          section: `Actual preview opened from ${width}px`,
          overflow: true,
        });
    }
    if ([320, 390, 1024].includes(width))
      await previewPage.screenshot({ path: `${output}/${width}-preview.png`, fullPage: true });
    await previewPage.close();
    console.log(
      `Checked ${width}px: ${sections.length} editor sections, expanded fields, all appearance tabs, unsaved toolbar and preview sizes`,
    );
  }
  for (const viewport of [
    { width: 667, height: 375 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    for (const section of sections) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await nav.getByRole("button", { name: section.trim(), exact: true }).click();
      await inspect(viewport.width, `${section.trim()} landscape ${viewport.height}px`);
    }
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    const lastButton = nav.getByRole("button").last();
    await lastButton.scrollIntoViewIfNeeded();
    const bounds = await lastButton.boundingBox();
    assert.ok(
      bounds.y >= 0 && bounds.y + bounds.height <= viewport.height + 1,
      "Sidebar scrolls on short screens",
    );
    await lastButton.click();
    await page.screenshot({ path: `${output}/${viewport.width}-landscape.png` });
    console.log(
      `Checked landscape ${viewport.width}x${viewport.height}: all editor sections and sidebar scrolling`,
    );
  }
  writeFileSync(`${output}/report.json`, JSON.stringify({ findings, errors }, null, 2));
  console.log(JSON.stringify({ findings, errors }, null, 2));
  await context.request.post(`${base}/api/manager/logout`, { headers: { Origin: base } });
  assert.deepEqual(errors, [], "Browser errors");
  assert.deepEqual(findings, [], "Responsive layout findings");
} finally {
  await browser.close();
}
