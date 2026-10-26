import type { CSSProperties } from "react";
import type { HotelBranding } from "@/types/hotel";
import { appearanceVariables } from "./appearance.ts";

type Rgb = { r: number; g: number; b: number };

const DEFAULT_PRIMARY = "#173b3f";
const DEFAULT_ACCENT = "#b38b59";

function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${[r, g, b]
    .map((v) =>
      Math.max(0, Math.min(255, Math.round(v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function mix(color: string, target: string, weight: number) {
  const a = hexToRgb(color) ?? hexToRgb(DEFAULT_PRIMARY)!;
  const b = hexToRgb(target) ?? hexToRgb(DEFAULT_PRIMARY)!;
  return rgbToHex({
    r: a.r * (1 - weight) + b.r * weight,
    g: a.g * (1 - weight) + b.g * weight,
    b: a.b * (1 - weight) + b.b * weight,
  });
}

function luminance(hex: string) {
  const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_PRIMARY)!;
  const values = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}

function contrast(a: string, b: string) {
  const lighter = Math.max(luminance(a), luminance(b));
  const darker = Math.min(luminance(a), luminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function usableBrandColor(input?: string) {
  const rgb = input ? hexToRgb(input) : null;
  if (!rgb) return DEFAULT_PRIMARY;
  let color = rgbToHex(rgb);
  if (contrast(color, "#f0eee7") < 4.5) color = mix(color, "#102a2d", 0.5);
  if (contrast(color, "#f0eee7") < 4.5) color = DEFAULT_PRIMARY;
  return color;
}

// Preserve the accent hue where possible, but measure against its actual surface.
function accentOnBrand(accent: string, background: string) {
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(accent, "#ffffff", step / 100);
    if (contrast(candidate, background) >= 4.5) return candidate;
  }
  return "#ffffff";
}

function textOn(background: string) {
  return contrast("#000000", background) >= contrast("#ffffff", background) ? "#000000" : "#ffffff";
}

function accentOnLight(accent: string) {
  for (let step = 0; step <= 100; step++) {
    const candidate = mix(accent, "#000000", step / 100);
    if (contrast(candidate, "#faf9f6") >= 4.5) return candidate;
  }
  return "#000000";
}

export function createTheme(branding: HotelBranding) {
  const primary = usableBrandColor(branding.primaryColor);
  const accentInput = branding.accentColor ?? branding.secondaryColor ?? DEFAULT_ACCENT;
  const accent = hexToRgb(accentInput) ? accentInput : DEFAULT_ACCENT;
  const secondary =
    branding.secondaryColor && hexToRgb(branding.secondaryColor)
      ? branding.secondaryColor
      : primary;
  const accentRgb = hexToRgb(accent)!;
  const primaryRgb = hexToRgb(primary)!;

  return {
    ...appearanceVariables(branding),
    "--color-brand": primary,
    "--color-brand-hover": mix(primary, "#000000", 0.12),
    "--color-brand-dark": mix(primary, "#000000", 0.38),
    "--color-brand-soft": mix(primary, "#ffffff", 0.88),
    "--color-brand-rgb": `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`,
    "--color-brand-glow": `rgba(${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}, 0.12)`,
    "--color-accent": accent,
    "--color-on-accent": textOn(accent),
    "--color-on-accent-hover": textOn(mix(accent, "#ffffff", 0.18)),
    "--color-accent-on-brand": accentOnBrand(accent, primary),
    "--color-accent-text": accentOnLight(accent),
    "--color-accent-light": mix(accent, "#ffffff", 0.18),
    "--color-accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`,
    "--color-accent-glow": `rgba(${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}, 0.2)`,
    "--color-accent-soft": mix(accent, "#ffffff", 0.85),
    "--color-secondary": secondary,
    "--color-secondary-text": usableBrandColor(secondary),
    "--color-surface": "#ffffff",
    "--color-surface-elevated": "#ffffff",
    "--color-text": "#202725",
    "--color-text-muted": "#5e6a67",
    "--color-border": "rgba(32, 39, 37, 0.16)",
    "--color-success": "#2e6d4d",
    "--color-warning": "#a46c20",
    "--color-error": "#b4423a",
    "--font-display": branding.fontHeading ?? "var(--font-hotel-heading), Georgia, serif",
    "--font-sans": branding.fontBody ?? "var(--font-hotel-body), Arial, sans-serif",
  } as CSSProperties;
}
