"use client";
import { useRef, useState } from "react";
import { Check, WandSparkles, Plus, Copy, RotateCcw, Clock, Info } from "lucide-react";
import { ColorField, useEditor } from "./editor-fields";
import { LogoPaletteButton } from "./LogoPaletteButton";

const identityPalettes = [
  {
    name: "Luxury Burgundy",
    note: "Elegant & timeless",
    colors: ["#7a1f2b", "#c05572", "#e9b4c2", "#4a0d1a"],
  },
  {
    name: "Coastal Blue",
    note: "Relaxed & refreshing",
    colors: ["#0e3a5f", "#3b82f6", "#9cc4f5", "#e6f2ff"],
  },
  {
    name: "Resort Green",
    note: "Nature inspired",
    colors: ["#0f5132", "#22c55e", "#9ee3b1", "#e9f8ee"],
  },
  {
    name: "Modern Charcoal",
    note: "Sleek & professional",
    colors: ["#1f2937", "#475569", "#94a3b8", "#e5e7eb"],
  },
  {
    name: "Warm Hospitality",
    note: "Welcoming & cozy",
    colors: ["#a45a2b", "#f59e0b", "#f9d5b1", "#fff3e8"],
  },
  {
    name: "Classic Gold",
    note: "Premium & sophisticated",
    colors: ["#b8860b", "#d4af37", "#f7e7b5", "#fff8e6"],
  },
];

export function BrandColors() {
  const { content, update, notify } = useEditor();
  const [custom, setCustom] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>();
  const original = useRef({ ...content.hotel.branding });
  const brand = content.hotel.branding;
  const swatches = [
    { label: "Primary", color: brand.primaryColor || "#173b3f" },
    { label: "Secondary", color: brand.secondaryColor || "#d6c4a4" },
    { label: "Accent", color: brand.accentColor || "#b38b59" },
    { label: "Light", color: "#faf9f6" },
    { label: "Dark", color: "#202725" },
  ];
  return (
    <div className="wm-colors-design">
      <section className="wm-color-generate-card">
        <div className="wm-color-generate-banner">
          <span className="wm-color-generate-icon">
            <WandSparkles size={30} />
          </span>
          <div>
            <h3>Generate colors from logo</h3>
            <p>Create a matching color palette from your hotel logo.</p>
          </div>
          <LogoPaletteButton
            label="Generate palette"
            onGenerated={() => setGeneratedAt(new Date().toISOString())}
          />
        </div>
      </section>
      <section className="wm-colors-main-card">
        <header className="wm-current-palette-heading">
          <div>
            <h3>Current palette</h3>
            <p>Generate a matching palette from your logo.</p>
          </div>
          {generatedAt && (
            <span className="wm-palette-generated">
              <Clock size={20} />
              <span>
                Last generated
                <time dateTime={generatedAt}>
                  {new Date(generatedAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </span>
            </span>
          )}
        </header>
        <div className="wm-current-swatches">
          {swatches.map(({ label, color }) => (
            <div className="wm-current-swatch" key={label}>
              <span className="wm-current-color" style={{ background: color }} />
              <div>
                <strong>{color.toUpperCase()}</strong>
                <button
                  type="button"
                  className="wm-copy-swatch"
                  aria-label={`Copy ${label} HEX`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(color.toUpperCase());
                      notify(`${label} color copied.`);
                    } catch {
                      notify("Copy is unavailable. Select and copy the HEX value.", true);
                    }
                  }}
                >
                  <Copy size={17} />
                </button>
              </div>
              <small>{label}</small>
            </div>
          ))}
        </div>
        <section className="wm-suggested-palettes">
          <header className="wm-suggested-heading">
            <div>
              <h3>Suggested palettes</h3>
              <p>Choose a ready-made palette or customize your own.</p>
            </div>
            <div className="wm-color-preset-actions">
              <button
                type="button"
                className="wm-button"
                aria-expanded={custom}
                aria-controls="wm-custom-palette"
                onClick={() => setCustom(!custom)}
              >
                <Plus size={18} />
                Custom palette
              </button>
              <button
                type="button"
                className="wm-button"
                onClick={() =>
                  update(["hotel", "branding"], {
                    ...brand,
                    primaryColor: original.current.primaryColor,
                    secondaryColor: original.current.secondaryColor,
                    accentColor: original.current.accentColor,
                  })
                }
              >
                <RotateCcw size={17} />
                Reset colors
              </button>
            </div>
          </header>
          <div className="wm-palette-cards">
            {identityPalettes.map((palette) => {
              const selected = palette.colors
                .slice(0, 3)
                .every(
                  (color, index) =>
                    color ===
                    [brand.primaryColor, brand.secondaryColor, brand.accentColor][
                      index
                    ]?.toLowerCase(),
                );
              return (
                <article
                  key={palette.name}
                  className={`wm-palette-card${selected ? " is-selected" : ""}`}
                >
                  <header>
                    <div>
                      <h4>{palette.name}</h4>
                      <p>{palette.note}</p>
                    </div>
                    {selected && (
                      <span className="wm-palette-check" aria-label="Applied palette">
                        <Check size={17} />
                      </span>
                    )}
                  </header>
                  <div className="wm-palette-card-bottom">
                    <div className="wm-palette-tones" aria-label={`${palette.name} color family`}>
                      {palette.colors.map((color, index) => (
                        <div
                          key={color}
                          title={
                            index === 3
                              ? "Supporting tone"
                              : ["Primary", "Secondary", "Accent"][index]
                          }
                        >
                          <i style={{ background: color }} />
                          <small>{color.slice(1).toUpperCase()}</small>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`wm-button${selected ? " wm-button-primary" : ""}`}
                      aria-label={palette.name}
                      aria-pressed={selected}
                      onClick={() =>
                        update(["hotel", "branding"], {
                          ...brand,
                          primaryColor: palette.colors[0],
                          secondaryColor: palette.colors[1],
                          accentColor: palette.colors[2],
                        })
                      }
                    >
                      {selected ? "Applied" : "Apply"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          {!custom && (
            <p className="wm-palette-tone-note">
              Palettes set Primary, Secondary and Accent. Light and Dark use the website defaults.
            </p>
          )}
          {custom && (
            <div id="wm-custom-palette" className="wm-custom-palette">
              <p className="wm-custom-palette-intro">
                Palettes set Primary, Secondary and Accent. Light and Dark use the website defaults.
              </p>
              <div className="wm-custom-color-grid">
                <ColorField
                  variant="card"
                  label="Primary"
                  path={["hotel", "branding", "primaryColor"]}
                  fallback="#173b3f"
                />
                <ColorField
                  variant="card"
                  label="Secondary"
                  path={["hotel", "branding", "secondaryColor"]}
                  fallback="#d6c4a4"
                />
                <ColorField
                  variant="card"
                  label="Accent"
                  path={["hotel", "branding", "accentColor"]}
                  fallback="#b38b59"
                />
              </div>
              <p className="wm-custom-palette-footnote">
                <Info size={21} aria-hidden="true" />
                <span>
                  Colors update the guest preview immediately. Save changes to apply your palette.
                </span>
              </p>
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
