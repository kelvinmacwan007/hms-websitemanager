import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { createTheme } from "../src/lib/branding/theme.ts";

// Reads the already-running configured website. Never submits a booking or payment.
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
const base = process.env.QA_URL ?? "http://localhost:3000";
mkdirSync("artifacts/hms", { recursive: true });
const colorFile = ".data/website/stardust.colors.json";
const originalColors = existsSync(colorFile) ? readFileSync(colorFile) : null;
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/rooms`, { waitUntil: "networkidle" });
  assert.equal(
    await page
      .getByText("Demo website: sample content and rates. Reservations are not enabled.")
      .count(),
    0,
  );
  assert.equal(await page.locator("main article").count(), 6);
  await page.getByRole("heading", { name: "Executive Room", exact: true }).waitFor();
  const photo = page.locator("main img[src*='premium-20260810112912.jpg']");
  assert.equal(await photo.count(), 1);
  assert.equal(await photo.evaluate((image) => image.complete && image.naturalWidth > 0), true);
  assert.equal(await page.locator("main img[src*='/demo/']").count(), 0);
  assert.equal(await page.getByText(/From .*\/ night/).count(), 0);
  await page.screenshot({ path: "artifacts/hms/live-rooms-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    true,
  );
  await page.screenshot({ path: "artifacts/hms/live-rooms-mobile.png", fullPage: true });
  await page.goto(`${base}/gallery`, { waitUntil: "networkidle" });
  assert.ok((await page.locator("main img[src*='premium-20260810112912.jpg']").count()) > 0);
  await page.goto(base, { waitUntil: "networkidle" });
  assert.ok((await page.locator("img[src*='premium-20260810112912.jpg']").count()) > 0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const writes = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/api/website/"))
      writes.push(request.url());
  });
  await page.goto(`${base}/website-manager`, { waitUntil: "networkidle" });
  await page.getByText(/Live HMS data preview:/).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Publish website", exact: true }).isDisabled(),
    true,
  );
  const nav = page.getByRole("navigation", { name: "Website editor sections" });
  await nav.getByRole("button", { name: "Rooms", exact: true }).click();
  assert.ok((await page.getByText("Executive Room", { exact: true }).count()) > 0);
  assert.ok((await page.locator("img[src*='premium-20260810112912.jpg']").count()) > 0);
  await nav.getByRole("button", { name: "Brand & appearance", exact: true }).click();
  await page.getByRole("button", { name: "Use logo colors", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Logo colors applied" }).waitFor();
  for (const label of ["Primary", "Secondary", "Accent"]) {
    assert.match(await page.getByLabel(label, { exact: true }).inputValue(), /^#[0-9a-f]{6}$/);
  }
  await page.screenshot({ path: "artifacts/hms/live-logo-palette.png", fullPage: true });
  await page.getByLabel("Accent", { exact: true }).fill("#123456");
  assert.equal(await page.getByLabel("Accent", { exact: true }).inputValue(), "#123456");
  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const context = canvas.getContext("2d");
    context.fillStyle = "#0050a0";
    context.fillRect(0, 0, 96, 128);
    context.fillStyle = "#f07814";
    context.fillRect(96, 0, 32, 128);
    return canvas.toDataURL("image/png");
  });
  await page.getByLabel("Upload Primary logo", { exact: true }).setInputFiles({
    name: "palette-test.png",
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
  });
  await page.getByRole("status").filter({ hasText: "Image added" }).waitFor();
  await page.getByRole("button", { name: "Use logo colors", exact: true }).click();
  await page.getByRole("status").filter({ hasText: "Logo colors applied" }).waitFor();
  assert.equal(await page.getByLabel("Primary", { exact: true }).inputValue(), "#0050a0");
  assert.equal(await page.getByLabel("Accent", { exact: true }).inputValue(), "#f07814");
  const colorResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/website/colors") && response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  assert.equal((await colorResponse).status(), 200);
  await page
    .getByRole("status")
    .filter({ hasText: "Colors applied to your local website" })
    .waitFor();
  assert.equal(JSON.parse(readFileSync(colorFile, "utf8")).colors.primaryColor, "#0050a0");
  assert.deepEqual(writes, []);
  const expectedTheme = createTheme({
    primaryColor: "#0050a0",
    secondaryColor: "#bfd3e7",
    accentColor: "#f07814",
  });
  const guest = await browser.newPage();
  for (const route of ["/", "/rooms", "/gallery"]) {
    await guest.goto(`${base}${route}`, { waitUntil: "networkidle" });
    for (const variable of ["--color-brand", "--color-secondary", "--color-accent"]) {
      assert.equal(
        await guest.evaluate(
          (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
          variable,
        ),
        expectedTheme[variable],
      );
    }
  }
  const invalid = await page.evaluate(
    async () =>
      (
        await fetch("/api/website/colors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ primaryColor: "invalid" }),
        })
      ).status,
  );
  assert.equal(invalid, 400);
  const denied = await page.request.put(`${base}/api/website/colors`, {
    headers: { Origin: "https://unrelated.example" },
    data: { primaryColor: "#000000", secondaryColor: "#000000", accentColor: "#000000" },
  });
  assert.equal(denied.status(), 403);
  await guest.close();
  await page.screenshot({ path: "artifacts/hms/live-manager-desktop.png", fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: API rooms/photos; logo palette and manual colors; saved colors appear on home/rooms/gallery in a separate browser session; invalid colors/cross-origin saves rejected; publishing disabled and no HMS writes.",
  );
} finally {
  await browser.close();
  if (originalColors) writeFileSync(colorFile, originalColors);
  else if (existsSync(colorFile)) unlinkSync(colorFile);
}
