import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import Image from "next/image";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { AmenitiesGrid } from "@/components/amenities/AmenitiesGrid";
import { EmptyState } from "@/components/common/Status";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";
import { AddOnList } from "@/components/extras/AddOnList";
import { propertyDate } from "@/lib/booking/settings";

export async function generateMetadata() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  return { ...createHotelMetadata(hotel, "/experiences"), title: `Experiences | ${hotel.name}` };
}

export default async function ExperiencesPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "experiences")) notFound();
  const today = propertyDate(hotel.timeZone);
  const addOns = (hotel.addOns || []).filter((item) => !item.endDate || item.endDate >= today);
  const image = hotel.gallery.find((item) => /spa|pool|lounge/i.test(item.alt)) ?? hotel.gallery[0];
  return (
    <SiteShell hotel={hotel}>
      <main>
        <ScrollReveal>
          <section
            className={websiteClassName(
              "container grid gap-10 py-12 md:py-16 lg:py-20 lg:grid-cols-2 lg:items-center",
            )}
          >
            <div>
              <p className={websiteClassName("eyebrow")}>
                {hotel.website?.pages.experiences.eyebrow || <>Experiences</>}
              </p>
              <Heading as="h1" className={websiteClassName("section-title mt-4")}>
                {hotel.website?.pages.experiences.title || "Make room for more."}
              </Heading>
              <p className={websiteClassName("mt-6 max-w-xl text-lg leading-8 text-muted")}>
                {hotel.website?.pages.experiences.description || (
                  <>Discover the spaces and services that shape a stay at {hotel.name}.</>
                )}
              </p>
              <Link hotel={hotel} href="/contact" className={websiteClassName("ghost-button mt-8")}>
                Ask our team
              </Link>
            </div>
            {image ? (
              <Image
                src={image.url}
                alt={image.alt}
                width={1000}
                height={750}
                className={websiteClassName(
                  "image-frame image-motion aspect-[4/3] w-full object-cover",
                )}
              />
            ) : null}
          </section>
        </ScrollReveal>
        {hotel.amenities.length ? (
          <AmenitiesGrid amenities={hotel.amenities} />
        ) : (
          <EmptyState
            title="Amenity details are not listed"
            message="Contact the hotel for available services."
          />
        )}
        {addOns.length || hotel.addOnsUnavailable ? (
          <section className="container py-12" aria-labelledby="hotel-add-ons">
            <p className="eyebrow">Extra services</p>
            <Heading as="h2" className="section-title mt-4" id="hotel-add-ons">
              Make more of your stay.
            </Heading>
            <p className="mt-4 mb-8 text-muted">
              Contact the hotel to confirm availability, charging basis and the final price for your
              stay.
            </p>
            {hotel.addOnsUnavailable ? (
              <p role="status">
                Extra services are temporarily unavailable. Please contact the hotel.
              </p>
            ) : (
              <AddOnList items={addOns} />
            )}
            <Link hotel={hotel} href="/contact" className="ghost-button mt-8">
              Enquire about extras
            </Link>
          </section>
        ) : null}
      </main>
    </SiteShell>
  );
}
