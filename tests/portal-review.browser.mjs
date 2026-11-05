import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const base = process.env.QA_URL || "http://demo-hotel.localhost:3001";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const findings = [],
  errors = [];
const output =
  process.env.QA_PUBLIC_ONLY === "1" ? "artifacts/public-review" : "artifacts/portal-review";
mkdirSync(output, { recursive: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  if (process.env.QA_LIVE_MANAGER === "1") {
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
    const data = {
      username: account.userIdentity,
      password: account.password,
      customerCode: account.customerCode,
    };
    const response = await context.request.post(`${base}/api/manager/login`, {
      headers: { Origin: base },
      data,
    });
    assert.equal(response.status(), 200, "Manager login");
    const result = await response.json();
    if (result.chooseProperty) {
      const selected = await context.request.post(`${base}/api/manager/login`, {
        headers: { Origin: base },
        data: { ...data, tenantId: result.properties[0].tenantId },
      });
      assert.equal(selected.status(), 200, "Property selection");
    }
  }
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on("pageerror", (error) => errors.push(error.message));
  async function inspect(label, width) {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const state = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      escaped: [
        ...document.querySelectorAll(
          "main button, main input, main select, main textarea, dialog[open] button, dialog[open] input",
        ),
      ]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            getComputedStyle(el).visibility !== "hidden" &&
            !el.closest(".wm-preview-viewport, .wm-sidebar") &&
            (r.left < -1 || r.right > innerWidth + 1)
          );
        })
        .map((el) =>
          (el.getAttribute("aria-label") || el.name || el.textContent).trim().slice(0, 80),
        ),
    }));
    if (state.overflow || state.escaped.length) findings.push({ label, width, ...state });
  }
  if (process.env.QA_PUBLIC_ONLY !== "1") {
    await page.goto(`${base}/website-manager`, { waitUntil: "networkidle", timeout: 120000 });
    const nav = page.getByRole("navigation", { name: "Website editor sections" });
    const sections = (await nav.getByRole("button").allTextContents()).map((text) => text.trim());
    for (const width of [1440, 1024, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      for (const section of sections) {
        const openNav = page.getByRole("button", { name: "Open navigation", exact: true });
        if (await openNav.isVisible()) await openNav.click();
        await nav.getByRole("button", { name: section, exact: true }).click();
        await inspect(section, width);
        if (["Offers", "Guest reviews", "Policies"].includes(section)) {
          const singular = { Offers: "offer", "Guest reviews": "review", Policies: "policy" }[
            section
          ];
          assert.equal(
            await page
              .getByRole("button", {
                name: `Add ${singular}`,
                exact: true,
              })
              .count(),
            0,
          );
          await page
            .getByText(
              section === "Offers"
                ? "Offers are supplied by Patel HMS."
                : section === "Policies"
                  ? "Policies are supplied by Patel HMS."
                  : "Guest reviews are supplied by Patel HMS.",
              { exact: true },
            )
            .waitFor();
          if (process.env.QA_LIVE_MANAGER === "1")
            await page
              .getByRole("button", {
                name: `Sync ${section.toLowerCase()} from Patel HMS`,
                exact: true,
              })
              .waitFor();
        }
        if (["Homepage", "Menu"].includes(section)) {
          const add = page.getByRole("button", {
            name: section === "Homepage" ? "Add banner images" : "Add Item",
            exact: true,
          });
          await add.click();
          const panel = page.getByRole("dialog");
          await panel.waitFor();
          if (
            section === "Homepage" &&
            (await panel.getByRole("button", { name: "View all", exact: true }).count())
          ) {
            await panel.getByRole("button", { name: "View all", exact: true }).click();
            const layout = await panel
              .locator(".wm-banner-photo-strip.is-expanded")
              .evaluate((el) => {
                const style = getComputedStyle(el);
                const boxes = [...el.children].map((child) => child.getBoundingClientRect());
                return {
                  columns: style.gridTemplateColumns.split(" ").length,
                  gap: parseFloat(style.gap),
                  overlaps: boxes.some((a, i) =>
                    boxes
                      .slice(i + 1)
                      .some(
                        (b) =>
                          Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
                      ),
                  ),
                };
              });
            assert.equal(layout.columns, 2);
            assert.equal(layout.gap, 16);
            assert.equal(layout.overlaps, false);
            if ([1440, 390].includes(width))
              await page.screenshot({ path: `${output}/${width}-expanded-banner-photos.png` });
          }
          await inspect(`${section} side panel`, width);
          assert.equal(await panel.evaluate((el) => el.scrollWidth > el.clientWidth + 1), false);
          await page.keyboard.press("Escape");
          await panel.waitFor({ state: "detached" });
        }
        assert.equal(
          await page.locator(".wm-section-header-card").count(),
          0,
          "Removed section headers stay removed",
        );
        if (
          ["Dashboard", "Homepage", "Menu", "Appearance"].includes(section) &&
          [1440, 390].includes(width)
        )
          await page.screenshot({ path: `${output}/${width}-${section.toLowerCase()}.png` });
        if (section === "Appearance") {
          for (const tab of ["Brand identity", "Colors", "Typography", "Experience", "Header"]) {
            await page.getByRole("tab", { name: tab, exact: true }).click();
            await inspect(`Appearance / ${tab}`, width);
          }
        }
      }
      console.log(`Reviewed ${sections.length} portal sections at ${width}px`);
    }
  }
  const routes =
    process.env.QA_LIVE_MANAGER === "1"
      ? []
      : [
          "/",
          "/rooms",
          "/about",
          "/experiences",
          "/dining",
          "/menu",
          "/offers",
          "/gallery",
          "/reviews",
          "/contact",
          "/faq",
          "/policies",
          "/booking",
        ];
  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(base + route, { waitUntil: "networkidle", timeout: 120000 });
    if (response.status() !== 200) findings.push({ label: route, status: response.status() });
    if (route === "/")
      assert.ok(
        (await page.getByRole("button", { name: /^Show image \d+:/ }).count()) <= 7,
        "Public banner respects seven-image limit",
      );
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await inspect(route, width);
      if (["/", "/rooms", "/menu", "/contact"].includes(route) && [1440, 390].includes(width))
        await page.screenshot({
          path: `${output}/${width}-public-${route.replaceAll("/", "") || "home"}.png`,
        });
    }
    console.log(`Reviewed public ${route}`);
  }
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify({ findings, errors }, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ findings, errors }, null, 2));
assert.deepEqual(errors, [], "No client runtime errors");
assert.deepEqual(findings, [], "No layout or route errors");
