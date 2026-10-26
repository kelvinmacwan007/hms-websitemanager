"use client";
import { useEffect } from "react";
import { createTheme } from "@/lib/branding/theme";
import type { HotelBranding } from "@/types/hotel";

export function WebsitePreviewBridge({ token }: { token: string }) {
  useEffect(() => {
    const update = (event: MessageEvent) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "patel-website-theme"
      )
        return;
      const brand = event.data.branding as HotelBranding;
      if (!brand || typeof brand !== "object") return;
      for (const [key, value] of Object.entries(createTheme(brand)))
        document.documentElement.style.setProperty(key, String(value));
      if (
        brand.websiteStyle ||
        brand.buttonStyle ||
        brand.imageStyle ||
        brand.cornerRadius !== undefined
      )
        document.documentElement.dataset.websiteAppearance = "custom";
      else delete document.documentElement.dataset.websiteAppearance;
    };
    const navigate = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest<HTMLAnchorElement>("a[href]");
      if (
        !anchor ||
        anchor.target === "_blank" ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const destination = new URL(anchor.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname.startsWith("/api/") ||
        destination.pathname.startsWith("/website-manager")
      )
        return;
      destination.searchParams.set("__website_preview", token);
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(destination.href);
    };
    window.addEventListener("message", update);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("message", update);
      document.removeEventListener("click", navigate, true);
    };
  }, [token]);
  return null;
}
