"use client";
import { useEffect, useRef, useState } from "react";
import { WandSparkles } from "lucide-react";
import { useEditor } from "./editor-fields";
import { extractLogoPalette } from "../src/lib/branding/logoPalette";

export function LogoPaletteButton({
  label = "Use logo colors",
  onGenerated,
}: {
  label?: string;
  onGenerated?: () => void;
}) {
  const { content, update, notify, analyzeLogo } = useEditor();
  const [busy, setBusy] = useState(false);
  const branding = content.hotel.branding;
  const latestBranding = useRef(branding);
  useEffect(() => {
    latestBranding.current = branding;
  }, [branding]);
  const logo = branding.logoUrl || branding.logoDarkUrl || branding.logoLightUrl;
  async function generate() {
    if (!logo) return;
    setBusy(true);
    try {
      const palette = await (analyzeLogo ?? extractLogoPalette)(logo);
      const current = latestBranding.current;
      if ((current.logoUrl || current.logoDarkUrl || current.logoLightUrl) !== logo)
        throw new Error("The logo changed. Generate colors again for the new logo.");
      update(["hotel", "branding"], { ...current, ...palette });
      onGenerated?.();
      notify("Logo colors applied to this draft. You can adjust them below.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Logo colors could not be generated.", true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      className="wm-button wm-button-small"
      onClick={generate}
      disabled={!logo || busy}
      title={!logo ? "Add a logo first." : undefined}
    >
      <WandSparkles size={15} />
      {busy ? "Reading logo…" : label}
    </button>
  );
}
