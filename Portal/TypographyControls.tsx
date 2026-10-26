"use client";
import { useRef } from "react";
import { RotateCcw } from "lucide-react";
import { Field, useEditor } from "./editor-fields";

const fontNotes: Record<string, string> = {
  Georgia: "Elegant & timeless",
  Arial: "Clean & readable",
  "Times New Roman": "Traditional & refined",
  Verdana: "Clear & welcoming",
  "Trebuchet MS": "Friendly & modern",
};
export function TypographyControls() {
  const { content, update } = useEditor();
  const initial = useRef({ ...content.hotel.branding });
  const brand = content.hotel.branding;
  const heading = brand.fontHeading || "Georgia";
  const body = brand.fontBody || "Arial";
  return (
    <section className="wm-typography-design">
      <header className="wm-design-heading">
        <span className="wm-design-heading-icon wm-type-heading-icon">Aa</span>
        <div>
          <h2>Typography</h2>
          <p>Choose fonts for your website to match your brand style.</p>
        </div>
        <button
          type="button"
          className="wm-button"
          onClick={() =>
            update(["hotel", "branding"], {
              ...brand,
              fontHeading: initial.current.fontHeading,
              fontBody: initial.current.fontBody,
            })
          }
        >
          <RotateCcw size={18} />
          Reset fonts
        </button>
      </header>
      <div className="wm-type-font-cards">
        {[
          {
            label: "Heading font",
            field: "fontHeading",
            font: heading,
            note: "Used for main titles and section headings.",
            fonts: ["Georgia", "Times New Roman", "Arial", "Verdana", "Trebuchet MS"],
          },
          {
            label: "Body font",
            field: "fontBody",
            font: body,
            note: "Used for paragraphs, buttons and general text.",
            fonts: ["Arial", "Verdana", "Trebuchet MS", "Georgia"],
          },
        ].map((item) => (
          <section className="wm-type-font-card" key={item.field}>
            <h3>{item.label}</h3>
            <p>{item.note}</p>
            <Field
              label={item.label}
              path={["hotel", "branding", item.field]}
              options={item.fonts}
            />
            <div className="wm-type-font-sample">
              <b style={{ fontFamily: item.font }}>Aa</b>
              <div>
                <strong style={{ fontFamily: item.font }}>{item.font}</strong>
                <small>{fontNotes[item.font] || "Your selected font"}</small>
              </div>
              <span>{item.label}</span>
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
