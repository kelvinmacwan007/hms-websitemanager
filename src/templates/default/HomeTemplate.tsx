import { LocationSection } from "@/components/hotel/LocationSection";
import type { HomeSection } from "../../../Portal/content";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { ArrowUpRight, Quote } from "lucide-react";
import { AmenityIcon } from "@/components/amenities/AmenityIcon";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { FinalCta } from "@/components/hotel/FinalCta";
import { OfferSection } from "@/components/offers/OfferSection";
import { HeroSection } from "@/components/hero/HeroSection";
import { RoomShowcase } from "@/components/rooms/RoomShowcase";
import type { Hotel } from "@/types/hotel";

export function HomeTemplate({
  hotel,
  rateDates,
}: {
  hotel: Hotel;
  rateDates?: { checkIn: string; checkOut: string };
}) {
  const storyImage = hotel.gallery[1] ?? hotel.heroImage;
  const dining = hotel.dining?.[0];

  const sectionCopy = (id: HomeSection["id"]) =>
    hotel.website?.homeSections.find((section) => section.id === id);
  const sections: Partial<Record<HomeSection["id"], React.ReactNode>> = {
    location: <LocationSection hotel={hotel} copyOverride={sectionCopy("location")} />,
    rooms: (
      <>
        {" "}
        <ScrollReveal>
          <RoomShowcase
            rooms={hotel.rooms}
            copyOverride={sectionCopy("rooms")}
            rateDates={rateDates}
          />
        </ScrollReveal>{" "}
      </>
    ),
    story: (
      <>
        {" "}
        <ScrollReveal>
          <section className={websiteClassName("container home-story home-section")}>
            {storyImage && (
              <div className={websiteClassName("home-story-image")}>
                <Image
                  src={storyImage.url}
                  alt={storyImage.alt}
                  fill
                  sizes="(max-width: 767px) 100vw, 45vw"
                  className={websiteClassName("image-cover image-motion")}
                />
              </div>
            )}
            <div className={websiteClassName("home-story-copy")}>
              <p className={websiteClassName("eyebrow")}>
                {sectionCopy("story")?.eyebrow || "A warm welcome"}
              </p>
              <Heading as="h2" className={websiteClassName("section-title")}>
                {sectionCopy("story")?.title || (
                  <>
                    {" "}
                    Settle in.
                    <br />
                    <em>Feel at home.</em>{" "}
                  </>
                )}
              </Heading>
              <p className={websiteClassName("home-story-description")}>{hotel.description}</p>
              <Link hotel={hotel} href="/about" className={websiteClassName("home-text-link")}>
                Get to know {hotel.name} <ArrowUpRight size={19} />
              </Link>
              <div className={websiteClassName("home-story-details")}>
                <div>
                  <strong>{String(hotel.rooms.length).padStart(2, "0")}</strong>
                  <span>
                    {hotel.rooms.length === 1 ? "Room type to explore" : "Room types to explore"}
                  </span>
                </div>
                <div>
                  <strong>{String(hotel.amenities.length).padStart(2, "0")}</strong>
                  <span>Hotel amenities</span>
                </div>
              </div>
            </div>
          </section>
        </ScrollReveal>{" "}
      </>
    ),
    amenities: (
      <>
        {" "}
        {hotel.amenities.length > 0 && (
          <ScrollReveal>
            <section className={websiteClassName("home-experiences home-section")}>
              <div className={websiteClassName("container")}>
                <div className={websiteClassName("home-section-heading")}>
                  <div>
                    <p className={websiteClassName("eyebrow")}>
                      {sectionCopy("amenities")?.eyebrow || "More than a room"}
                    </p>
                    <Heading as="h2" className={websiteClassName("section-title")}>
                      {sectionCopy("amenities")?.title || (
                        <>
                          {" "}
                          Make time for
                          <br />
                          <em>the good things.</em>{" "}
                        </>
                      )}
                    </Heading>
                  </div>
                  <Link
                    hotel={hotel}
                    href="/experiences"
                    className={websiteClassName("home-text-link")}
                  >
                    Explore amenities <ArrowUpRight size={19} />
                  </Link>
                </div>
                <div
                  className={websiteClassName(
                    "home-experience-grid !grid-cols-1 sm:!grid-cols-2 xl:!grid-cols-4 [&_article]:min-w-0",
                  )}
                >
                  {hotel.amenities.slice(0, 4).map((amenity, index) => (
                    <article key={amenity.id}>
                      <div
                        className={websiteClassName(
                          "home-experience-icon [&_svg]:!h-14 [&_svg]:!w-14 [&_svg]:!stroke-[1.25]",
                        )}
                      >
                        <AmenityIcon iconUrl={amenity.iconUrl} iconKey={amenity.iconKey} />
                        <span>0{index + 1}</span>
                      </div>
                      <Heading as="h3" className="!text-[1.75rem] !leading-9 md:!text-3xl">
                        {amenity.label}
                      </Heading>
                      <p className="!text-base !leading-8">{amenity.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        )}{" "}
      </>
    ),
    offers: (
      <>
        {" "}
        <ScrollReveal>
          <OfferSection offers={hotel.offers} copyOverride={sectionCopy("offers")} />
        </ScrollReveal>{" "}
      </>
    ),
    dining: (
      <>
        {" "}
        {dining && (
          <ScrollReveal>
            <section className={websiteClassName("container home-dining home-section")}>
              <div className={websiteClassName("home-dining-copy")}>
                <p className={websiteClassName("eyebrow")}>
                  {sectionCopy("dining")?.eyebrow || "At the table"}
                </p>
                <Heading as="h2" className={websiteClassName("section-title")}>
                  {sectionCopy("dining")?.title || dining.name}
                </Heading>
                <p>{dining.description}</p>
                {dining.hours && <small>{dining.hours}</small>}
                <Link hotel={hotel} href="/dining" className={websiteClassName("home-text-link")}>
                  Discover dining <ArrowUpRight size={19} />
                </Link>
              </div>
              {dining.image && (
                <div className={websiteClassName("home-dining-image")}>
                  <Image
                    src={dining.image.url}
                    alt={dining.image.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, 50vw"
                    className={websiteClassName("image-cover")}
                  />
                </div>
              )}
            </section>
          </ScrollReveal>
        )}{" "}
      </>
    ),
    testimonials: (
      <>
        {" "}
        {Boolean(hotel.testimonials?.length) && (
          <ScrollReveal>
            <section className={websiteClassName("container home-reviews home-section")}>
              <div className={websiteClassName("home-section-heading")}>
                <div>
                  <p className={websiteClassName("eyebrow")}>
                    {sectionCopy("testimonials")?.eyebrow || "From our guestbook"}
                  </p>
                  <Heading as="h2" className={websiteClassName("section-title")}>
                    {sectionCopy("testimonials")?.title || (
                      <>
                        {" "}
                        Good stays.
                        <br />
                        <em>Great memories.</em>{" "}
                      </>
                    )}
                  </Heading>
                </div>
                <Link hotel={hotel} href="/reviews" className={websiteClassName("home-text-link")}>
                  All guest reviews <ArrowUpRight size={19} />
                </Link>
              </div>
              <div className={websiteClassName("home-review-grid")}>
                {hotel.testimonials!.slice(0, 2).map((review) => (
                  <blockquote key={review.id}>
                    <Quote size={30} aria-hidden="true" />
                    <p>{review.quote}</p>
                    <footer>
                      <span className={websiteClassName("home-guest-avatar")} aria-hidden="true">
                        {review.guestName.slice(0, 1)}
                      </span>
                      <div>
                        <strong>{review.guestName}</strong>
                        {review.location && <span>{review.location}</span>}
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}{" "}
      </>
    ),
    gallery: (
      <>
        {" "}
        {hotel.gallery.length > 0 && (
          <ScrollReveal>
            <section className={websiteClassName("container home-gallery home-section")}>
              <div className={websiteClassName("home-section-heading")}>
                <div>
                  <p className={websiteClassName("eyebrow")}>
                    {sectionCopy("gallery")?.eyebrow || "Take a look around"}
                  </p>
                  <Heading as="h2" className={websiteClassName("section-title")}>
                    {sectionCopy("gallery")?.title || <> Picture yourself here. </>}
                  </Heading>
                </div>
                <Link hotel={hotel} href="/gallery" className={websiteClassName("home-text-link")}>
                  The full gallery <ArrowUpRight size={19} />
                </Link>
              </div>
              <GalleryGrid images={hotel.gallery.slice(0, 3)} />
            </section>
          </ScrollReveal>
        )}{" "}
      </>
    ),
    booking: (
      <>
        {" "}
        <ScrollReveal>
          <FinalCta hotel={hotel} copyOverride={sectionCopy("booking")} />
        </ScrollReveal>{" "}
      </>
    ),
  };
  const configured = hotel.website?.homeSections ?? [
    { id: "rooms", enabled: true },
    { id: "story", enabled: true },
    { id: "amenities", enabled: true },
    { id: "offers", enabled: true },
    { id: "dining", enabled: true },
    { id: "testimonials", enabled: true },
    { id: "gallery", enabled: true },
    { id: "booking", enabled: true },
  ];
  return (
    <main className={websiteClassName("hotel-home")}>
      <HeroSection hotel={hotel} />
      {pageEnabled(hotel, "booking") && (
        <div className={websiteClassName("container home-booking [&_.booking-widget]:!border-t-0")}>
          <div className={websiteClassName("home-booking-heading !border-b-0")}>
            <span className={websiteClassName("eyebrow")}>Your next getaway</span>
            <p>A room. A date. Something to look forward to.</p>
          </div>
          <BookingWidget compact />
        </div>
      )}
      {configured
        .filter((section) => section.enabled)
        .map((section) => {
          const target = (
            {
              rooms: "rooms",
              story: "about",
              amenities: "experiences",
              testimonials: "reviews",
              offers: "offers",
              dining: "dining",
              gallery: "gallery",
              booking: "booking",
              location: "contact",
            } as const
          )[section.id];
          return target && pageEnabled(hotel, target) ? (
            <div key={section.id} data-home-section={section.id}>
              {sections[section.id]}
            </div>
          ) : null;
        })}
    </main>
  );
}
