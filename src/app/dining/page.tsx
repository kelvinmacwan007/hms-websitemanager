import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { EmptyState } from "@/components/common/Status";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function generateMetadata() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  return { ...createHotelMetadata(hotel, "/dining"), title: `Dining | ${hotel.name}` };
}

export default async function DiningPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "dining")) notFound();
  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.dining.eyebrow || <>Dining</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          {hotel.website?.pages.dining.title || "Good food, at your own pace."}
        </Heading>
        {hotel.website?.pages.dining.description && (
          <p className="mt-5 text-lg leading-8">{hotel.website.pages.dining.description}</p>
        )}
        {!hotel.dining?.length ? (
          <EmptyState
            title="Dining details are not listed"
            message="Contact the hotel for current dining options."
          />
        ) : (
          <div className={websiteClassName("mt-12 space-y-16")}>
            {hotel.dining.map((venue, index) => (
              <ScrollReveal key={venue.id}>
                <section
                  className={websiteClassName(
                    "grid gap-8 border-t border-line pt-8 lg:grid-cols-2 lg:items-center",
                  )}
                >
                  <div className={websiteClassName(index % 2 ? "lg:order-2" : "")}>
                    <Heading as="h2" className={websiteClassName("font-display text-4xl")}>
                      {venue.name}
                    </Heading>
                    <p className={websiteClassName("mt-5 max-w-xl text-lg leading-8 text-muted")}>
                      {venue.description}
                    </p>
                    {venue.hours ? (
                      <p className={websiteClassName("mt-6 text-sm font-semibold uppercase")}>
                        Open {venue.hours}
                      </p>
                    ) : null}
                    <Link
                      hotel={hotel}
                      className={websiteClassName("ghost-button mt-8")}
                      href="/contact"
                    >
                      Contact the hotel
                    </Link>
                  </div>
                  {venue.image ? (
                    <Image
                      src={venue.image.url}
                      alt={venue.image.alt}
                      width={1000}
                      height={700}
                      className={websiteClassName(
                        "image-frame image-motion aspect-[4/3] w-full object-cover",
                      )}
                    />
                  ) : null}
                </section>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
