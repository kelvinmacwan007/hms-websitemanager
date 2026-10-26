import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

test("live payment simulation requires an explicit development flag and stays off in production", () => {
  const { outputText } = ts.transpileModule(readFileSync("src/lib/payment/demoMode.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const exports = {};
  new Function("require", "exports", outputText)(() => ({ isMockMode: () => false }), exports);
  const original = { node: process.env.NODE_ENV, flag: process.env.WEBSITE_DEMO_PAYMENTS };
  try {
    process.env.NODE_ENV = "development";
    delete process.env.WEBSITE_DEMO_PAYMENTS;
    assert.equal(exports.isDemoPaymentMode(), false);
    process.env.WEBSITE_DEMO_PAYMENTS = "true";
    assert.equal(exports.isDemoPaymentMode(), true);
    process.env.NODE_ENV = "production";
    assert.equal(exports.isDemoPaymentMode(), false);
  } finally {
    if (original.node === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.node;
    if (original.flag === undefined) delete process.env.WEBSITE_DEMO_PAYMENTS;
    else process.env.WEBSITE_DEMO_PAYMENTS = original.flag;
  }
});
