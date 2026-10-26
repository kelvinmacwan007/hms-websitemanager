"use client";
/* eslint-disable @next/next/no-img-element */
import { Field, Toggle, useEditor } from "./editor-fields";
import { Paintbrush, Check, Info } from "lucide-react";
import { safeImageUrl } from "./content";
import type { HotelBranding } from "../src/types/hotel";

const styles: {
  name: string;
  value: NonNullable<HotelBranding["websiteStyle"]>;
  font: string;
  button: NonNullable<HotelBranding["buttonStyle"]>;
  image: NonNullable<HotelBranding["imageStyle"]>;
  radius: number;
}[] = [
  { name: "Luxury", value: "luxury", font: "Georgia", button: "soft", image: "natural", radius: 8 },
  { name: "Modern", value: "modern", font: "Arial", button: "rounded", image: "soft", radius: 12 },
  {
    name: "Minimal",
    value: "minimal",
    font: "Arial",
    button: "square",
    image: "natural",
    radius: 0,
  },
  {
    name: "Classic",
    value: "classic",
    font: "Times New Roman",
    button: "soft",
    image: "soft",
    radius: 6,
  },
  {
    name: "Resort",
    value: "resort",
    font: "Georgia",
    button: "pill",
    image: "rounded",
    radius: 20,
  },
  {
    name: "Boutique",
    value: "boutique",
    font: "Georgia",
    button: "rounded",
    image: "editorial",
    radius: 12,
  },
];
export function AppearanceControls() {
  const { content, update } = useEditor();
  const brand = content.hotel.branding;
  const photos = [
    ...(content.hotel.heroSlides || []),
    ...(content.hotel.heroImage ? [content.hotel.heroImage] : []),
    ...content.hotel.rooms.flatMap((room) => room.images),
    ...content.hotel.gallery,
  ].filter((image) => safeImageUrl(image.url));
  return (
    <section className="wm-experience-design">
      <header className="wm-design-heading">
        <span className="wm-design-heading-icon">
          <Paintbrush size={28} />
        </span>
        <div>
          <h2>Experience & style</h2>
          <p>Start with a style, then make it your own.</p>
        </div>
      </header>
      <span className="wm-small-label">Website style</span>
      <div className="wm-experience-style-grid">
        {styles.map((style, index) => (
          <button
            type="button"
            key={style.value}
            aria-label={style.name}
            aria-pressed={(brand.websiteStyle ?? "luxury") === style.value}
            onClick={() =>
              update(["hotel", "branding"], {
                ...brand,
                websiteStyle: style.value,
                fontHeading: style.font,
                buttonStyle: style.button,
                imageStyle: style.image,
                cornerRadius: style.radius,
              })
            }
          >
            <div
              className={`wm-experience-style-mini wm-experience-style-${style.value}`}
              style={{ fontFamily: style.font }}
            >
              <i />
              <span className="wm-mini-menu">
                <i />
                <i />
                <i />
                <i />
              </span>
              <strong>
                A stay
                <br />
                to remember.
              </strong>
              <span className="wm-mini-cta" />
              {photos.length > 0 && (
                <img src={safeImageUrl(photos[index % photos.length].url)} alt="" />
              )}
              <div className="wm-mini-footer">
                <i />
                <i />
                <i />
              </div>
            </div>
            {(brand.websiteStyle ?? "luxury") === style.value && (
              <span className="wm-experience-selected">
                <Check size={18} />
              </span>
            )}
            <span>{style.name}</span>
          </button>
        ))}
      </div>
      <p className="wm-experience-note">
        <Info size={20} />
        <span>Styles coordinate fonts and shapes. Your hotel colors and content stay yours.</span>
      </p>
      <div className="wm-two-columns">
        <Field
          label="Button style"
          path={["hotel", "branding", "buttonStyle"]}
          options={["square", "soft", "rounded", "pill"].map((value) => ({
            value,
            label: value[0].toUpperCase() + value.slice(1),
          }))}
        />
        <Field
          label="Image style"
          path={["hotel", "branding", "imageStyle"]}
          options={[
            { value: "natural", label: "Natural" },
            { value: "soft", label: "Soft corners" },
            { value: "rounded", label: "Rounded" },
            { value: "editorial", label: "Editorial" },
          ]}
        />
      </div>
      <label className="wm-radius-control">
        Corner radius <span>{brand.cornerRadius ?? 12}px</span>
        <input
          type="range"
          min="0"
          max="24"
          value={brand.cornerRadius ?? 12}
          style={{
            background: `linear-gradient(to right, var(--wm-brand-navy) ${((brand.cornerRadius ?? 12) / 24) * 100}%, #e3e7ee ${((brand.cornerRadius ?? 12) / 24) * 100}%)`,
          }}
          onChange={(event) =>
            update(["hotel", "branding", "cornerRadius"], Number(event.target.value))
          }
        />
        <small>
          Sharp <span>Rounded</span>
        </small>
      </label>
      <div className="wm-field">
        <label htmlFor="wm-animation-style">Animation style</label>
        <select
          id="wm-animation-style"
          value={brand.motion?.preset ?? "calm"}
          onChange={(event) =>
            update(["hotel", "branding", "motion"], {
              ...brand.motion,
              preset: event.target.value,
            })
          }
        >
          <option value="off">None</option>
          <option value="calm">Subtle</option>
          <option value="expressive">Dynamic</option>
        </select>
      </div>
      <Toggle
        label="Smooth scrolling"
        path={["hotel", "branding", "motion", "smoothScroll"]}
        hint="A gentle transition as guests move through your website."
      />
    </section>
  );
}
