import assert from "node:assert/strict";
import test from "node:test";
import { createTheme } from "../src/lib/branding/theme.ts";

test("saved appearance settings reach the public website theme", () => {
  const theme = createTheme({
    websiteStyle: "modern",
    buttonStyle: "pill",
    imageStyle: "rounded",
    cornerRadius: 20,
  });
  assert.equal(theme["--website-button-radius"], "999px");
  assert.equal(theme["--website-radius"], "20px");
  assert.equal(theme["--website-image-radius"], "20px");
  assert.equal(theme["--website-heading-spacing"], "-0.04em");
});

function luminance(hex) {
  const channels = hex
    .slice(1)
    .match(/../g)
    .map((part) => {
      const value = parseInt(part, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function readable(text, background) {
  const a = luminance(text),
    b = luminance(background);
  assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5, `${text} on ${background}`);
}

test("brand text and accent buttons retain contrast across varied hotel palettes", () => {
  const colors = [
    "#000000",
    "#ffffff",
    "#ffff00",
    "#00ffff",
    "#ff00ff",
    "#ff0000",
    "#00ff00",
    "#0000ff",
    "#888888",
    "#893647",
    "#306c73",
  ];
  for (const primaryColor of colors)
    for (const accentColor of colors) {
      const theme = createTheme({ primaryColor, accentColor, secondaryColor: accentColor });
      readable("#ffffff", theme["--color-brand"]);
      readable(theme["--color-brand"], "#faf9f6");
      readable(theme["--color-secondary-text"], "#faf9f6");
      readable(theme["--color-accent-text"], "#faf9f6");
      readable(theme["--color-on-accent"], theme["--color-accent"]);
      readable(theme["--color-on-accent-hover"], theme["--color-accent-light"]);
      readable(theme["--color-accent-on-brand"], theme["--color-brand"]);
    }
});
