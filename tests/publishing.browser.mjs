import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync, existsSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { demoHotel } from "../src/providers/mock/demoHotel.ts";
const root = process.cwd();
function load(relative) {
  const filename = path.resolve(root, relative);
  const exports = {};
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  new Function("require", "exports", outputText)(
    (specifier) =>
      load(
        path.resolve(
          path.dirname(filename),
          specifier.endsWith(".ts") ? specifier : `${specifier}.ts`,
        ),
      ),
    exports,
  );
  return exports;
}
const { createWebsiteDocument, presentationPayload } = load("Portal/content.ts");
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const port = new URL(process.env.QA_URL || "http://localhost:3000").port || "3000";
const a = `http://hotel1.localhost:${port}`,
  b = `http://hotel2.localhost:${port}`;
const files = ["hotel1.draft.json", "hotel1.published.json"].map((name) =>
  path.join(root, ".data", "website", name),
);
const backups = files.map((file) => (existsSync(file) ? readFileSync(file) : null));
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(b, { waitUntil: "networkidle" });
  const beforeB = await page.locator("html").getAttribute("style");
  const nameB = await page.locator(".hero-hotel-name").textContent();
  await page.goto(a, { waitUntil: "networkidle" });
  const beforeA = await page.locator("html").getAttribute("style");
  const source = structuredClone(demoHotel);
  source.tenantId = "hotel1";
  const document = createWebsiteDocument(source);
  document.hotel.branding.primaryColor = "#173b3f";
  document.hotel.branding.logoUrl = "/branding/aurelia-hotel-burgundy.png";
  document.hotel.branding.logoLayout = "wide";
  document.hotel.heroSlides = [document.hotel.gallery[1]];
  document.hotel.rooms[0].name = "Ocean King Retreat QA";
  document.hotel.rooms[0].description = "Published room description QA";
  document.hotel.rooms[0].slug = "ocean-king-qa";
  document.pages.offers.enabled = false;
  document.pages.rooms.title = "Published rooms heading QA";
  document.pages.rooms.seoTitle = "Published rooms SEO QA";
  document.homeSections.reverse();
  const payload = presentationPayload(document);
  await page.goto(`${a}/website-manager`, { waitUntil: "networkidle" });
  const post = (action, document) =>
    page.evaluate(
      async ({ action, document }) => {
        const response = await fetch("/api/website/document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, document }),
        });
        return { status: response.status, result: await response.json() };
      },
      { action, document },
    );
  assert.equal((await post("draft", payload)).status, 200);
  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("navigation", { name: "Website editor sections" })
    .getByRole("button", { name: "Rooms", exact: true })
    .click();
  assert.ok(
    (await page.locator(".wm-editor-fields").textContent()).includes("Ocean King Retreat QA"),
  );
  await page.goto(a, { waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("style"), beforeA);
  assert.equal(await page.getByText("Ocean King Retreat QA", { exact: true }).count(), 0);
  assert.equal((await post("publish", payload)).status, 200);
  await page.reload({ waitUntil: "networkidle" });
  assert.ok((await page.locator("html").getAttribute("style")).includes("#173b3f"));
  assert.equal(
    await page
      .locator('header img[src="/branding/aurelia-hotel-burgundy.png"]')
      .evaluateAll(
        (images) =>
          images.filter(
            (image) =>
              image.getClientRects().length && getComputedStyle(image).visibility !== "hidden",
          ).length,
      ),
    1,
  );
  assert.ok(await page.getByText("Ocean King Retreat QA", { exact: true }).count());
  assert.equal(await page.locator('nav a[href="/offers"]').count(), 0);
  const sections = await page
    .locator("[data-home-section]")
    .evaluateAll((nodes) => nodes.map((node) => node.dataset.homeSection));
  assert.deepEqual(
    sections,
    document.homeSections
      .filter((section) => section.enabled && section.id !== "offers")
      .map((section) => section.id),
  );
  // App Router may stream a not-found page with HTTP 200. Verify the actual result.
  const unavailable = await page.goto(`${a}/offers`);
  assert.ok([200, 404].includes(unavailable.status()));
  await page.getByRole("heading", { name: "This page is not available.", exact: true }).waitFor();
  assert.ok(await page.locator('meta[name="robots"][content*="noindex"]').count());
  await page.goto(`${a}/rooms`, { waitUntil: "networkidle" });
  assert.equal(await page.title(), "Published rooms SEO QA");
  assert.equal(
    await page.getByRole("heading", { level: 1 }).textContent(),
    "Published rooms heading QA",
  );
  await page.goto(`${a}/rooms/ocean-king-qa`, { waitUntil: "networkidle" });
  assert.ok((await page.locator("main").textContent()).includes("Published room description QA"));
  await page.goto(b, { waitUntil: "networkidle" });
  assert.equal(await page.locator("html").getAttribute("style"), beforeB);
  assert.equal(await page.locator(".hero-hotel-name").textContent(), nameB);
  await page.goto(`${a}/website-manager`, { waitUntil: "networkidle" });
  assert.equal((await post("draft", { ...payload, tenantId: "hotel2" })).status, 422);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(a, { waitUntil: "networkidle" });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      `published home overflow at ${width}`,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "Publishing browser acceptance passed: persisted draft, unchanged public draft, tenant-scoped publish, branding, room presentation/slug, page SEO/visibility, section order, Hotel B isolation, authorization identity rejection, responsive widths 320/390/768/1440.",
  );
} finally {
  await browser.close();
  files.forEach((file, index) => {
    if (backups[index]) writeFileSync(file, backups[index]);
    else if (existsSync(file)) unlinkSync(file);
  });
}
