import assert from "node:assert/strict";
import test from "node:test";
import { paletteFromPixels } from "../src/lib/branding/logoPalette.ts";

test("logo palette ignores white backgrounds and transparent pixels", () => {
  const pixels = [
    ...Array(100).fill([255, 255, 255, 255]),
    ...Array(20).fill([0, 80, 160, 255]),
    ...Array(10).fill([240, 120, 20, 255]),
    ...Array(100).fill([255, 0, 0, 0]),
  ].flat();
  assert.deepEqual(paletteFromPixels(pixels), {
    primaryColor: "#0050a0",
    secondaryColor: "#bfd3e7",
    accentColor: "#f07814",
  });
});

test("monochrome logos get a usable neutral palette", () => {
  assert.deepEqual(paletteFromPixels([32, 32, 32, 255]), {
    primaryColor: "#202020",
    secondaryColor: "#c7c7c7",
    accentColor: "#202020",
  });
});

test("empty, transparent and white-only logos cannot silently replace brand colors", () => {
  for (const pixels of [[], [0, 0, 0, 0], [255, 255, 255, 255]])
    assert.throws(() => paletteFromPixels(pixels), /no usable colors/);
});
