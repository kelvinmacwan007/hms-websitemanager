import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(
    `${process.env.QA_URL || "http://demo-hotel.localhost:3001"}/rooms/deluxe-city-room`,
    { waitUntil: "networkidle" },
  );
  const panel = page.getByRole("complementary", { name: "Room reservation" });
  mkdirSync("artifacts/room-calendar", { recursive: true });
  for (const [width, height] of [
    [1440, 900],
    [800, 600],
    [800, 350],
    [640, 400],
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    const controls = await panel
      .locator('button[aria-haspopup="dialog"],select')
      .evaluateAll((elements) =>
        elements.map((element) => {
          const style = getComputedStyle(element);
          return {
            height: element.offsetHeight,
            radius: style.borderRadius,
            font: getComputedStyle(element.firstElementChild ?? element).fontSize,
          };
        }),
      );
    for (const control of controls) {
      assert.equal(control.height, 52, `${width}: consistent control height`);
      assert.equal(control.radius, "12px", `${width}: consistent control corners`);
      assert.equal(control.font, "16px", `${width}: consistent control text`);
    }
    for (const label of [/^Check-in:/, /^Check-out:/, /^Guests/, /^Rooms/]) {
      const trigger = panel.getByRole("button", { name: label });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      await page.waitForTimeout(200);
      const box = await dialog.boundingBox();
      assert.ok(
        box.x >= 15 &&
          box.y >= 15 &&
          box.x + box.width <= width - 15 &&
          box.y + box.height <= height - 15,
        JSON.stringify({ width, height, label: String(label), box }),
      );
      assert.equal(
        await dialog.evaluate((element) => element.scrollTop),
        0,
        "dialog opens at the beginning",
      );
      const scrollY = await page.evaluate(() => window.scrollY);
      await page.mouse.move(2, height / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(100);
      assert.equal(await page.evaluate(() => window.scrollY), scrollY, "background scroll locked");
      if (String(label).includes("Check-in")) {
        await dialog.screenshot({ path: `artifacts/room-calendar/${width}-${height}.png` });
        await dialog.evaluate((element) => (element.scrollTop = element.scrollHeight));
        const close = dialog.getByRole("button", { name: /^Close/ });
        const closeBox = await close.boundingBox();
        assert.ok(
          closeBox.y >= box.y && closeBox.y + closeBox.height <= box.y + box.height,
          "close remains visible while scrolling",
        );
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
      assert.notEqual(
        await page.evaluate(() => document.documentElement.style.overflow),
        "hidden",
        "background scroll restored",
      );
    }
  }
  assert.deepEqual(errors, []);
  console.log(
    "Room details passed: matching input styles, viewport-safe date/guest/room dialogs at six desktop/mobile/short sizes, scroll lock and dismissal.",
  );
} finally {
  await browser.close();
}
