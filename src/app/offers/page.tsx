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
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel, "/offers");
}

export default async function OffersPage() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  if (!pageEnabled(hotel, "offers")) notFound();
  const offers = hotel.offers ?? [];

  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.offers.eyebrow || <>Offers</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4 max-w-3xl")}>
          {hotel.website?.pages.offers.title || "Offers and stay packages."}
        </Heading>
        <p className={websiteClassName("mt-5 max-w-2xl text-lg leading-8 text-muted")}>
          {hotel.website?.pages.offers.description || (
            <>
              Explore ideas for your next stay. Contact the hotel to confirm package availability,
              inclusions, and applicable dates before making a reservation.
            </>
          )}
        </p>
        {!offers.length ? (
          <EmptyState
            title="No stay offers are listed"
            message="Contact the hotel to ask about current packages and stay options."
          />
        ) : (
          <div className={websiteClassName("mt-10 grid gap-6 lg:grid-cols-2")}>
            {offers.map((offer) => (
              <ScrollReveal key={offer.id}>
                <article className={websiteClassName("premium-card glow-card overflow-hidden")}>
                  {offer.image ? (
                    <Image
                      src={offer.image.url}
                      alt={offer.image.alt}
                      width={900}
                      height={620}
                      className={websiteClassName("aspect-[16/10] w-full object-cover")}
                    />
                  ) : null}
                  <div className={websiteClassName("p-7")}>
                    {offer.badge ? (
                      <p className={websiteClassName("eyebrow")}>{offer.badge}</p>
                    ) : null}
                    <Heading as="h2" className={websiteClassName("mt-3 font-display text-4xl")}>
                      {offer.title}
                    </Heading>
                    <p className={websiteClassName("mt-4 leading-7 text-muted")}>
                      {offer.description}
                    </p>
                    <Link
                      hotel={hotel}
                      className={websiteClassName("brand-button mt-7")}
                      href="/contact"
                    >
                      <span className={websiteClassName("button-text-container")}>
                        <span className={websiteClassName("button-text")}>
                          Enquire about this offer
                        </span>
                      </span>
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </main>
    </SiteShell>
  );
}
