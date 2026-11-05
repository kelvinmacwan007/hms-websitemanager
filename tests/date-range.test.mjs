import assert from "node:assert/strict";
import test from "node:test";
import { canSelectStayDate } from "../src/lib/booking/dateRange.ts";

const limits = { minArrival: "2026-10-29", maxArrival: "2026-11-30", minStay: 2, maxStay: 5 };

test("range arrivals respect the advance booking window", () => {
  assert.equal(canSelectStayDate("2026-10-28", "", "start", limits), false);
  assert.equal(canSelectStayDate("2026-10-29", "", "start", limits), true);
  assert.equal(canSelectStayDate("2026-12-01", "", "start", limits), false);
});

test("range departures respect minimum and maximum nights across months", () => {
  assert.equal(canSelectStayDate("2026-10-31", "2026-10-30", "end", limits), false);
  assert.equal(canSelectStayDate("2026-11-01", "2026-10-30", "end", limits), true);
  assert.equal(canSelectStayDate("2026-11-04", "2026-10-30", "end", limits), true);
  assert.equal(canSelectStayDate("2026-11-05", "2026-10-30", "end", limits), false);
  assert.equal(canSelectStayDate("2026-12-02", "2026-11-30", "end", limits), true);
});

test("choosing an earlier departure restarts the arrival without permitting past dates", () => {
  assert.equal(canSelectStayDate("2026-10-29", "2026-11-03", "end", limits), true);
  assert.equal(canSelectStayDate("2026-10-28", "2026-11-03", "end", limits), false);
});
