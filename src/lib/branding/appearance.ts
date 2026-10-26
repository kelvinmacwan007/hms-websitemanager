import type { CSSProperties } from "react";
import type { HotelBranding } from "../../types/hotel";

export function appearanceVariables(branding: HotelBranding): CSSProperties {
  const radius = Math.max(0, Math.min(24, branding.cornerRadius ?? 12));
  const button = { square: 0, soft: 6, rounded: 12, pill: 999 }[branding.buttonStyle ?? "rounded"];
  const image = { natural: 0, soft: 8, rounded: 20, editorial: 0 }[
    branding.imageStyle ?? "natural"
  ];
  return {
    "--website-radius": `${radius}px`,
    "--website-button-radius": `${button}px`,
    "--website-image-radius": `${image}px`,
    "--website-image-ratio": branding.imageStyle === "editorial" ? "4 / 5" : "auto",
    "--website-heading-spacing":
      branding.websiteStyle === "modern"
        ? "-0.04em"
        : branding.websiteStyle === "boutique"
          ? "0.025em"
          : "-0.015em",
    "--website-section-space":
      branding.websiteStyle === "minimal"
        ? "88px"
        : branding.websiteStyle === "luxury"
          ? "80px"
          : "64px",
  } as CSSProperties;
}
