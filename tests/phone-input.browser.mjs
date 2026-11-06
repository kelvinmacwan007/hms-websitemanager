import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const date = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
  const q = new URLSearchParams({
    checkIn: date(2),
    checkOut: date(3),
    guests: "2",
    rooms: "1",
    room: "deluxe-city-room",
    rate: "bar",
  });
  await page.goto(
    `${process.env.QA_URL || "http://demo-hotel.localhost:3001"}/booking/checkout?${q}`,
    { waitUntil: "networkidle" },
  );
  const phone = page.getByRole("textbox", { name: "Phone number", exact: true });
  const hidden = page.locator('input[type="hidden"][name="phone"]');
  const country = page.getByRole("button", { name: "Phone country", exact: true });
  assert.match(await country.innerText(), /\+1/);
  await phone.pressSequentially("20155501239999");
  assert.equal(await phone.inputValue(), "(201) 555-0123");
  assert.equal(await hidden.inputValue(), "+12015550123");
  await phone.fill("26256266262626262626552626655");
  assert.equal((await phone.inputValue()).replace(/\D/g, ""), "2625626626");
  await country.click();
  const list = page.getByRole("listbox", { name: "Phone country", exact: true });
  // Offscreen flags use native lazy loading; verify every local asset separately.
  const failedFlags = await list.locator("img").evaluateAll(async (images) => {
    const results = await Promise.all(
      images.map(async (image) => {
        const response = await fetch(image.getAttribute("src"));
        return response.ok && response.headers.get("content-type")?.includes("image/svg+xml")
          ? null
          : image.getAttribute("src");
      }),
    );
    return results.filter(Boolean);
  });
  assert.deepEqual(failedFlags, []);
  assert.equal(await list.locator("img").count(), 245);
  await list.hover();
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  assert.ok(await list.evaluate((el) => el.scrollTop > 0), "mouse wheel scrolls country options");
  const search = page.getByRole("combobox", { name: "Search phone country", exact: true });
  await search.fill("United Kingdom");
  await list.getByRole("option", { name: /United Kingdom/ }).click();
  await phone.fill("2079460018");
  assert.equal(await phone.inputValue(), "020 7946 0018");
  assert.equal(await hidden.inputValue(), "+442079460018");
  await country.click();
  await search.fill("India");
  await list.getByRole("option", { name: /^India/ }).click();
  assert.equal(
    await hidden.inputValue(),
    "+912079460018",
    "country changes retain the national number and replace the calling code",
  );
  await phone.fill("9876543210");
  await phone.blur();
  assert.notEqual(await phone.getAttribute("aria-invalid"), "true");
  assert.equal(await hidden.inputValue(), "+919876543210");
  await phone.fill("123");
  await phone.blur();
  assert.equal(await phone.getAttribute("aria-invalid"), "true");
  await phone.fill("+1 201 555 0123");
  await phone.blur();
  assert.equal(await hidden.inputValue(), "+12015550123");
  assert.match(await country.innerText(), /\+1/);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await country.click();
    const bounds = await list.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
      false,
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "Phone UI passed: 245 loaded flags, USA default, digit limits, country masks/switching, international paste, validation, wheel scrolling, mobile and Escape.",
  );
} finally {
  await browser.close();
}
