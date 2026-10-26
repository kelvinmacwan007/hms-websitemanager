import test from "node:test";
import assert from "node:assert/strict";
import { selectedAddOnRequests } from "../src/lib/booking/addOnRequests.ts";

test("add-on requests keep known quantities and reject unknown, duplicate or malformed values", () => {
  const items = [{ id: "wifi", name: "Wi-Fi", price: { amount: 10, currency: "USD" } }];
  const selected = selectedAddOnRequests(items, [
    JSON.stringify(["wifi", 3]),
    JSON.stringify(["wifi", 2]),
    JSON.stringify(["unknown", 1]),
    "null",
    "invalid",
    JSON.stringify(["wifi", -1]),
    JSON.stringify(["wifi", 1.5]),
    JSON.stringify(["wifi", 100]),
  ]);
  assert.deepEqual(selected, [{ item: items[0], quantity: 3 }]);
  assert.deepEqual(selectedAddOnRequests(items, undefined), []);
  for (const quantity of [0, -1, 1.5, 100, "2"])
    assert.deepEqual(selectedAddOnRequests(items, JSON.stringify(["wifi", quantity])), []);
});
