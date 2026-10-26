import test from "node:test";
import assert from "node:assert/strict";
import { filterRooms } from "../src/lib/booking/roomFilters.ts";

const rooms = [
  { id: "suite", reviewRating: 4.8, amenities: [{ id: "wifi" }, { id: "pool" }] },
  { id: "double", reviewRating: 3.5, amenities: [{ id: "wifi" }, { id: "pool", enabled: false }] },
  { id: "single", amenities: [] },
];
const all = { amenities: [], types: [], stars: 0 };
test("room filters combine amenities, room types and actual review thresholds", () => {
  assert.equal(filterRooms(rooms, all).length, 3);
  assert.deepEqual(
    filterRooms(rooms, { ...all, amenities: ["wifi"] }).map((room) => room.id),
    ["suite", "double"],
  );
  assert.deepEqual(
    filterRooms(rooms, { ...all, amenities: ["wifi", "pool"] }).map((room) => room.id),
    ["suite"],
  );
  assert.equal(filterRooms(rooms, { ...all, types: ["double"], amenities: ["pool"] }).length, 0);
  assert.deepEqual(
    filterRooms(rooms, { ...all, stars: 4 }).map((room) => room.id),
    ["suite"],
  );
  assert.equal(filterRooms(rooms, { ...all, stars: 5 }).length, 0);
  assert.deepEqual(
    filterRooms(rooms, { ...all, types: ["suite", "single"] }).map((room) => room.id),
    ["suite", "single"],
  );
});

test("bed, capacity and nightly-price filters combine without inventing missing rates", () => {
  const catalogue = [
    { id: "family", bedType: "Twin", occupancy: 4, startingPrice: { amount: 180 }, amenities: [] },
    { id: "double", bedType: "Queen", occupancy: 2, startingPrice: { amount: 120 }, amenities: [] },
    { id: "unknown", bedType: "Queen", occupancy: 2, amenities: [] },
    { id: "zero", bedType: "Single", occupancy: 1, startingPrice: { amount: 0 }, amenities: [] },
  ];
  const ids = (filters) => filterRooms(catalogue, { ...all, ...filters }).map((room) => room.id);
  assert.deepEqual(ids({ beds: ["Queen"] }), ["double", "unknown"]);
  assert.deepEqual(ids({ guests: [3] }), ["family"]);
  assert.deepEqual(ids({ guests: [1, 2] }), ["double", "unknown", "zero"]);
  assert.deepEqual(ids({ priceRange: [0, 120] }), ["double", "zero"]);
  assert.deepEqual(ids({ beds: ["Twin"], guests: [3], priceRange: [180, 180] }), ["family"]);
  assert.deepEqual(ids({ beds: ["Queen"], priceRange: [150, 200] }), []);
});
