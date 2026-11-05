import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { checkoutWidgetOptions } from "../src/lib/payment/p98pay.ts";
import { readCheckoutGuest, saveCheckoutGuest } from "../src/lib/payment/checkoutGuest.ts";
import {
  isReportedUatSuccess,
  hasReportedUatReceipt,
  readUatReceipt,
  saveUatReceipt,
} from "../src/lib/payment/uatReceipt.ts";

test("only explicit UAT success or authorization results qualify for demo navigation", () => {
  for (const value of [
    { success: true },
    { transactionStatus: "Authorized" },
    { TransactionStatus: 16 },
  ])
    assert.equal(isReportedUatSuccess(value), true);
  for (const value of [
    null,
    {},
    { success: false },
    { transactionStatus: "Pending" },
    { success: true, transactionStatus: "Failed" },
    { TransactionStatus: 5 },
  ])
    assert.equal(isReportedUatSuccess(value), false);
  assert.equal(hasReportedUatReceipt({ querySelector: () => null }), false);
  assert.equal(
    hasReportedUatReceipt({
      querySelector: (selector) => (selector.startsWith("#widget-printable-content") ? {} : null),
    }),
    true,
  );
});

test("UAT confirmation is tab and stay scoped, stores no provider payload and expires", () => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const data = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  });
  try {
    assert.equal(readUatReceipt("Hotel", "room=a&uat=1"), null);
    saveUatReceipt("Hotel", "room=a&rate=b", 498);
    assert.equal(readUatReceipt("Hotel", "rate=b&room=a&uat=1").amount, 498);
    assert.equal(readUatReceipt("Other", "room=a&rate=b"), null);
    assert.equal(readUatReceipt("Hotel", "room=c&rate=b"), null);
    const [key, raw] = [...data.entries()][0];
    assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ["amount", "currency", "savedAt"]);
    data.set(
      key,
      JSON.stringify({ amount: 498, currency: "USD", savedAt: Date.now() - 31 * 60_000 }),
    );
    assert.equal(readUatReceipt("Hotel", "room=a&rate=b"), null);
  } finally {
    if (prior) Object.defineProperty(globalThis, "sessionStorage", prior);
    else delete globalThis.sessionStorage;
  }
});

test("P98Pay uses the supplied amount and guest with locked prefill; callbacks never verify payment", () => {
  let responses = 0;
  const options = checkoutWidgetOptions(
    498,
    { firstName: "Test", lastName: "Guest", email: "test@example.com" },
    () => responses++,
  );
  assert.deepEqual(options.fieldsValue, [
    { name: "firstName", value: "Test", isReadOnly: true },
    { name: "lastname", value: "Guest", isReadOnly: true },
    { name: "email", value: "test@example.com", isReadOnly: true },
    { name: "amount", value: "498.00", isReadOnly: true },
  ]);
  options.events[0].onAfterSubmit({ success: true, amount: 1, reservationId: "untrusted" });
  assert.equal(responses, 1);
  assert.equal("paymentVerified" in options, false);
  assert.equal(options.showSinglePage, false);
  for (const amount of [0, -1, NaN, Infinity])
    assert.throws(() =>
      checkoutWidgetOptions(amount, { firstName: "", lastName: "", email: "" }, () => {}),
    );
});

test("hosted UAT requires explicit opt-in and stays unavailable outside demo checkout", () => {
  const source = readFileSync("src/lib/payment/p98payConfig.ts", "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  let demo = true;
  const exports = {};
  new Function("require", "exports", output)(
    (name) => (name === "server-only" ? {} : { isDemoPaymentMode: () => demo }),
    exports,
  );
  const prior = process.env.NODE_ENV;
  const priorDemo = process.env.WEBSITE_DEMO_PAYMENTS;
  try {
    delete process.env.WEBSITE_DEMO_PAYMENTS;
    process.env.NODE_ENV = "production";
    assert.equal(exports.getCheckoutWidgetConfig(), null);
    process.env.WEBSITE_DEMO_PAYMENTS = "false";
    assert.equal(exports.getCheckoutWidgetConfig(), null);
    process.env.WEBSITE_DEMO_PAYMENTS = "true";
    assert.equal(exports.getCheckoutWidgetConfig().environment, "uat");
    demo = false;
    assert.equal(exports.getCheckoutWidgetConfig(), null);
    demo = true;
    delete process.env.WEBSITE_DEMO_PAYMENTS;
    process.env.NODE_ENV = "development";
    assert.equal(exports.getCheckoutWidgetConfig().environment, "uat");
    demo = false;
    assert.equal(exports.getCheckoutWidgetConfig(), null);
  } finally {
    if (prior === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prior;
    if (priorDemo === undefined) delete process.env.WEBSITE_DEMO_PAYMENTS;
    else process.env.WEBSITE_DEMO_PAYMENTS = priorDemo;
  }
});

test("staging checkout opt-in works with a production Node runtime and real API provider", () => {
  const output = ts.transpileModule(readFileSync("src/lib/payment/demoMode.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)(() => ({ isMockMode: () => false }), exports);
  const prior = process.env.WEBSITE_DEMO_PAYMENTS;
  const priorNode = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = "production";
    delete process.env.WEBSITE_DEMO_PAYMENTS;
    assert.equal(exports.isDemoPaymentMode(), false);
    process.env.WEBSITE_DEMO_PAYMENTS = "true";
    assert.equal(exports.isDemoPaymentMode(), true);
    process.env.WEBSITE_DEMO_PAYMENTS = "false";
    assert.equal(exports.isDemoPaymentMode(), false);
  } finally {
    if (prior === undefined) delete process.env.WEBSITE_DEMO_PAYMENTS;
    else process.env.WEBSITE_DEMO_PAYMENTS = prior;
    if (priorNode === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorNode;
  }
});

test("checkout prefill is tab-scoped, selection-scoped, minimal and expires", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  const data = new Map();
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
  });
  try {
    saveCheckoutGuest("Hotel", "room=a&rate=b", {
      firstName: "Test",
      lastName: "Guest",
      email: "test@example.com",
      cardNumber: "must-not-store",
      address: "must-not-store",
    });
    const stored = JSON.parse([...data.values()][0]);
    assert.deepEqual(Object.keys(stored).sort(), ["email", "firstName", "lastName", "savedAt"]);
    assert.equal(readCheckoutGuest("Hotel", "rate=b&room=a").firstName, "Test");
    assert.equal(readCheckoutGuest("Other hotel", "room=a&rate=b").firstName, "");
    assert.equal(readCheckoutGuest("Hotel", "room=c&rate=b").firstName, "");
    const key = [...data.keys()][0];
    data.set(key, JSON.stringify({ ...stored, savedAt: Date.now() - 31 * 60000 }));
    assert.equal(readCheckoutGuest("Hotel", "room=a&rate=b").firstName, "");
    assert.equal(data.has(key), false);
    data.set(key, "malformed");
    assert.equal(readCheckoutGuest("Hotel", "room=a&rate=b").firstName, "");
  } finally {
    if (original) Object.defineProperty(globalThis, "sessionStorage", original);
    else delete globalThis.sessionStorage;
  }
});
