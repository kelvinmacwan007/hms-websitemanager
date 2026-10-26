"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import {
  ImagePlus,
  Images,
  Layers,
  GripVertical,
  Check,
  ChevronDown,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  BedDouble,
  Building2,
  Star,
  Tags,
  Utensils,
  MessageSquare,
  CalendarDays,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Card, Field, ImageField, ImageCollection, Toggle, useEditor } from "./editor-fields";
import { createWebsiteDocument, safeImageUrl } from "./content";

const sectionIcons: Record<string, LucideIcon> = {
  rooms: BedDouble,
  story: Building2,
  amenities: Star,
  offers: Tags,
  dining: Utensils,
  testimonials: MessageSquare,
  gallery: Images,
  booking: CalendarDays,
  location: MapPin,
};
const sectionLabels: Record<string, string> = {
  story: "About the hotel",
  testimonials: "Guest reviews",
};
export function HomepageEditor() {
  const { content, update, notify } = useEditor();
  const [opened, setOpened] = useState<string>();
  const [dragged, setDragged] = useState<string>();
  const photos = [
    ...new Map(
      [...content.hotel.gallery, ...content.hotel.rooms.flatMap((room) => room.images)]
        .filter((image) => safeImageUrl(image.url))
        .map((image) => [image.url, image]),
    ).values(),
  ];
  function move(from: number, to: number) {
    if (
      from < 0 ||
      from >= content.homeSections.length ||
      from === to ||
      to < 0 ||
      to >= content.homeSections.length
    )
      return;
    const sections = [...content.homeSections];
    const [section] = sections.splice(from, 1);
    sections.splice(to, 0, section);
    update(["homeSections"], sections);
  }
  return (
    <div className="wm-home-design">
      <Card
        icon={<ImagePlus size={23} />}
        title="The first impression"
        description="Write your welcome message. The main photo is used when no slider images are selected."
      >
        <div className="wm-home-first-grid">
          <div className="wm-home-welcome-fields">
            <Field label="Main banner heading" path={["pages", "home", "title"]} />
            <div className="wm-field">
              <label htmlFor="wm-home-banner-description">Main banner description</label>
              <textarea
                id="wm-home-banner-description"
                value={content.pages.home.description || ""}
                maxLength={200}
                placeholder="Write a short welcome description to help guests picture their stay."
                onChange={(event) => update(["pages", "home", "description"], event.target.value)}
              />
              <small className="wm-home-character-count">
                {(content.pages.home.description || "").length}/200
              </small>
            </div>
          </div>
          <div className="wm-home-banner-photo">
            <ImageField
              altInDetails
              editOverlay
              label="Main banner photo"
              path={["hotel", "heroImage", "url"]}
              altPath={["hotel", "heroImage", "alt"]}
            />
          </div>
        </div>
      </Card>
      <div className="wm-home-slides">
        <ImageCollection
          icon={<Images size={23} />}
          banner
          path={["hotel", "heroSlides"]}
          title="Banner slider images"
        />
      </div>
      {photos.length > 0 && (
        <Card
          icon={<Images size={23} />}
          title="Choose from hotel photos"
          description="Select photos for the banner slider. Uploads and slide order are managed above."
        >
          <div className="wm-home-photo-library">
            {photos.map((image) => {
              const selected = content.hotel.heroSlides?.some((slide) => slide.url === image.url);
              return (
                <button
                  type="button"
                  key={image.url}
                  aria-pressed={Boolean(selected)}
                  aria-label={`${selected ? "Remove" : "Select"} banner photo: ${image.alt || "Hotel photo"}`}
                  onClick={() =>
                    update(
                      ["hotel", "heroSlides"],
                      selected
                        ? content.hotel.heroSlides?.filter((slide) => slide.url !== image.url)
                        : [...(content.hotel.heroSlides || []), image],
                    )
                  }
                >
                  <img src={safeImageUrl(image.url)} alt={image.alt || "Hotel photo"} />
                  {selected && (
                    <span>
                      <Check size={17} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
      )}
      <Card
        icon={<Layers size={23} />}
        title="Homepage sections"
        description="Reorder sections, change their headings, or hide them from your homepage."
        action={
          <button
            type="button"
            className="wm-button wm-button-small"
            onClick={() => {
              update(["homeSections"], createWebsiteDocument(content.hotel).homeSections);
              notify("Homepage sections reset to default. Save changes to apply them.");
            }}
          >
            <RotateCcw size={15} />
            Reset to default
          </button>
        }
      >
        <div className="wm-home-section-list">
          {content.homeSections.map((section, index) => {
            const Icon = sectionIcons[section.id] || Layers;
            const label =
              sectionLabels[section.id] || section.id[0].toUpperCase() + section.id.slice(1);
            return (
              <div
                className={`wm-home-section-row${dragged === section.id ? " is-dragging" : ""}`}
                key={section.id}
                onDragOver={(event) => {
                  if (dragged) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!dragged) return;
                  event.preventDefault();
                  move(
                    content.homeSections.findIndex((item) => item.id === dragged),
                    index,
                  );
                  setDragged(undefined);
                }}
              >
                <div className="wm-home-section-summary">
                  <button
                    type="button"
                    className="wm-home-drag-handle"
                    draggable
                    aria-label={`Reorder ${section.id} section`}
                    title="Drag to reorder, or use the up and down arrow keys"
                    onDragStart={(event) => {
                      setDragged(section.id);
                      event.dataTransfer.setData("text/plain", section.id);
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDragEnd={() => setDragged(undefined)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                        event.preventDefault();
                        move(index, index + (event.key === "ArrowUp" ? -1 : 1));
                      }
                    }}
                  >
                    <GripVertical size={18} />
                  </button>
                  <span className="wm-home-section-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="wm-home-section-icon">
                    <Icon size={20} />
                  </span>
                  <div>
                    <strong>{label}</strong>
                    <small>Show {section.id} section</small>
                  </div>
                </div>
                <div className="wm-home-section-fields">
                  <Field label="Small heading" path={["homeSections", index, "eyebrow"]} />
                  <Field label="Section title" path={["homeSections", index, "title"]} />
                </div>
                <div className="wm-home-section-controls">
                  <Toggle
                    label={`Show ${section.id} section`}
                    path={["homeSections", index, "enabled"]}
                  />
                  <button
                    type="button"
                    className="wm-icon-button"
                    aria-label={`Section controls: ${label}`}
                    aria-expanded={opened === section.id}
                    aria-controls={`wm-home-section-${section.id}`}
                    onClick={() => setOpened(opened === section.id ? undefined : section.id)}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
                {opened === section.id && (
                  <div id={`wm-home-section-${section.id}`} className="wm-home-section-expanded">
                    <button
                      type="button"
                      className="wm-button wm-button-small"
                      aria-label={`Move ${section.id} up`}
                      disabled={index === 0}
                      onClick={() => move(index, index - 1)}
                    >
                      <ArrowUp size={15} />
                      Move up
                    </button>
                    <button
                      type="button"
                      className="wm-button wm-button-small"
                      aria-label={`Move ${section.id} down`}
                      disabled={index === content.homeSections.length - 1}
                      onClick={() => move(index, index + 1)}
                    >
                      <ArrowDown size={15} />
                      Move down
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
