"use client";
/* eslint-disable @next/next/no-img-element */
import { Check, PanelsTopLeft, ShoppingBag, Search, MapPin, Gift } from "lucide-react";
import type { CSSProperties } from "react";
import { Field, useEditor } from "./editor-fields";
import { safeImageUrl } from "./content";
import { HEADER_TEMPLATES } from "../src/lib/branding/header";
import { createTheme } from "../src/lib/branding/theme";
import styles from "./HeaderSettings.module.css";

export function HeaderSettings() {
  const { content, update } = useEditor();
  const hotel = content.hotel;
  const header = hotel.branding.header;
  const selected = header?.template || "minimal";
  const logo = safeImageUrl(hotel.branding.logoDarkUrl || hotel.branding.logoUrl);
  const lightLogo = safeImageUrl(hotel.branding.logoLightUrl) || logo;
  const photo = safeImageUrl(
    hotel.heroImage?.url || hotel.heroSlides?.[0]?.url || hotel.gallery[0]?.url,
  );
  return (
    <section className={styles.settings}>
      <header className="wm-design-heading">
        <span className="wm-design-heading-icon">
          <PanelsTopLeft size={28} />
        </span>
        <div>
          <h2>Header settings</h2>
          <p>Choose how guests first see your hotel.</p>
        </div>
      </header>
      <p className={styles.note}>
        All templates use your hotel logo and brand palette. Contact details stay connected to HMS.
      </p>
      <div
        className={styles.templates}
        role="radiogroup"
        aria-label="Header template"
        style={createTheme(hotel.branding) as CSSProperties}
      >
        {HEADER_TEMPLATES.map((item, index) => (
          <label
            key={item.value}
            className={`${styles.option} ${selected === item.value ? styles.selected : ""}`}
          >
            <input
              type="radio"
              name="header-template"
              value={item.value}
              checked={selected === item.value}
              onChange={() =>
                update(["hotel", "branding", "header"], { ...header, template: item.value })
              }
            />
            <div className={styles.label}>
              <span className={styles.number}>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.label}</strong>
              {selected === item.value && <Check size={18} className={styles.check} />}
            </div>
            <div
              className={`${styles.preview} ${styles[item.value]}`}
              aria-hidden="true"
              style={
                item.value === "transparent" && photo
                  ? { backgroundImage: `linear-gradient(#0008,#0008), url("${photo}")` }
                  : undefined
              }
            >
              {item.value === "contact" && (
                <div className={styles.miniBar}>
                  <MapPin size={10} />
                  <span>{hotel.location.address || hotel.name}</span>
                  <span>{hotel.contact.phone}</span>
                </div>
              )}
              {item.value === "announcement" && (
                <div className={styles.miniAnnouncement}>
                  <Gift size={10} />
                  {header?.announcementText ||
                    hotel.offers?.[0]?.title ||
                    "Your next memorable stay starts here."}
                </div>
              )}
              <div className={styles.miniRow}>
                {item.value === "minimal" && <span className={styles.miniVisit}>VISIT US</span>}
                {item.value === "centered" && (
                  <span className={styles.miniLinks}>Rooms&nbsp;&nbsp; Gallery</span>
                )}
                {logo ? (
                  <img
                    className={styles.miniLogo}
                    src={item.value === "transparent" ? lightLogo : logo}
                    alt=""
                  />
                ) : (
                  <strong className={styles.miniName}>{hotel.name}</strong>
                )}
                {item.value !== "minimal" && item.value !== "centered" && (
                  <span className={styles.miniLinks}>
                    Rooms&nbsp;&nbsp; Gallery&nbsp;&nbsp; Contact
                  </span>
                )}
                <span className={styles.miniActions}>
                  {item.value === "minimal" ? <ShoppingBag size={12} /> : <Search size={12} />}
                  <b>Book your stay</b>
                </span>
              </div>
              {item.value === "minimal" && (
                <div className={styles.miniNav}>
                  Rooms&nbsp;&nbsp;&nbsp; Gallery&nbsp;&nbsp;&nbsp; Amenities&nbsp;&nbsp;&nbsp;
                  Contact
                </div>
              )}
            </div>
            <p>{item.description}</p>
          </label>
        ))}
      </div>
      {selected === "announcement" && (
        <div className={styles.announcementSettings}>
          <h3>Announcement bar</h3>
          <Field
            label="Announcement text"
            path={["hotel", "branding", "header", "announcementText"]}
            placeholder={hotel.offers?.[0]?.title || "Your next memorable stay starts here."}
            hint="Up to 180 characters. Leave blank to use your first offer or a welcome message."
          />
          <div className="wm-two-columns">
            <Field
              label="Link label"
              path={["hotel", "branding", "header", "announcementLabel"]}
              placeholder="Find your stay"
            />
            <Field
              label="Link destination"
              path={["hotel", "branding", "header", "announcementPage"]}
              options={[
                { value: "/booking", label: "Booking" },
                { value: "/offers", label: "Offers" },
                { value: "/rooms", label: "Rooms" },
                { value: "/contact", label: "Contact" },
              ]}
            />
          </div>
        </div>
      )}
      <p className={styles.note}>
        Transparent headers overlay the homepage hero and become solid on scroll. Other pages use a
        solid header for readability. Every template includes mobile navigation and the same compact
        header on scroll.
      </p>
    </section>
  );
}
