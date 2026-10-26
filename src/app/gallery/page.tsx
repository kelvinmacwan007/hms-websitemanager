import { notFound } from "next/navigation";
import { pageEnabled } from "@/lib/website/pages";
import { Heading } from "@/components/common/Heading";
import { websiteClassName } from "@/lib/ui/websiteStyles";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { EmptyState } from "@/components/common/Status";
import { SiteShell } from "@/components/layout/SiteShell";
import { getWebsiteProvider } from "@/lib/api/provider";
import { createHotelMetadata } from "@/lib/seo/metadata";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export async function generateMetadata() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  return createHotelMetadata(hotel, "/gallery");
}

export default async function GalleryPage() {
  const tenant = await resolveTenant();
  const hotel = await getWebsiteProvider().getHotel(tenant);
  if (!pageEnabled(hotel, "gallery")) notFound();

  return (
    <SiteShell hotel={hotel}>
      <main className={websiteClassName("container py-12 md:py-16 lg:py-20")}>
        <p className={websiteClassName("eyebrow")}>
          {hotel.website?.pages.gallery.eyebrow || <>Gallery</>}
        </p>
        <Heading as="h1" className={websiteClassName("section-title mt-4 max-w-3xl")}>
          {hotel.website?.pages.gallery.title ||
            "A closer look at the rooms, spaces, and atmosphere."}
        </Heading>
        {hotel.website?.pages.gallery.description && (
          <p className="mt-5 text-lg leading-8">{hotel.website.pages.gallery.description}</p>
        )}
        <div className={websiteClassName("mt-10")}>
          {hotel.gallery.length ? (
            <GalleryGrid images={hotel.gallery} />
          ) : (
            <EmptyState
              title="No hotel photos are listed yet"
              message="Contact the hotel to learn more about its rooms and spaces."
            />
          )}
        </div>
      </main>
    </SiteShell>
  );
}
