"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AMENITY_PRESETS } from "../src/lib/amenities/catalog";
import { AmenityIcon } from "../src/components/amenities/AmenityIcon";
import type { HotelAmenity } from "../src/types/hotel";
import { valueAt, type ContentPath } from "./content";
import { Card, Field, newId, useEditor } from "./editor-fields";

export function AmenitiesEditor({ path = ["hotel", "amenities"] }: { path?: ContentPath }) {
  const { content, update, notify } = useEditor();
  const items = (valueAt(content, path) ?? []) as HotelAmenity[];
  const [opened, setOpened] = useState<string | null>(null);
  function togglePreset(iconKey: string, label: string, enabled: boolean) {
    const index = items.findIndex((item) => item.iconKey === iconKey);
    if (index >= 0) update([...path, index, "enabled"], enabled);
    else if (enabled) {
      if (items.length >= 250) {
        notify("Keep each amenity list to 250 items or fewer.", true);
        return;
      }
      update(path, [...items, { id: newId(), iconKey, label, enabled: true, description: "" }]);
    }
  }
  function move(index: number, offset: number) {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    update(path, next);
  }
  return (
    <>
      <Card
        title="Predefined amenities"
        description="Switch common amenities on or off. Only enabled amenities appear on the website."
      >
        <div className="wm-amenity-presets">
          {AMENITY_PRESETS.map((preset) => {
            const item = items.find((candidate) => candidate.iconKey === preset.iconKey);
            const enabled = Boolean(item && item.enabled !== false);
            return (
              <label
                key={preset.iconKey}
                className={`wm-amenity-preset${enabled ? " is-enabled" : ""}`}
              >
                <span className="wm-amenity-icon">
                  <AmenityIcon iconKey={preset.iconKey} />
                </span>
                <span className="wm-amenity-preset-label">
                  <strong>{preset.label}</strong>
                  <small>{enabled ? "On" : "Off"}</small>
                </span>
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={`${preset.label} amenity`}
                  checked={enabled}
                  onChange={(event) =>
                    togglePreset(preset.iconKey, preset.label, event.target.checked)
                  }
                />
                <span className="wm-switch" aria-hidden="true" />
              </label>
            );
          })}
        </div>
      </Card>
      <Card
        title="Your amenities"
        description={`${items.filter((item) => item.enabled !== false).length} enabled | edit names, descriptions, and icons, or add your own`}
        action={
          <button
            type="button"
            className="wm-button wm-button-small"
            disabled={items.length >= 250}
            onClick={() => {
              const item = {
                id: newId(),
                label: "",
                iconKey: "hotel",
                enabled: true,
                description: "",
              };
              update(path, [...items, item]);
              setOpened(item.id);
            }}
          >
            <Plus size={15} />
            Add amenity
          </button>
        }
      >
        {!items.length && (
          <p className="wm-note">Enable a predefined amenity above, or add a custom amenity.</p>
        )}
        <div className="wm-amenity-list">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`wm-amenity-item${item.enabled === false ? " is-disabled" : ""}`}
            >
              <div className="wm-amenity-row">
                <span className="wm-amenity-icon">
                  <AmenityIcon iconUrl={item.iconUrl} iconKey={item.iconKey} />
                </span>
                <div>
                  <strong>{item.label || "Custom amenity"}</strong>
                  <small>
                    {item.enabled === false
                      ? "Hidden from website"
                      : item.description || "Shown on website"}
                  </small>
                </div>
                <label className="wm-amenity-toggle">
                  <input
                    type="checkbox"
                    role="switch"
                    aria-label={`Show ${item.label || "custom amenity"} on website`}
                    checked={item.enabled !== false}
                    onChange={(event) => update([...path, index, "enabled"], event.target.checked)}
                  />
                  <span className="wm-switch" aria-hidden="true" />
                </label>
                <button
                  type="button"
                  className="wm-button wm-button-small"
                  aria-expanded={opened === item.id}
                  aria-label={`Edit ${item.label || "custom amenity"}`}
                  onClick={() => setOpened(opened === item.id ? null : item.id)}
                >
                  {opened === item.id ? "Close" : "Edit"}
                </button>
              </div>
              {opened === item.id && (
                <div className="wm-amenity-edit">
                  <Field label="Amenity name" path={[...path, index, "label"]} />
                  <Field label="Description" path={[...path, index, "description"]} multiline />
                  <fieldset className="wm-amenity-icon-picker">
                    <legend>Choose an icon</legend>
                    <div>
                      {[...AMENITY_PRESETS, { iconKey: "hotel", label: "Other amenity" }].map(
                        (preset) => (
                          <button
                            type="button"
                            key={preset.iconKey}
                            title={preset.label}
                            aria-label={`${preset.label} icon`}
                            aria-pressed={item.iconKey === preset.iconKey}
                            onClick={() => update([...path, index, "iconKey"], preset.iconKey)}
                          >
                            <AmenityIcon iconKey={preset.iconKey} />
                            <span>{preset.label}</span>
                          </button>
                        ),
                      )}
                    </div>
                  </fieldset>
                  <div className="wm-row-actions">
                    <button
                      type="button"
                      className="wm-button wm-button-small"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp size={14} />
                      Move up
                    </button>
                    <button
                      type="button"
                      className="wm-button wm-button-small"
                      disabled={index === items.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown size={14} />
                      Move down
                    </button>
                    <button
                      type="button"
                      className="wm-button wm-button-small wm-danger"
                      onClick={() => {
                        if (window.confirm("Remove this amenity? You can undo this change.")) {
                          update(
                            path,
                            items.filter((candidate) => candidate.id !== item.id),
                          );
                          setOpened(null);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
