"use client";

import { MenuEditor } from "./MenuEditor";
import { BrandDashboard } from "./BrandDashboard";
import { HeaderSettings } from "./HeaderSettings";
import { AmenitiesEditor } from "./AmenitiesEditor";
import { HmsAmenities } from "./HmsAmenities";
import { HmsAddOns } from "./HmsAddOns";
import { LogoPaletteButton } from "./LogoPaletteButton";
import { propertyDate } from "../src/lib/booking/settings";
import { PAGE_LABELS, type PageKey } from "./content";
import { SeoEditor } from "./SeoEditor";
import { HomepageEditor as Homepage } from "./HomepageEditor";
import { ContactEditor as Contact } from "./ContactEditor";
import {
  Card,
  Collection,
  ColorField,
  Field,
  ImageCollection,
  ImageField,
  newId,
  Toggle,
  useEditor,
} from "./editor-fields";

export type EditorSection =
  | "seo"
  | "dashboard"
  | "branding"
  | "homepage"
  | "rooms"
  | "gallery"
  | "amenities"
  | "offers"
  | "dining"
  | "reviews"
  | "faq"
  | "policies"
  | "extras"
  | "contact"
  | "rates"
  | "booking-settings"
  | "payments"
  | "promotions";
export const SECTION_LABELS: Record<EditorSection, string> = {
  seo: "SEO",
  promotions: "Promotions",
  rates: "Rates & inventory",
  "booking-settings": "Booking settings",
  payments: "Payments",
  dashboard: "Dashboard",
  branding: "Appearance",
  homepage: "Homepage",
  rooms: "Rooms",
  gallery: "Gallery",
  amenities: "Amenities",
  offers: "Offers",
  dining: "Menu",
  reviews: "Guest reviews",
  faq: "FAQs",
  policies: "Policies",
  extras: "Add-ons",
  contact: "Contact us",
};
export const SECTION_DESCRIPTIONS: Record<EditorSection, string> = {
  seo: "Manage search titles, descriptions and visibility for your entire website.",
  promotions: "Set booking discount codes, dates, and eligible rooms.",
  rates: "Choose which room prices guests can see and book.",
  "booking-settings": "Set stay limits, advance notice, and guest details.",
  payments: "Choose how guests will pay for their stay.",
  dashboard: "View website status, setup progress, statistics and domain management.",
  branding: "Set a coordinated palette, typography, and motion.",
  homepage: "Choose homepage sections and edit their headings, images and content.",
  rooms: "Room types come from Patel HMS. Manage their website presentation here.",
  gallery: "Add and organise hotel photos.",
  amenities: "View the facilities assigned to your rooms in Patel HMS.",
  offers: "Present packages and special stays on your website.",
  dining: "Manage menu tabs, sections, dishes, prices, and downloadable PDFs.",
  reviews: "Manage guest reviews shown on your website.",
  faq: "Answer the questions guests ask most.",
  policies: "Keep the details clear before guests arrive.",
  extras: "View optional services and prices supplied by Patel HMS.",
  contact: "Set your website enquiry inbox and social profiles.",
};

function HotelProfile() {
  const { presentationOnly } = useEditor();
  return (
    <>
      <Card
        title="Hotel information"
        description="Your hotel introduction supplies default website content. Search titles and descriptions can be customised above."
      >
        {!presentationOnly && <Field label="Hotel name" path={["hotel", "name"]} />}
        <Field
          label="Tagline"
          path={["hotel", "tagline"]}
          hint="A short introduction to your hotel."
        />
        <Field label="Short description" path={["hotel", "description"]} multiline />
        <Field
          label="About page story"
          path={["hotel", "longDescription"]}
          multiline
          hint="Visible on your public About page."
        />
      </Card>
      <PageSettings page="about" />
    </>
  );
}

function Branding() {
  const { presentationOnly } = useEditor();
  if (presentationOnly) return <BrandDashboard />;
  return (
    <>
      {!presentationOnly && (
        <Card
          title="Your logos"
          description="Upload a logo from your computer. PNG, JPEG, WebP, and GIF files up to 2 MB are supported."
        >
          <Field
            label="Logo layout"
            path={["hotel", "branding", "logoLayout"]}
            options={[
              { value: "compact", label: "Compact logo" },
              { value: "wide", label: "Wide logo with hotel name" },
            ]}
          />
          <div className="wm-two-columns">
            <ImageField label="Primary logo" path={["hotel", "branding", "logoUrl"]} />
            <ImageField
              label="Logo for dark backgrounds"
              path={["hotel", "branding", "logoLightUrl"]}
              dark
            />
          </div>
          <div className="wm-two-columns">
            <ImageField
              label="Logo for light backgrounds"
              path={["hotel", "branding", "logoDarkUrl"]}
            />
            <ImageField label="Browser icon (favicon)" path={["hotel", "branding", "faviconUrl"]} />
          </div>
        </Card>
      )}
      {presentationOnly && (
        <Card
          title="Browser icon"
          description="Upload a square PNG, JPEG, or WebP icon for your website's browser tab."
        >
          <ImageField label="Browser icon (favicon)" path={["hotel", "branding", "faviconUrl"]} />
        </Card>
      )}
      <Card
        title="Brand colors"
        description="Generate a coordinated palette from your logo, or choose your own colors."
        action={<LogoPaletteButton />}
      >
        <div className="wm-three-columns">
          <ColorField
            label="Primary"
            path={["hotel", "branding", "primaryColor"]}
            fallback="#173b3f"
          />
          <ColorField
            label="Secondary"
            path={["hotel", "branding", "secondaryColor"]}
            fallback="#d6c4a4"
          />
          <ColorField
            label="Accent"
            path={["hotel", "branding", "accentColor"]}
            fallback="#b38b59"
          />
        </div>
        <p className="wm-note">
          The preview uses your colors. Your website theme can adjust them for readable contrast.
        </p>
      </Card>
      <Card title="Fonts & animation">
        <div className="wm-two-columns">
          <Field
            label="Heading font"
            path={["hotel", "branding", "fontHeading"]}
            options={["Georgia", "Times New Roman", "Arial", "Verdana", "Trebuchet MS"]}
          />
          <Field
            label="Body font"
            path={["hotel", "branding", "fontBody"]}
            options={["Arial", "Verdana", "Trebuchet MS", "Georgia"]}
          />
        </div>
        <Field
          label="Animation style"
          path={["hotel", "branding", "motion", "preset"]}
          options={[
            { value: "off", label: "No animation" },
            { value: "calm", label: "Gentle animation" },
            { value: "expressive", label: "Lively animation" },
          ]}
        />
        <Toggle
          label="Smooth scrolling"
          path={["hotel", "branding", "motion", "smoothScroll"]}
          hint="Move smoothly between sections when guests scroll."
        />
      </Card>
      <Card title="Website header">
        <HeaderSettings />
      </Card>
    </>
  );
}

function PageSettings({ page }: { page: PageKey }) {
  return (
    <Card
      title={`${page === "experiences" ? "Amenities" : PAGE_LABELS[page]} page settings`}
      description="Show this page in your website and navigation."
      className="wm-page-settings"
      action={<Toggle compact label="Show this page" path={["pages", page, "enabled"]} />}
    >
      <Field label="Small heading above the title" path={["pages", page, "eyebrow"]} />
      {page !== "home" && (
        <>
          <Field label="Page heading" path={["pages", page, "title"]} />
          <Field label="Introduction" path={["pages", page, "description"]} multiline />
        </>
      )}
    </Card>
  );
}

function Rooms() {
  return (
    <>
      <p className="wm-info">
        Room types are supplied automatically by Patel HMS. Edit their website descriptions, photos,
        and visibility here. Create or remove room types in Patel HMS.
      </p>
      <Collection
        title="Rooms"
        syncFromHms
        singular="Room"
        path={["hotel", "rooms"]}
        summary={(item) => String(item.name)}
        locked
      >
        {(path) => (
          <>
            <Toggle label="Show this room on the website" path={[...path, "visible"]} />
            <p className="wm-note">
              Room capacity and bed type come from Patel HMS. Update them there.
            </p>
            <Field label="Display name" path={[...path, "name"]} />
            <details className="wm-advanced">
              <summary>Room page address (optional)</summary>
              <Field
                label="Room page name in the address"
                path={[...path, "slug"]}
                hint="Use lowercase words with hyphens, for example deluxe-city-room. Changing this also changes the link to this room."
              />
            </details>
            <Field label="Short description" path={[...path, "shortDescription"]} />
            <Field label="Full description" path={[...path, "description"]} multiline />
            <div className="wm-three-columns">
              <Field
                label="Guests per room (from Patel HMS)"
                path={[...path, "occupancy"]}
                type="number"
                readOnly
              />
              <Field label="Bed type (from Patel HMS)" path={[...path, "bedType"]} readOnly />
              <Field
                label="Room size"
                path={[...path, "size"]}
                hint="Include the unit, for example 32 m2."
              />
            </div>
            <ImageCollection path={[...path, "images"]} title="Room photos" />
            <AmenitiesEditor path={[...path, "amenities"]} />
          </>
        )}
      </Collection>
    </>
  );
}

function Offers() {
  return (
    <Collection
      title="Offers"
      syncFromHms
      description="Offers are supplied by Patel HMS."
      emptyMessage="Offers will appear here when supplied by Patel HMS."
      singular="Offer"
      path={["hotel", "offers"]}
      summary={(item) => String(item.title)}
    >
      {(path) => (
        <>
          <Field label="Offer title" path={[...path, "title"]} />
          <Field label="Description" path={[...path, "description"]} multiline />
          <div className="wm-two-columns">
            <Field label="Badge" path={[...path, "badge"]} hint="Example: Seasonal offer" />
            <Field label="Valid until" path={[...path, "validUntil"]} type="date" />
          </div>
          <Field label="Button label" path={[...path, "ctaLabel"]} />
          <ImageField
            label="Offer photo"
            path={[...path, "image", "url"]}
            altPath={[...path, "image", "alt"]}
          />
        </>
      )}
    </Collection>
  );
}
function Dining() {
  return <MenuEditor />;
}
function Reviews() {
  return (
    <Collection
      title="Guest reviews"
      syncFromHms
      description="Guest reviews are supplied by Patel HMS."
      emptyMessage="Guest reviews will appear here when supplied by Patel HMS."
      singular="Review"
      path={["hotel", "testimonials"]}
      summary={(item) => String(item.guestName)}
    >
      {(path) => (
        <>
          <div className="wm-two-columns">
            <Field label="Guest name" path={[...path, "guestName"]} />
            <Field label="Guest location" path={[...path, "location"]} />
          </div>
          <Field label="Review" path={[...path, "quote"]} multiline />
        </>
      )}
    </Collection>
  );
}
function Faq() {
  return (
    <Collection
      title="FAQs"
      singular="Question"
      path={["hotel", "faqs"]}
      summary={(item) => String(item.question)}
      create={() => ({ id: newId(), question: "", answer: "" })}
    >
      {(path) => (
        <>
          <Field label="Question" path={[...path, "question"]} />
          <Field label="Answer" path={[...path, "answer"]} multiline />
        </>
      )}
    </Collection>
  );
}
function Policies() {
  return (
    <Collection
      title="Policies"
      syncFromHms
      description="Policies are supplied by Patel HMS."
      emptyMessage="Policies will appear here when supplied by Patel HMS."
      singular="Policy"
      path={["hotel", "policies"]}
      summary={(item) => String(item.title)}
    >
      {(path) => (
        <>
          <Field label="Policy title" path={[...path, "title"]} />
          <Field label="Details" path={[...path, "description"]} multiline />
        </>
      )}
    </Collection>
  );
}
function Extras() {
  const { content } = useEditor();
  return (
    <Card
      title="Stay extras"
      description="Services and prices come from Patel HMS. Update them there."
    >
      {content.hotel.extras?.length ? (
        content.hotel.extras.map((extra) => (
          <div className="wm-readonly-row" key={extra.id}>
            <strong>{extra.name}</strong>
            <p>{extra.description}</p>
            <small>
              {extra.price.currency} {extra.price.amount} /{" "}
              {extra.charge === "per-night" ? "per night" : "per stay"}
            </small>
          </div>
        ))
      ) : (
        <p className="wm-note">
          Extras will appear automatically when supplied by Patel HMS. Add or change services in
          Patel HMS.
        </p>
      )}
    </Card>
  );
}

const sectionPages: Partial<Record<EditorSection, PageKey>> = {
  rooms: "rooms",
  gallery: "gallery",
  amenities: "experiences",
  offers: "offers",
  dining: "dining",
  reviews: "reviews",
  faq: "faq",
  policies: "policies",

  "booking-settings": "booking",
};

export function EditorSections({ section }: { section: EditorSection }) {
  const { presentationOnly } = useEditor();
  const page = sectionPages[section];
  const hmsManaged =
    presentationOnly && ["rooms", "gallery", "amenities", "extras"].includes(section);
  return (
    <>
      {presentationOnly && section === "amenities" && <HmsAmenities />}
      {presentationOnly && section === "extras" && <HmsAddOns />}
      {!hmsManaged && <SectionContent section={section} />}
      {page && <PageSettings page={page} />}
    </>
  );
}

function SectionContent({ section }: { section: EditorSection }) {
  switch (section) {
    case "seo":
      return (
        <>
          <SeoEditor />
          <HotelProfile />
        </>
      );
    case "dashboard":
      return null;
    case "branding":
      return <Branding />;
    case "homepage":
      return <Homepage />;
    case "rooms":
      return <Rooms />;
    case "gallery":
      return <ImageCollection path={["hotel", "gallery"]} title="Gallery photos" />;
    case "amenities":
      return <AmenitiesEditor />;
    case "offers":
      return <Offers />;
    case "dining":
      return <Dining />;
    case "reviews":
      return <Reviews />;
    case "faq":
      return <Faq />;
    case "policies":
      return <Policies />;
    case "extras":
      return <Extras />;
    case "contact":
      return <Contact />;
    case "rates":
      return <Rates />;
    case "booking-settings":
      return <BookingRules />;
    case "payments":
      return <Payments />;
    case "promotions":
      return <Promotions />;
  }
}

function Rates() {
  const { content } = useEditor();
  return (
    <>
      <p className="wm-info">
        Room prices and availability come from Patel HMS. Turn a price off to hide it from guests.
        If all prices are off, the room is hidden too.
      </p>
      {content.hotel.rooms.map((room, index) => (
        <Card
          key={room.id}
          title={room.name}
          description="Choose the prices guests can book for this room."
        >
          {room.ratePlans.length ? (
            room.ratePlans.map((rate, rateIndex) => (
              <div key={rate.id} className="wm-readonly-row">
                <Toggle
                  label={rate.name}
                  path={["hotel", "rooms", index, "ratePlans", rateIndex, "visible"]}
                  hint="Show on booking engine"
                />
                <small>
                  {rate.price.currency} {rate.price.amount} / night | Available rooms:{" "}
                  {rate.inventoryCount ?? "Not supplied"}
                </small>
                <p>{[rate.mealPlan, rate.cancellationPolicy].filter(Boolean).join(" | ")}</p>
              </div>
            ))
          ) : (
            <p className="wm-note">
              No prices have been supplied yet. Add room prices in Patel HMS.
            </p>
          )}
        </Card>
      ))}
      {!content.hotel.rooms.length && (
        <p className="wm-note">
          Room types and rate plans will appear here when supplied by Patel HMS.
        </p>
      )}
    </>
  );
}
function BookingRules() {
  return (
    <>
      <Card
        title="Stay rules"
        description="Choose the stays guests can book. Room-specific rules from Patel HMS also apply."
      >
        <div className="wm-two-columns">
          <Field
            label="Minimum nights"
            path={["hotel", "bookingSettings", "minStay"]}
            type="number"
            min={1}
            max={30}
          />
          <Field
            label="Maximum nights"
            path={["hotel", "bookingSettings", "maxStay"]}
            type="number"
            min={1}
            max={30}
          />
          <Field
            label="Minimum advance notice (days)"
            path={["hotel", "bookingSettings", "minAdvanceDays"]}
            type="number"
            min={0}
            max={730}
            hint="Use 0 to allow same-day arrivals."
          />
          <Field
            label="Book up to (days ahead)"
            path={["hotel", "bookingSettings", "advanceWindow"]}
            type="number"
            min={0}
            max={730}
            hint="For example, 365 allows arrivals within the next year."
          />
          <Field
            label="Maximum rooms per booking"
            path={["hotel", "bookingSettings", "maxRooms"]}
            type="number"
            min={1}
            max={10}
          />
        </div>
      </Card>
      <Card title="Guest details">
        <p className="wm-note">First name, last name, and email are always required.</p>
        <Toggle label="Require phone number" path={["hotel", "bookingSettings", "requirePhone"]} />
        <Toggle label="Require address" path={["hotel", "bookingSettings", "requireAddress"]} />
      </Card>
    </>
  );
}
function Payments() {
  const { content } = useEditor();
  return (
    <Card
      title="Payment policy"
      description="Choose when guests pay. Your administrator must set up online payments before you can accept them."
    >
      <Field
        label="Payment mode"
        path={["hotel", "paymentSettings", "mode"]}
        options={[
          { value: "pay-at-property", label: "Pay at the property" },
          { value: "full", label: "Pay the full amount online" },
          { value: "deposit", label: "Pay a deposit online" },
        ]}
        hint="Choose pay at the property if online payments have not been set up."
      />
      {content.hotel.paymentSettings?.mode === "deposit" && (
        <Field
          label="Deposit percentage"
          path={["hotel", "paymentSettings", "depositPercent"]}
          type="number"
          min={1}
          max={100}
        />
      )}
      <p className="wm-info">
        Gateway credentials and verified payment status are managed by PatelHMS. Card details are
        collected only by the hosted payment provider.
      </p>
    </Card>
  );
}

function Promotions() {
  const { content, update } = useEditor();
  return (
    <>
      <p className="wm-info">
        Set a code guests can enter when booking. Discounts are checked when guests book; this
        preview does not show discounted prices.
      </p>
      <Collection
        title="Promotions"
        singular="Promotion"
        path={["promotions"]}
        summary={(item) => String(item.code || "New promotion")}
        create={() => ({
          id: newId(),
          code: "",
          enabled: false,
          type: "percentage",
          value: 10,
          from: propertyDate(content.hotel.timeZone),
          until: propertyDate(content.hotel.timeZone),
          roomTypeIds: [],
          buyNights: 3,
          freeNights: 1,
        })}
      >
        {(path, index) => (
          <>
            <Toggle label="Enable promotion" path={[...path, "enabled"]} />
            <Field
              label="Promotion code"
              path={[...path, "code"]}
              hint="Unique code, such as SUMMER10."
            />
            <Field
              label="Discount type"
              path={[...path, "type"]}
              options={[
                { value: "percentage", label: "Percentage discount" },
                { value: "fixed", label: "Fixed amount discount" },
                { value: "stay-free", label: "Stay extra nights for free" },
              ]}
            />
            {content.promotions?.[index].type === "stay-free" ? (
              <div className="wm-two-columns">
                <Field
                  label="Paid nights"
                  path={[...path, "buyNights"]}
                  type="number"
                  min={1}
                  max={29}
                />
                <Field
                  label="Free nights"
                  path={[...path, "freeNights"]}
                  type="number"
                  min={1}
                  max={29}
                />
              </div>
            ) : (
              <Field
                label={
                  content.promotions?.[index].type === "fixed"
                    ? `Discount amount (${content.hotel.currency ?? content.hotel.rooms[0]?.ratePlans[0]?.price.currency ?? "property currency"})`
                    : "Discount percentage"
                }
                path={[...path, "value"]}
                type="number"
                min={0}
                max={content.promotions?.[index].type === "percentage" ? 100 : undefined}
              />
            )}
            <div className="wm-two-columns">
              <Field label="Valid from" path={[...path, "from"]} type="date" />
              <Field label="Valid until" path={[...path, "until"]} type="date" />
            </div>
            <p className="wm-note">
              Applicable rooms. Leave all unchecked to apply to all room types.
            </p>
            {content.hotel.rooms.map((room) => (
              <label className="wm-promo-room" key={room.id}>
                <input
                  type="checkbox"
                  checked={content.promotions?.[index].roomTypeIds.includes(room.id) ?? false}
                  onChange={(event) => {
                    const ids = content.promotions?.[index].roomTypeIds ?? [];
                    update(
                      [...path, "roomTypeIds"],
                      event.target.checked ? [...ids, room.id] : ids.filter((id) => id !== room.id),
                    );
                  }}
                />
                {room.name}
              </label>
            ))}
          </>
        )}
      </Collection>
    </>
  );
}
