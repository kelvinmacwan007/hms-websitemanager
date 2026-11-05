import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.TEMP, "hotel-homepage-qa", "package.json"));
const { chromium } = require("playwright");
const browser = await chromium.launch({ channel: "msedge", headless: true });
let page;
try {
  page = await browser.newPage({
    viewport: { width: 1600, height: 1100 },
    reducedMotion: "reduce",
  });
  const date = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const query = new URLSearchParams({
    checkIn: date(2),
    checkOut: date(4),
    guests: "2",
    rooms: "1",
    room: "deluxe-city-room",
    rate: "bar",
  });
  await page.goto(
    `${process.env.QA_URL || "http://demo-hotel.localhost:3001"}/booking/checkout?${query}`,
    { waitUntil: "domcontentloaded", timeout: 120000 },
  );
  // Do not submit an SSR form until React has attached its event handler.
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("form")].some((form) =>
        Object.keys(form).some(
          (key) => key.startsWith("__reactProps") && typeof form[key]?.onSubmit === "function",
        ),
      ),
    undefined,
    { timeout: 60000 },
  );
  await page.locator("input[name=firstName]").fill("Test");
  await page.locator("input[name=lastName]").fill("Guest");
  await page.locator("input[name=email]").fill("test@example.com");
  await page.locator("input[name=phone]").fill("3055550100");
  await page.locator("select[name=prefix]").selectOption("Mr");
  for (const checkbox of await page.locator("input[type=checkbox][required]").all())
    await checkbox.check();
  await page.getByRole("button", { name: "Review sample details", exact: true }).click();
  await page
    .getByRole("heading", { name: "Your sample details are ready.", exact: true })
    .waitFor();
  const checkoutUrl = page.url();
  await page.getByRole("button", { name: "Continue to payment", exact: true }).click();
  await page.getByRole("region", { name: "Secure payment", exact: true }).waitFor();
  assert.equal(page.url(), checkoutUrl, "payment stays inside the current stepper");
  await page.locator('[aria-current="step"]').filter({ hasText: "Payment" }).waitFor();
  const pay = page.locator("#checkoutWidget").getByRole("button", { name: "Pay Now", exact: true });
  await pay.waitFor({ timeout: 45000 });
  const fields = await page.locator("#checkoutWidget input").evaluateAll((inputs) =>
    inputs
      .map((input) => ({
        name: input.name.toLowerCase(),
        value: input.value,
        readOnly: input.readOnly,
      }))
      .filter((input) => ["firstname", "lastname", "email", "amount"].includes(input.name)),
  );
  assert.equal(fields.find((field) => field.name === "firstname").value, "Test");
  assert.equal(fields.find((field) => field.name === "lastname").value, "Guest");
  assert.equal(fields.find((field) => field.name === "email").value, "test@example.com");
  assert.equal(
    Number(fields.find((field) => field.name === "amount").value.replace(/[^\d.]/g, "")),
    498,
  );
  assert.equal(fields.find((field) => field.name === "amount").readOnly, true);
  await page.getByRole("link", { name: "Back to guest details", exact: true }).click();
  await page
    .getByRole("heading", { name: "Your sample details are ready.", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Edit details", exact: true }).click();
  assert.equal(await page.locator("input[name=firstName]").inputValue(), "Test");
  assert.equal(await page.locator("input[name=email]").inputValue(), "test@example.com");
  await page.locator("input[name=firstName]").fill("Updated");
  for (const checkbox of await page.locator("input[type=checkbox][required]").all())
    await checkbox.check();
  await page.getByRole("button", { name: "Review sample details", exact: true }).click();
  await page.getByRole("button", { name: "Continue to payment", exact: true }).click();
  await pay.waitFor({ timeout: 45000 });
  assert.equal(
    await page
      .locator("#checkoutWidget input")
      .evaluateAll(
        (inputs) => inputs.find((input) => input.name.toLowerCase() === "firstname")?.value,
      ),
    "Updated",
    "remount uses edited guest details",
  );
  assert.equal(
    await page.locator("#checkoutWidgetShadowRoot").count(),
    1,
    "one active widget after returning to guest details",
  );
  assert.equal(
    await pay.evaluate((button) => getComputedStyle(button).backgroundColor),
    "rgb(28, 53, 94)",
  );
  assert.equal(
    await page.getByRole("button", { name: "Preview approval", exact: true }).count(),
    0,
  );
  mkdirSync("artifacts/payment", { recursive: true });
  await page.screenshot({ path: "artifacts/payment/checkout-widget-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: "artifacts/payment/checkout-widget-mobile.png", fullPage: true });
  await page.locator("#checkoutWidgetShadowRoot").evaluate((host) => {
    const receipt = document.createElement("div");
    receipt.id = "widget-printable-content";
    receipt.className = "widget-reciept-content";
    host.shadowRoot.appendChild(receipt);
  });
  await page.waitForURL("**/booking/confirmation?**");
  await page.getByRole("heading", { name: "Test payment completed", exact: true }).waitFor();
  await page.locator('[aria-current="step"]').filter({ hasText: "Confirmation" }).waitFor();
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(checkoutUrl.replace("/booking/checkout?", "/booking/payment?"), {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("status").filter({ hasText: "Enter your name and email" }).waitFor();
  await page.locator('#checkoutWidget input[name="firstName" i]').waitFor();
  const emptyFields = await page.locator("#checkoutWidget input").evaluateAll((inputs) =>
    inputs.map((input) => ({
      name: input.name.toLowerCase(),
      value: input.value,
      readOnly: input.readOnly,
    })),
  );
  for (const name of ["firstname", "lastname", "email"]) {
    assert.equal(emptyFields.find((field) => field.name === name).value, "");
    assert.equal(emptyFields.find((field) => field.name === name).readOnly, false);
  }
  const amountField = emptyFields.find((field) => field.name === "amount");
  assert.equal(Number(amountField.value.replace(/[^\d.]/g, "")), 498);
  assert.equal(amountField.readOnly, true);
  // Simulate only the SDK's displayed receipt. Never submit a payment or read a card field.
  const paymentUrl = page.url();
  await page.locator("#checkoutWidgetShadowRoot").evaluate((host) => {
    const failed = document.createElement("div");
    failed.textContent = "Payment Failed";
    host.shadowRoot.appendChild(failed);
  });
  assert.equal(page.url(), paymentUrl, "failure text must not advance checkout");
  await page.locator("#checkoutWidgetShadowRoot").evaluate((host) => {
    const receipt = document.createElement("div");
    receipt.id = "widget-printable-content";
    receipt.className = "widget-reciept-content";
    host.shadowRoot.appendChild(receipt);
  });
  await page.waitForURL("**/booking/confirmation?**");
  await page.getByRole("heading", { name: "Test payment completed", exact: true }).waitFor();
  await page.locator('[aria-current="step"]').filter({ hasText: "Confirmation" }).waitFor();
  assert.match(await page.locator("main").innerText(), /No hotel reservation was created/);
  await page.evaluate(() => sessionStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: "No test payment result to display", exact: true })
    .waitFor();
  console.log(
    "Guest review → checkout widget passed: guest prefill, locked USD 498 amount, HMS styling and mobile layout. No payment submitted.",
  );
} catch (error) {
  if (page) {
    mkdirSync("artifacts/payment", { recursive: true });
    await page
      .screenshot({ path: "artifacts/payment/checkout-failure.png", fullPage: true })
      .catch(() => {});
  }
  if (page)
    console.error({
      url: page.url(),
      text: (await page.locator("body").innerText()).slice(0, 2400),
    });
  throw error;
} finally {
  await browser.close();
}
