"use client";

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import { appearanceVariables } from "../src/lib/branding/appearance";
import { createTheme } from "../src/lib/branding/theme";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { AmenityIcon } from "../src/components/amenities/AmenityIcon";
import { visibleRooms } from "../src/lib/booking/visibility";
import { PAGE_LABELS, safeImageUrl, type PageKey, type WebsiteDocument } from "./content";

export function WebsitePreview({
  content,
  page = "home",
  onPageChange,
}: {
  content: WebsiteDocument;
  page?: PageKey;
  onPageChange: (page: PageKey) => void;
}) {
  const { hotel, pages } = content;
  const theme = createTheme(hotel.branding);
  const color = (value: string | undefined, fallback: string) =>
    value && /^#[\da-f]{6}$/i.test(value) ? value : fallback;
  const style = {
    ...appearanceVariables(hotel.branding),
    "--preview-brand": theme["--color-brand" as keyof CSSProperties],
    "--preview-accent": theme["--color-accent-text" as keyof CSSProperties],
    "--preview-secondary": color(hotel.branding.secondaryColor, "#d6c4a4"),
    "--preview-heading": hotel.branding.fontHeading || "Georgia",
    "--preview-body": hotel.branding.fontBody || "Arial",
  } as CSSProperties;
  const hero = hotel.heroSlides?.find((image) => safeImageUrl(image.url)) || hotel.heroImage;
  const selected = pages[page];
  function photos() {
    return (
      <div className="wm-site-gallery">
        {hotel.gallery.map(
          (image) =>
            safeImageUrl(image.url) && (
              <img key={image.id} src={safeImageUrl(image.url)} alt={image.alt} />
            ),
        )}
      </div>
    );
  }
  function rooms() {
    return (
      <div className="wm-site-grid">
        {visibleRooms(hotel.rooms).map((room) => (
          <article className="wm-site-room" key={room.id}>
            {safeImageUrl(room.images[0]?.url) && (
              <img src={safeImageUrl(room.images[0]?.url)} alt={room.images[0]?.alt || room.name} />
            )}
            <div>
              <h4>{room.name}</h4>
              <p>{room.shortDescription}</p>
              <small>
                {room.occupancy} guests{room.bedType ? ` · ${room.bedType}` : ""}
              </small>
            </div>
          </article>
        ))}
      </div>
    );
  }
  function amenities() {
    return (
      <div className="wm-site-amenities">
        {hotel.amenities
          .filter((item) => item.enabled !== false)
          .map((item) => (
            <article key={item.id}>
              <AmenityIcon iconUrl={item.iconUrl} iconKey={item.iconKey} />
              <strong>{item.label}</strong>
              <p>{item.description}</p>
            </article>
          ))}
      </div>
    );
  }
  function offers() {
    return (
      <div className="wm-site-grid">
        {hotel.offers?.map((item) => (
          <article className="wm-site-room" key={item.id}>
            {safeImageUrl(item.image?.url) && (
              <img src={safeImageUrl(item.image?.url)} alt={item.image?.alt || item.title} />
            )}
            <div>
              {item.badge && <small>{item.badge}</small>}
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    );
  }
  function dining() {
    return hotel.dining?.map((item) => (
      <article className="wm-site-dining" key={item.id}>
        {safeImageUrl(item.image?.url) && (
          <img src={safeImageUrl(item.image?.url)} alt={item.image?.alt || item.name} />
        )}
        <h4>{item.name}</h4>
        <p>{item.description}</p>
        <small>{item.hours}</small>
      </article>
    ));
  }
  function reviews() {
    return hotel.testimonials?.map((item) => (
      <blockquote className="wm-site-quote" key={item.id}>
        <Star size={15} />
        <p>“{item.quote}”</p>
        <cite>
          {item.guestName}
          {item.location ? ` · ${item.location}` : ""}
        </cite>
      </blockquote>
    ));
  }
  function location() {
    return (
      <div className="wm-site-address">
        <MapPin size={20} />
        <p>
          {[hotel.location.address, hotel.location.city, hotel.location.country]
            .filter(Boolean)
            .join(", ")}
        </p>
        {hotel.contact.phone && <p>{hotel.contact.phone}</p>}
        {hotel.contact.email && <p>{hotel.contact.email}</p>}
      </div>
    );
  }
  function booking() {
    return (
      <div className="wm-site-booking">
        <p>{hotel.tagline || "Make yourself at home."}</p>
        <span className="wm-site-cta">
          Plan your stay <ArrowUpRight size={13} />
        </span>
        <small>Reservation form will appear on the connected website.</small>
      </div>
    );
  }
  function pageBody() {
    switch (page) {
      case "about":
        return <p>{hotel.longDescription || hotel.description}</p>;
      case "rooms":
        return rooms();
      case "gallery":
        return photos();
      case "offers":
        return offers();
      case "dining":
        return dining();
      case "experiences":
        return amenities();
      case "reviews":
        return reviews();
      case "faq":
        return hotel.faqs?.map((item) => (
          <details className="wm-site-faq" key={item.id}>
            <summary>{item.question || "Untitled question"}</summary>
            <p>{item.answer}</p>
          </details>
        ));
      case "policies":
        return hotel.policies?.map((item, index) => (
          <article key={index}>
            <h4>{item.title}</h4>
            <p>{item.description}</p>
          </article>
        ));
      case "contact":
        return location();
      case "booking":
        return booking();
      default:
        return null;
    }
  }
  const logo = safeImageUrl(hotel.branding.logoDarkUrl || hotel.branding.logoUrl);
  return (
    <div
      className="wm-site"
      style={style}
      data-preview-motion={hotel.branding.motion?.preset ?? "off"}
      data-preview-style={hotel.branding.websiteStyle ?? "luxury"}
      data-preview-image={hotel.branding.imageStyle ?? "natural"}
    >
      <header className="wm-site-header">
        {logo ? (
          <img className="wm-site-logo" src={logo} alt={hotel.name} />
        ) : (
          <strong>{hotel.name}</strong>
        )}
        <nav aria-label="Preview navigation">
          {(["home", "rooms", "dining", "gallery", "offers", "contact"] as PageKey[])
            .filter((key) => pages[key].enabled)
            .map((key) => (
              <button
                type="button"
                key={key}
                onClick={() => onPageChange(key)}
                aria-current={page === key ? "page" : undefined}
              >
                {key === "home" ? "Home" : PAGE_LABELS[key]}
              </button>
            ))}
        </nav>
      </header>
      {!selected.enabled ? (
        <div className="wm-site-hidden">
          <strong>{PAGE_LABELS[page]} is hidden</strong>
          <p>Enable this page in Pages & navigation to include it in your website.</p>
        </div>
      ) : (
        <>
          {page === "home" ? (
            <>
              <div className="wm-site-hero">
                {safeImageUrl(hero?.url) && (
                  <img src={safeImageUrl(hero?.url)} alt={hero?.alt || "Hotel"} />
                )}
                <div>
                  <small>{pages.home.eyebrow || hotel.name}</small>
                  <h2>{pages.home.title || hotel.tagline || hotel.name}</h2>
                  <p>{pages.home.description || hotel.description}</p>
                  {pages.booking.enabled && (
                    <button
                      type="button"
                      className="wm-site-cta"
                      onClick={() => onPageChange("booking")}
                    >
                      Discover your stay <ArrowUpRight size={13} />
                    </button>
                  )}
                </div>
              </div>
              {content.homeSections
                .filter((section) => section.enabled)
                .map((section) => (
                  <section
                    key={section.id}
                    className={`wm-site-section wm-site-section-${section.id}`}
                  >
                    <small className="wm-site-eyebrow">{section.eyebrow}</small>
                    <h3>{section.title}</h3>
                    {section.id === "story" && <p>{hotel.longDescription || hotel.description}</p>}
                    {section.id === "rooms" && rooms()}
                    {section.id === "amenities" && amenities()}
                    {section.id === "offers" && offers()}
                    {section.id === "testimonials" && reviews()}
                    {section.id === "dining" && dining()}
                    {section.id === "location" && location()}
                    {section.id === "gallery" && photos()}
                    {section.id === "booking" && booking()}
                  </section>
                ))}
            </>
          ) : (
            <section className="wm-site-section">
              <small className="wm-site-eyebrow">{selected.eyebrow}</small>
              <h2>{selected.title}</h2>
              {selected.description && <p>{selected.description}</p>}
              {pageBody()}
            </section>
          )}
        </>
      )}
      <footer className="wm-site-footer">
        <strong>{hotel.name}</strong>
        <p>{hotel.tagline}</p>
        <small>
          {hotel.location.city}
          {hotel.location.country ? ` · ${hotel.location.country}` : ""}
        </small>
      </footer>
    </div>
  );
}
