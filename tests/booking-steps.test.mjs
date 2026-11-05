import assert from "node:assert/strict";
import test from "node:test";
import { BOOKING_STEPS, bookingStepHref } from "../src/lib/booking/steps.ts";
test("booking step links retain room, party, services and preview parameters", () => {
  const query = new URLSearchParams({
    checkIn: "2026-11-01",
    checkOut: "2026-11-03",
    adults: "2",
    rooms: "1",
    __website_preview: "draft",
  });
  query.append("item", JSON.stringify(["family", "bar", 1]));
  query.append("addon", JSON.stringify(["parking", 2]));
  assert.equal(BOOKING_STEPS.length, 5);
  for (const [step, path] of [
    [1, "cart"],
    [2, "extras"],
    [3, "checkout"],
    [4, "payment"],
    [5, "confirmation"],
  ]) {
    const href = new URL(bookingStepHref(step, query.toString()), "https://hotel.example");
    assert.equal(href.pathname, `/booking/${path}`);
    assert.deepEqual([...href.searchParams], [...query]);
  }
  assert.equal(
    new URL(bookingStepHref(1, "room=family&rate=bar"), "https://hotel.example").pathname,
    "/booking/preview",
  );
});
