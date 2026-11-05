import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

function fixture({
  enabled = true,
  allowed = true,
  available = true,
  currency = "USD",
  fail = false,
} = {}) {
  let tenantReads = 0;
  let parsed;
  let selected;
  const tenant = { id: "trusted-property" };
  const hotel = { configured: true, bookingSettings: {}, timeZone: "UTC" };
  const modules = {
    "@/lib/tenant/resolveTenant": {
      resolveTenant: async () => {
        tenantReads++;
        return tenant;
      },
    },
    "@/lib/api/provider": {
      getWebsiteProvider: () => ({
        getHotel: async (scope) => {
          assert.equal(scope, tenant);
          if (fail) throw new Error("secret upstream error");
          return hotel;
        },
        searchAvailability: async (scope) => {
          assert.equal(scope, tenant);
          return [];
        },
      }),
    },
    "@/lib/booking/search": {
      parseAvailabilitySearch: (params) => {
        parsed = params;
        return { search: {} };
      },
    },
    "@/lib/booking/demoSelection": {
      resolveDemoSelection: (params) => {
        selected = params;
        return available ? { estimate: 498, currency } : null;
      },
    },
    "@/lib/payment/p98payConfig": { getCheckoutWidgetConfig: () => (enabled ? {} : null) },
    "@/lib/website/pages": { pageEnabled: () => true },
    "@/lib/api/rateLimit": {
      allowRequest: (key) => {
        assert.equal(key, "test-payment:trusted-property");
        return allowed;
      },
    },
  };
  const output = ts.transpileModule(readFileSync("src/app/booking/checkout/actions.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => {
    assert.ok(modules[name], name);
    return modules[name];
  }, exports);
  return {
    run: exports.prepareTestPayment,
    reads: () => tenantReads,
    params: () => ({ parsed, selected }),
  };
}

test("inline payment uses the server amount and preserves multi-room/add-on selections", async () => {
  const f = fixture();
  assert.deepEqual(
    await f.run("amount=1&propertyId=attacker&item=a&item=b&addon=x&addon=y&extra=e&extra=f"),
    { amount: 498, currency: "USD" },
  );
  assert.deepEqual(f.params().parsed.item, ["a", "b"]);
  assert.deepEqual(f.params().selected.addon, ["x", "y"]);
  assert.deepEqual(f.params().selected.extra, ["e", "f"]);
});

test("disabled UAT and oversized input are rejected before tenant or provider reads", async () => {
  for (const [f, query] of [
    [fixture({ enabled: false }), "room=a"],
    [fixture(), "x".repeat(8001)],
  ]) {
    assert.ok((await f.run(query)).error);
    assert.equal(f.reads(), 0);
  }
});

test("unavailable inventory, incompatible currency and rate limits cannot prepare payment", async () => {
  for (const options of [{ available: false }, { currency: "INR" }, { allowed: false }]) {
    assert.ok((await fixture(options).run("room=a")).error);
  }
});

test("upstream failures return a retryable message without leaking service details", async () => {
  const result = await fixture({ fail: true }).run("room=a");
  assert.match(result.error, /try again/);
  assert.doesNotMatch(result.error, /secret/);
});
