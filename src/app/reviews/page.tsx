import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { PublicPageLink as Link } from "@/components/common/PublicPageLink";
import { EmptyState } from "@/components/common/Status";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function generateMetadata() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  return { ...createHotelMetadata(hotel, "/reviews"), title: `Guest Reviews | ${hotel.name}` };
}

export default async function ReviewsPage() {
  const hotel = await getWebsiteProvider().getHotel(await resolveTenant());
  if (!pageEnabled(hotel, "reviews")) notFound();
  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.reviews.eyebrow || <>Guest stories</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4")}>
          {hotel.website?.pages.reviews.title || "In our guests&apos; words."}
        </Heading>
        {hotel.testimonials?.length ? (
          <div className={websiteClassName("mt-12 grid gap-6 md:grid-cols-2")}>
            {hotel.testimonials.map((review) => (
              <blockquote
                key={review.id}
                className={websiteClassName("surface-panel bg-surface p-8 md:p-12")}
              >
                <p className={websiteClassName("font-display text-2xl leading-snug")}>
                  {hotel.website?.pages.reviews.description || <>&ldquo;{review.quote}&rdquo;</>}
                </p>
                <footer className={websiteClassName("mt-7 text-sm font-semibold text-muted")}>
                  {review.guestName}
                  {review.location ? `, ${review.location}` : ""}
                </footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No guest stories are listed yet"
            message="Explore the rooms and contact the hotel with questions about your stay."
          />
        )}
        <Link hotel={hotel} href="/rooms" className={websiteClassName("brand-button mt-10")}>
          <span className={websiteClassName("button-text-container")}>
            <span className={websiteClassName("button-text")}>Explore rooms</span>
          </span>
        </Link>
      </main>
    </SiteShell>
  );
}
