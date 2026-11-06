import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { ArrowUpRight, Quote } from "lucide-react";
import { AmenityIcon } from "@/components/amenities/AmenityIcon";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { defaultTemplateCopy as copy } from "@/templates/default/copy";

export async function generateMetadata() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel, "/about");
}

export default async function AboutPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "about")) notFound();
  const images = [...hotel.gallery, ...(hotel.heroImage ? [hotel.heroImage] : [])].filter(
    (image, index, all) => all.findIndex((item) => item.id === image.id) === index,
  );
  const highlights = hotel.amenities.slice(0, 3);
  const stats = [
    { value: hotel.rooms.length, label: hotel.rooms.length === 1 ? "Room type" : "Room types" },
    { value: hotel.amenities.length, label: "Guest amenities" },
    {
      value: hotel.dining?.length ?? 0,
      label: hotel.dining?.length === 1 ? "Dining venue" : "Dining venues",
    },
    { value: hotel.gallery.length, label: "Hotel photos" },
  ].filter((item) => item.value > 0);

  return (
    <SiteShell hotel={hotel}>
      <main>
        <ScrollReveal>
          <section
            className={websiteClassName(
              "container grid gap-10 py-12 md:py-16 lg:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14",
            )}
          >
            <div
              className={websiteClassName(
                "grid min-h-[360px] md:min-h-[520px] grid-cols-2 grid-rows-2 gap-4",
              )}
            >
              {images[0] ? (
                <div className={websiteClassName("image-frame relative row-span-2")}>
                  <Image
                    src={images[0].url}
                    alt={images[0].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 28vw"
                    className={websiteClassName("image-cover image-motion")}
                    priority
                  />
                </div>
              ) : (
                <div className={websiteClassName("row-span-2 bg-brand-soft")} />
              )}
              {images[1] ? (
                <div className={websiteClassName("image-frame relative mt-16")}>
                  <Image
                    src={images[1].url}
                    alt={images[1].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 28vw"
                    className={websiteClassName("image-cover image-motion")}
                  />
                </div>
              ) : null}
              {images[2] ? (
                <div className={websiteClassName("image-frame relative mb-16")}>
                  <Image
                    src={images[2].url}
                    alt={images[2].alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 28vw"
                    className={websiteClassName("image-cover image-motion")}
                  />
                </div>
              ) : null}
            </div>
            <div>
              <p className={websiteClassName("eyebrow")}>
                {hotel.website?.pages.about.eyebrow || <>{copy.about.eyebrow}</>}
              </p>
              <Heading as="h1" className={websiteClassName("section-title mt-4")}>
                {hotel.website?.pages.about.title || copy.about.title}
              </Heading>
              <p className={websiteClassName("mt-6 text-lg leading-8 text-muted")}>
                {hotel.website?.pages.about.description || (
                  <>{hotel.longDescription ?? hotel.description}</>
                )}
              </p>
              {highlights.length ? (
                <ul className={websiteClassName("mt-7 grid gap-4")}>
                  {highlights.map((item) => (
                    <li key={item.id} className={websiteClassName("flex items-start gap-3")}>
                      <span className={websiteClassName("mt-2 h-1.5 w-1.5 rotate-45 bg-brand")} />
                      <span>
                        <strong>{item.label}</strong>
                        {item.description ? (
                          <span
                            className={websiteClassName("mt-1 block text-sm leading-6 text-muted")}
                          >
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              <Link hotel={hotel} href="/rooms" className={websiteClassName("brand-button mt-8")}>
                <span className={websiteClassName("button-text-container")}>
                  <span className={websiteClassName("button-text")}>
                    Explore rooms <ArrowUpRight size={17} />
                  </span>
                </span>
              </Link>
            </div>
          </section>
        </ScrollReveal>

        {stats.length ? (
          <ScrollReveal>
            <section
              className={websiteClassName(
                "container grid gap-4 border-y border-line py-12 sm:grid-cols-2 lg:grid-cols-4",
              )}
              aria-label="Hotel at a glance"
            >
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className={websiteClassName(
                    "grid aspect-square w-full max-w-64 place-items-center justify-self-center rounded-full border border-line text-center",
                  )}
                >
                  <div>
                    <strong className={websiteClassName("font-display text-5xl md:text-6xl")}>
                      {stat.value}
                    </strong>
                    <span className={websiteClassName("mt-2 block text-sm text-muted")}>
                      {stat.label}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          </ScrollReveal>
        ) : null}

        {hotel.amenities.length ? (
          <section className={websiteClassName("mt-16 bg-surface py-12 md:py-16 lg:py-20")}>
            <ScrollReveal className={websiteClassName("container")}>
              <div
                className={websiteClassName(
                  "flex flex-col justify-between gap-5 md:flex-row md:items-end",
                )}
              >
                <div>
                  <p className={websiteClassName("eyebrow")}>Services and spaces</p>
                  <Heading as="h2" className={websiteClassName("section-title mt-3")}>
                    Spaces and services for your stay.
                  </Heading>
                </div>
                <Link
                  hotel={hotel}
                  href="/experiences"
                  className={websiteClassName("ghost-button")}
                >
                  All experiences
                </Link>
              </div>
              <div
                className={websiteClassName(
                  "mt-10 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2 lg:grid-cols-4",
                )}
              >
                {hotel.amenities.slice(0, 8).map((amenity) => (
                  <article
                    key={amenity.id}
                    className={websiteClassName("flex min-h-64 flex-col bg-surface p-7")}
                  >
                    <span className={websiteClassName("text-brand")}>
                      <AmenityIcon
                        iconUrl={amenity.iconUrl}
                        iconKey={amenity.iconKey}
                        label={amenity.label}
                      />
                    </span>
                    <Heading as="h3" className={websiteClassName("mt-7 font-display text-2xl")}>
                      {amenity.label}
                    </Heading>
                    {amenity.description ? (
                      <p className={websiteClassName("mt-3 text-sm leading-6 text-muted")}>
                        {amenity.description}
                      </p>
                    ) : null}
                    <Link
                      hotel={hotel}
                      href="/experiences"
                      className={websiteClassName(
                        "mt-auto flex items-center justify-between border-t border-line pt-5 text-sm font-semibold",
                      )}
                    >
                      More details <ArrowUpRight size={17} />
                    </Link>
                  </article>
                ))}
              </div>
            </ScrollReveal>
          </section>
        ) : null}

        {hotel.testimonials?.length ? (
          <ScrollReveal>
            <section className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
              <div className={websiteClassName("text-center")}>
                <p className={websiteClassName("eyebrow")}>Guest perspectives</p>
                <Heading as="h2" className={websiteClassName("section-title mt-3")}>
                  Words from our guests
                </Heading>
              </div>
              <div className={websiteClassName("mt-10 grid gap-6 lg:grid-cols-3")}>
                {hotel.testimonials.slice(0, 3).map((testimonial) => (
                  <blockquote
                    key={testimonial.id}
                    className={websiteClassName(
                      "surface-panel glass-panel flex min-h-72 flex-col p-7",
                    )}
                  >
                    <Quote size={30} className={websiteClassName("text-brand")} />
                    <p className={websiteClassName("mt-6 font-display text-2xl leading-9")}>
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <footer className={websiteClassName("mt-auto pt-8")}>
                      <strong>{testimonial.guestName}</strong>
                      {testimonial.location ? (
                        <span className={websiteClassName("text-sm text-muted")}>
                          {`, ${testimonial.location}`}
                        </span>
                      ) : null}
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          </ScrollReveal>
        ) : null}

        {hotel.policies?.length ? (
          <ScrollReveal>
            <section className={websiteClassName("container pb-16")}>
              <div className={websiteClassName("border-t border-line pt-12")}>
                <p className={websiteClassName("eyebrow")}>Before your stay</p>
                <Heading as="h2" className={websiteClassName("mt-3 font-display text-4xl")}>
                  Hotel policies
                </Heading>
                <div
                  className={websiteClassName(
                    "mt-7 grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3",
                  )}
                >
                  {hotel.policies.map((policy) => (
                    <article className={websiteClassName("bg-surface p-6")} key={policy.title}>
                      <Heading as="h3" className={websiteClassName("text-lg font-bold")}>
                        {policy.title}
                      </Heading>
                      <p className={websiteClassName("mt-3 leading-7 text-muted")}>
                        {policy.description}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </ScrollReveal>
        ) : null}
      </main>
    </SiteShell>
  );
}
