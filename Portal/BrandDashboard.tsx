"use client";

import { useState } from "react";
import { Image, Palette, Type, Sparkles, PanelsTopLeft } from "lucide-react";
import { HeaderSettings } from "./HeaderSettings";
import { BrandColors } from "./BrandColors";
import { LogoIdentity } from "./LogoIdentity";
import { AppearanceControls } from "./AppearanceControls";
import { TypographyControls } from "./TypographyControls";

const tabs = [
  { key: "identity", label: "Brand identity", icon: Image },
  { key: "colors", label: "Colors", icon: Palette },
  { key: "typography", label: "Typography", icon: Type },
  { key: "experience", label: "Experience", icon: Sparkles },
  { key: "header", label: "Header", icon: PanelsTopLeft },
];

export function BrandDashboard() {
  const [tab, setTab] = useState("identity");
  return (
    <div className="wm-brand-dashboard">
      <nav className="wm-brand-tabs" aria-label="Branding controls" role="tablist">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            role="tab"
            id={`wm-tab-${key}`}
            aria-controls={`wm-brand-${key}`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.key === key);
              const next =
                event.key === "ArrowRight"
                  ? (index + 1) % tabs.length
                  : event.key === "ArrowLeft"
                    ? (index + tabs.length - 1) % tabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                setTab(tabs[next].key);
                document.getElementById(`wm-tab-${tabs[next].key}`)?.focus();
              }
            }}
            onClick={() => {
              setTab(key);
            }}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div
        id="wm-brand-identity"
        role="tabpanel"
        aria-labelledby="wm-tab-identity"
        hidden={tab !== "identity"}
      >
        <LogoIdentity />
      </div>
      <div
        id="wm-brand-colors"
        role="tabpanel"
        aria-labelledby="wm-tab-colors"
        hidden={tab !== "colors"}
      >
        <BrandColors />
      </div>
      <div
        id="wm-brand-typography"
        role="tabpanel"
        aria-labelledby="wm-tab-typography"
        hidden={tab !== "typography"}
      >
        <TypographyControls />
      </div>
      <div
        id="wm-brand-header"
        role="tabpanel"
        aria-labelledby="wm-tab-header"
        hidden={tab !== "header"}
      >
        <HeaderSettings />
      </div>
      <div
        id="wm-brand-experience"
        role="tabpanel"
        aria-labelledby="wm-tab-experience"
        hidden={tab !== "experience"}
      >
        <AppearanceControls />
      </div>
    </div>
  );
}
